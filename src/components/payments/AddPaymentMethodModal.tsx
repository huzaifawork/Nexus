import React, { useState } from "react";
import { X, Loader } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

interface AddPaymentMethodModalProps {
  onSuccess?: () => void;
  onClose: () => void;
}

export const AddPaymentMethodModal: React.FC<AddPaymentMethodModalProps> = ({
  onSuccess,
  onClose,
}) => {
  const { user } = useAuth();
  const [paymentType, setPaymentType] = useState("card");
  const [loading, setLoading] = useState(false);

  // Card fields
  const [cardNumber, setCardNumber] = useState("4242424242424242");
  const [cardExpiry, setCardExpiry] = useState("12/25");
  const [cardCVC, setCardCVC] = useState("123");
  const [cardName, setCardName] = useState("Test User");

  // Bank fields
  const [bankName, setBankName] = useState("Chase Bank");
  const [accountNumber, setAccountNumber] = useState("****1234");
  const [routingNumber, setRoutingNumber] = useState("021000021");
  const [accountHolder, setAccountHolder] = useState("Test User");

  // PayPal field
  const [paypalEmail, setPaypalEmail] = useState("test@example.com");

  const handleAddPaymentMethod = async () => {
    try {
      setLoading(true);

      let payload: any = {
        type: paymentType,
      };

      if (paymentType === "card") {
        payload.card = {
          last4: cardNumber.slice(-4),
          brand: "Visa",
          expiry: cardExpiry,
          holderName: cardName,
        };
      } else if (paymentType === "bank_account") {
        payload.bankAccount = {
          accountNumber,
          routingNumber,
          bankName,
          holderName: accountHolder,
        };
      } else if (paymentType === "paypal") {
        payload.paypalEmail = paypalEmail;
      }

      const response = await axios.post(
        "http://localhost:5000/api/payments/payment-methods",
        payload,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        },
      );

      toast.success(
        `${paymentType.replace("_", " ")} payment method added successfully!`,
      );
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to add payment method",
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            Add Payment Method
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
          {/* Payment Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="card">Credit/Debit Card</option>
              <option value="bank_account">Bank Account</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>

          {/* Payment Type Forms */}
          {paymentType === "card" && (
            <div className="space-y-3 bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-700 font-medium">
                Demo Mode: Using test card 4242 4242 4242 4242
              </p>
              <Input
                label="Cardholder Name"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                disabled={loading}
              />
              <Input
                label="Card Number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                disabled={loading}
                placeholder="4242 4242 4242 4242"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Expiry (MM/YY)"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  disabled={loading}
                  placeholder="12/25"
                />
                <Input
                  label="CVC"
                  type="password"
                  value={cardCVC}
                  onChange={(e) => setCardCVC(e.target.value)}
                  disabled={loading}
                  placeholder="123"
                />
              </div>
            </div>
          )}

          {paymentType === "bank_account" && (
            <div className="space-y-3 bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-green-700 font-medium">
                Demo Mode: Using test bank details
              </p>
              <Input
                label="Bank Name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                disabled={loading}
              />
              <Input
                label="Account Holder"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                disabled={loading}
              />
              <Input
                label="Account Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                disabled={loading}
              />
              <Input
                label="Routing Number"
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          {paymentType === "paypal" && (
            <div className="space-y-3 bg-yellow-50 p-3 rounded-lg">
              <p className="text-xs text-yellow-700 font-medium">
                Demo Mode: Using test PayPal email
              </p>
              <Input
                label="PayPal Email"
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <div className="bg-gray-100 p-3 rounded-lg">
            <p className="text-xs text-gray-600">
              💡 <strong>This is demo mode.</strong> No real charges will be
              made. Use the test details below for deposits.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex gap-2 sticky bottom-0 bg-white">
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
            onClick={handleAddPaymentMethod}
            disabled={loading}
            leftIcon={loading ? <Loader size={18} className="animate-spin" /> : undefined}
          >
            {loading ? "Adding..." : "Add Method"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddPaymentMethodModal;
