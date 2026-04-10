import React, { useState, useEffect } from "react";
import { X, Loader, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

interface TransferModalProps {
  onSuccess?: () => void;
  onClose: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  onSuccess,
  onClose,
}) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientUser, setRecipientUser] = useState<any | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const transferFee = amount ? (parseFloat(amount) * 0.01).toFixed(2) : "0.00";
  const totalAmount = amount
    ? (parseFloat(amount) + parseFloat(transferFee)).toFixed(2)
    : "0.00";

  // Search for recipient when email changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (recipientEmail && recipientEmail !== user?.email) {
        try {
          setSearching(true);
          const response = await axios.get(
            `http://localhost:5000/api/users/search?email=${recipientEmail}`,
            {
              headers: {
                Authorization: `Bearer ${user?.token}`,
              },
            },
          );
          if (response.data.user) {
            setRecipientUser(response.data.user);
          } else {
            setRecipientUser(null);
            toast.error("User not found");
          }
        } catch (error) {
          setRecipientUser(null);
          console.error(error);
        } finally {
          setSearching(false);
        }
      } else if (!recipientEmail) {
        setRecipientUser(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [recipientEmail, user?.email, user?.token]);

  const handleTransfer = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!recipientUser) {
      toast.error("Please select a valid recipient");
      return;
    }

    if (recipientUser._id === user?._id) {
      toast.error("You cannot transfer to yourself");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:5000/api/payments/transfer",
        {
          amount: parseFloat(amount),
          recipientId: recipientUser._id,
          description,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        },
      );

      if (
        response.data.transactions?.senderTransaction?.status === "completed" &&
        response.data.transactions?.recipientTransaction?.status === "completed"
      ) {
        toast.success(
          `Transfer of $${amount} to ${recipientUser.name} successful!`,
        );
        onSuccess?.();
        onClose();
      } else {
        toast.error(response.data.message || "Transfer failed");
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to process transfer",
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
            Transfer Funds
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
            <p className="text-xs text-gray-500 mt-1">Transfer fee: 1%</p>
          </div>

          {/* Recipient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send To (Email Address)
            </label>
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              disabled={loading}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Enter the recipient's full email address (e.g., david@example.com)
            </p>
            {searching && (
              <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                <Loader size={12} className="animate-spin" /> Searching...
              </p>
            )}
            {recipientUser && !searching && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">
                  ✓ {recipientUser.name}
                </p>
                <p className="text-xs text-green-700">{recipientUser.email}</p>
              </div>
            )}
            {recipientEmail &&
              !recipientUser &&
              !searching &&
              recipientEmail !== user?.email && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600 font-medium">❌ User not found</p>
                  <p className="text-xs text-red-500 mt-1">
                    Make sure you entered a valid email address
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
              placeholder="e.g., Investment partnership payout"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="w-full"
            />
          </div>

          {/* Fee Warning */}
          {amount && recipientUser && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex gap-2">
              <AlertCircle
                size={16}
                className="text-blue-600 flex-shrink-0 mt-0.5"
              />
              <div className="text-sm">
                <p className="text-blue-800 font-medium">Transfer Details:</p>
                <p className="text-blue-700 text-xs mt-1">
                  Amount: ${parseFloat(amount).toFixed(2)}
                  <br />
                  Fee (1%): ${transferFee}
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
            onClick={handleTransfer}
            disabled={
              loading ||
              !amount ||
              !recipientUser ||
              recipientUser._id === user?._id
            }
            leftIcon={
              loading ? (
                <Loader size={18} className="animate-spin" />
              ) : undefined
            }
          >
            {loading ? "Processing..." : "Transfer"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;
