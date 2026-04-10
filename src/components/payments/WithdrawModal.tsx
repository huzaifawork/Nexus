import React, { useState } from "react";
import { X, Loader, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

interface WithdrawModalProps {
  paymentMethods: any[];
  onSuccess?: () => void;
  onClose: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  paymentMethods,
  onSuccess,
  onClose,
}) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const withdrawalFee = amount
    ? (parseFloat(amount) * 0.02).toFixed(2)
    : "0.00";
  const totalAmount = amount
    ? (parseFloat(amount) + parseFloat(withdrawalFee)).toFixed(2)
    : "0.00";

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:5000/api/payments/withdraw",
        {
          amount: parseFloat(amount),
          paymentMethodId: selectedPaymentMethod,
          description,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        },
      );

      if (response.data.transaction.status === "completed") {
        toast.success("Withdrawal successful! Funds sent to your account.");
        onSuccess?.();
      } else {
        toast.error(response.data.message || "Withdrawal failed");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to process withdrawal",
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Withdraw Funds
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (USD)
            </label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              disabled={loading}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Withdrawal fee: 2%</p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Withdraw To
            </label>
            {paymentMethods.filter((m) => m.type !== "wallet").length > 0 ? (
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a payment method</option>
                {paymentMethods.map((method) => (
                  <option key={method._id} value={method._id}>
                    {method.type.charAt(0).toUpperCase() +
                      method.type.slice(1).replace("_", " ")}{" "}
                    {method.card?.last4 && `- **** ${method.card.last4}`}
                    {method.bankAccount?.bankName &&
                      ` - ${method.bankAccount.bankName}`}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                No payment methods available. Add one first.
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g., Monthly payout"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="w-full"
            />
          </div>

          {/* Fee Warning */}
          {amount && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex gap-2">
              <AlertCircle
                size={16}
                className="text-yellow-600 flex-shrink-0 mt-0.5"
              />
              <div className="text-sm">
                <p className="text-yellow-800 font-medium">
                  Withdrawal Details:
                </p>
                <p className="text-yellow-700 text-xs mt-1">
                  Amount: ${parseFloat(amount).toFixed(2)}
                  <br />
                  Fee (2%): ${withdrawalFee}
                  <br />
                  <span className="font-semibold">Total: ${totalAmount}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleWithdraw}
            disabled={loading || !amount || !selectedPaymentMethod}
            leftIcon={
              loading ? (
                <Loader size={18} className="animate-spin" />
              ) : undefined
            }
          >
            {loading ? "Processing..." : "Withdraw"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;
