import React, { useState } from "react";
import { X, Loader } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

interface DepositModalProps {
  paymentMethods: any[];
  onSuccess?: () => void;
  onClose: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  paymentMethods,
  onSuccess,
  onClose,
}) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDeposit = async () => {
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
        "http://localhost:5000/api/payments/deposit",
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
        toast.success("Deposit successful! Funds added to your wallet.");
        onSuccess?.();
      } else {
        toast.error(response.data.message || "Deposit failed");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to process deposit");
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
          <h3 className="text-lg font-semibold text-gray-900">Deposit Funds</h3>
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
            <p className="text-xs text-gray-500 mt-1">
              Min: $1 | Max: $100,000
            </p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            {paymentMethods.length > 0 ? (
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
                    {method.isDefault && " (Default)"}
                  </option>
                ))}
              </select>
            ) : (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-blue-900 font-medium">
                  📌 No payment methods available
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Please add a payment method first using the "Add Method"
                  button on the Payments page.
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g., Investment fund"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="w-full"
            />
          </div>

          {/* Summary */}
          {amount && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                You will deposit:{" "}
                <span className="font-semibold text-blue-600">
                  ${parseFloat(amount).toFixed(2)}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Processing time: ~1 second (mock)
              </p>
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
            onClick={handleDeposit}
            disabled={loading || !amount || !selectedPaymentMethod}
            leftIcon={
              loading ? (
                <Loader size={18} className="animate-spin" />
              ) : undefined
            }
          >
            {loading ? "Processing..." : "Deposit"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
