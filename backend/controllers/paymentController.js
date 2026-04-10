const Transaction = require("../models/Transaction");
const PaymentMethod = require("../models/PaymentMethod");
const User = require("../models/User");

// Mock payment processing function
const processPaymentGateway = async (amount, paymentMethod, type) => {
  // Simulate payment processing
  // In production, this would call actual Stripe/PayPal APIs

  return new Promise((resolve) => {
    setTimeout(() => {
      // 95% success rate for demo
      const success = Math.random() > 0.05;
      resolve({
        success,
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: success ? "completed" : "failed",
        timestamp: new Date(),
      });
    }, 1000); // Simulate 1 second processing
  });
};

// @route  POST /api/payments/deposit
// @desc   Deposit money to wallet
exports.deposit = async (req, res) => {
  try {
    const { amount, paymentMethodId, currency = "USD", description } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    if (amount > 100000) {
      return res.status(400).json({ message: "Amount exceeds maximum limit" });
    }

    // Get payment method
    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (
      !paymentMethod ||
      paymentMethod.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    // Create pending transaction
    const transaction = new Transaction({
      userId: req.user._id,
      type: "deposit",
      amount,
      currency,
      description: description || "Wallet deposit",
      paymentMethod: paymentMethod.type,
      status: "pending",
      metadata: {
        cardLast4: paymentMethod.card?.last4,
        bankName: paymentMethod.bankAccount?.bankName,
      },
    });

    await transaction.save();

    // Simulate payment processing
    const paymentResult = await processPaymentGateway(
      amount,
      paymentMethod.type,
      "deposit",
    );

    transaction.status = paymentResult.status;
    transaction.completedAt = paymentResult.timestamp;

    if (paymentResult.success) {
      transaction.stripePaymentIntentId = paymentResult.transactionId;

      // Update wallet balance
      const user = await User.findById(req.user._id);
      if (!user.walletBalance) user.walletBalance = 0;
      user.walletBalance += amount;
      await user.save();
    } else {
      transaction.failureReason = "Payment declined by gateway";
    }

    await transaction.save();

    res.status(201).json({
      transaction,
      message: paymentResult.success ? "Deposit successful" : "Deposit failed",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/payments/withdraw
// @desc   Withdraw money from wallet
exports.withdraw = async (req, res) => {
  try {
    const { amount, paymentMethodId, currency = "USD", description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Create withdrawal fee (2%)
    const fee = Math.round(amount * 0.02 * 100) / 100;

    // Check wallet balance (including fee)
    const user = await User.findById(req.user._id);
    const totalRequired = amount + fee;
    if (!user.walletBalance || user.walletBalance < totalRequired) {
      return res.status(400).json({
        message: `Insufficient wallet balance. Required: $${totalRequired.toFixed(2)} (includes $${fee.toFixed(2)} fee), Available: $${user.walletBalance?.toFixed(2) || 0}`,
      });
    }

    // Get payment method
    const paymentMethod = await PaymentMethod.findById(paymentMethodId);
    if (
      !paymentMethod ||
      paymentMethod.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    // Create pending transaction
    const transaction = new Transaction({
      userId: req.user._id,
      type: "withdrawal",
      amount,
      currency,
      fee,
      feeReason: "Withdrawal fee",
      description: description || "Wallet withdrawal",
      paymentMethod: paymentMethod.type,
      status: "pending",
      metadata: {
        bankName: paymentMethod.bankAccount?.bankName,
      },
    });

    await transaction.save();

    // Simulate payment processing
    const paymentResult = await processPaymentGateway(
      amount,
      paymentMethod.type,
      "withdrawal",
    );

    transaction.status = paymentResult.status;
    transaction.completedAt = paymentResult.timestamp;

    if (paymentResult.success) {
      // Deduct from wallet
      user.walletBalance -= amount + fee;
      await user.save();
    } else {
      transaction.failureReason = "Withdrawal failed";
    }

    await transaction.save();

    res.status(201).json({
      transaction,
      message: paymentResult.success
        ? "Withdrawal successful"
        : "Withdrawal failed",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/payments/transfer
// @desc   Transfer money to another user
exports.transfer = async (req, res) => {
  try {
    const { amount, recipientId, description, currency = "USD" } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot transfer to yourself" });
    }

    // Create transfer fee (1%)
    const fee = Math.round(amount * 0.01 * 100) / 100;

    // Check sender balance (including fee)
    const sender = await User.findById(req.user._id);
    const totalRequired = amount + fee;
    if (!sender.walletBalance || sender.walletBalance < totalRequired) {
      return res.status(400).json({
        message: `Insufficient wallet balance. Required: $${totalRequired.toFixed(2)} (includes $${fee.toFixed(2)} fee), Available: $${sender.walletBalance?.toFixed(2) || 0}`,
      });
    }

    // Check recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // Create transfer-out transaction
    const transferOut = new Transaction({
      userId: req.user._id,
      type: "transfer_out",
      amount,
      currency,
      fee,
      feeReason: "Transfer fee",
      description: description || `Transfer to ${recipient.name}`,
      status: "completed",
      recipientId,
      completedAt: new Date(),
      metadata: {
        recipientName: recipient.name,
        recipientEmail: recipient.email,
      },
    });

    // Create transfer-in transaction for recipient
    const transferIn = new Transaction({
      userId: recipientId,
      type: "transfer_in",
      amount,
      currency,
      description: description || `Transfer from ${sender.name}`,
      status: "completed",
      completedAt: new Date(),
      metadata: {
        senderName: sender.name,
        senderEmail: sender.email,
      },
    });

    // Update wallet balances
    sender.walletBalance -= amount + fee;
    if (!recipient.walletBalance) recipient.walletBalance = 0;
    recipient.walletBalance += amount;

    // Save everything
    await transferOut.save();
    await transferIn.save();
    await sender.save();
    await recipient.save();

    res.status(201).json({
      message: "Transfer successful",
      transactions: {
        senderTransaction: transferOut,
        recipientTransaction: transferIn,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/payments/transactions
// @desc   Get transaction history
exports.getTransactions = async (req, res) => {
  try {
    const {
      type,
      status,
      startDate,
      endDate,
      limit = 20,
      page = 1,
    } = req.query;

    const filter = { userId: req.user._id };

    if (type) filter.type = type;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .populate("recipientId", "name email avatarUrl")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Transaction.countDocuments(filter);

    res.json({
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/payments/transactions/:id
// @desc   Get single transaction details
exports.getTransactionDetail = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("userId", "name email")
      .populate("recipientId", "name email");

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (
      transaction.userId.toString() !== req.user._id.toString() &&
      transaction.recipientId?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/payments/wallet
// @desc   Get wallet balance
exports.getWalletBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Get recent transactions for dashboard
    const recentTransactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate stats
    const allTransactions = await Transaction.find({
      userId: req.user._id,
      status: "completed",
    });

    const totalDeposited = allTransactions
      .filter((t) => t.type === "deposit")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawn = allTransactions
      .filter((t) => t.type === "withdrawal" || t.type === "transfer_out")
      .reduce((sum, t) => sum + (t.amount + (t.fee || 0)), 0);

    const totalTransferred = allTransactions
      .filter((t) => t.type === "transfer_in")
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      balance: user.walletBalance || 0,
      currency: "USD",
      stats: {
        totalDeposited,
        totalWithdrawn,
        totalTransferred,
        transactionCount: allTransactions.length,
      },
      recentTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/payments/payment-methods
// @desc   Add payment method
exports.addPaymentMethod = async (req, res) => {
  try {
    const { type, card, bankAccount, paypalEmail } = req.body;

    // Check if user already has a payment method
    const existingMethods = await PaymentMethod.countDocuments({
      userId: req.user._id,
    });
    const isDefault = existingMethods === 0;

    const paymentMethod = new PaymentMethod({
      userId: req.user._id,
      type,
      isDefault,
    });

    if (type === "card" && card) {
      paymentMethod.card = card;
    }
    if (type === "bank_account" && bankAccount) {
      paymentMethod.bankAccount = bankAccount;
    }
    if (type === "paypal" && paypalEmail) {
      paymentMethod.paypalEmail = paypalEmail;
    }

    await paymentMethod.save();

    res.status(201).json(paymentMethod);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/payments/payment-methods
// @desc   Get user's payment methods
exports.getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find({ userId: req.user._id });
    res.json(paymentMethods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  DELETE /api/payments/payment-methods/:id
// @desc   Delete payment method
exports.deletePaymentMethod = async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findById(req.params.id);

    if (
      !paymentMethod ||
      paymentMethod.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    await PaymentMethod.deleteOne({ _id: req.params.id });

    res.json({ message: "Payment method deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
