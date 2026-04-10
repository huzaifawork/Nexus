import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Send,
  Download,
  Upload,
  CreditCard,
  Loader,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import DepositModal from "../../components/payments/DepositModal";
import WithdrawModal from "../../components/payments/WithdrawModal";
import TransferModal from "../../components/payments/TransferModal";
import TransactionHistory from "../../components/payments/TransactionHistory";
import AddPaymentMethodModal from "../../components/payments/AddPaymentMethodModal";

interface WalletStats {
  balance: number;
  currency: string;
  stats: {
    totalDeposited: number;
    totalWithdrawn: number;
    totalTransferred: number;
    transactionCount: number;
  };
}

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  useEffect(() => {
    loadWalletData();
    loadPaymentMethods();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:5000/api/payments/wallet",
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        },
      );
      setWalletData(response.data);
    } catch (error) {
      toast.error("Failed to load wallet data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/payments/payment-methods",
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        },
      );
      setPaymentMethods(response.data);
    } catch (error) {
      console.error("Failed to load payment methods", error);
    }
  };

  const handleActionSuccess = () => {
    // Small delay to ensure backend has processed the transaction
    setTimeout(() => {
      loadWalletData();
      loadPaymentMethods();
    }, 500);
    setShowDepositModal(false);
    setShowWithdrawModal(false);
    setShowTransferModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payments & Wallet
          </h1>
          <p className="text-gray-600">Manage your funds and transactions</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={loadWalletData}
          leftIcon={
            loading ? <Loader size={16} className="animate-spin" /> : undefined
          }
        >
          Refresh Balance
        </Button>
      </div>

      {/* Wallet Balance Card */}
      {walletData && (
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700">
          <CardBody className="text-white">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-blue-100 text-sm">Wallet Balance</p>
                <h2 className="text-4xl font-bold">
                  {walletData.currency} {walletData.balance.toFixed(2)}
                </h2>
              </div>
              <DollarSign size={32} className="text-blue-200" />
            </div>
            <p className="text-blue-100 text-xs">
              Account ID: {user?._id?.slice(-8)}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          className="w-full"
          leftIcon={<Upload size={18} />}
          onClick={() => setShowDepositModal(true)}
        >
          Deposit Funds
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          leftIcon={<Download size={18} />}
          onClick={() => setShowWithdrawModal(true)}
          disabled={!walletData || walletData.balance === 0}
        >
          Withdraw Funds
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          leftIcon={<Send size={18} />}
          onClick={() => setShowTransferModal(true)}
          disabled={!walletData || walletData.balance === 0}
        >
          Transfer Money
        </Button>
      </div>

      {/* Stats Grid */}
      {walletData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardBody>
              <p className="text-sm text-gray-600">Total Deposited</p>
              <p className="text-2xl font-bold text-green-600">
                ${walletData.stats.totalDeposited.toFixed(2)}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-gray-600">Total Withdrawn</p>
              <p className="text-2xl font-bold text-red-600">
                ${walletData.stats.totalWithdrawn.toFixed(2)}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-gray-600">Total Transferred</p>
              <p className="text-2xl font-bold text-blue-600">
                ${walletData.stats.totalTransferred.toFixed(2)}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {walletData.stats.transactionCount}
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Payment Methods */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Payment Methods
          </h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowAddPaymentModal(true)}
            leftIcon={<Plus size={16} />}
          >
            Add Method
          </Button>
        </CardHeader>
        <CardBody>
          {paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method._id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {method.type.charAt(0).toUpperCase() +
                        method.type.slice(1).replace("_", " ")}
                    </p>
                    <p className="text-sm text-gray-600">
                      {method.card?.last4 && `**** ${method.card.last4}`}
                      {method.bankAccount?.bankName &&
                        method.bankAccount.bankName}
                      {method.paypalEmail && method.paypalEmail}
                    </p>
                  </div>
                  {method.isDefault && (
                    <Badge className="bg-blue-100 text-blue-800">Default</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-3">No payment methods added yet</p>
              <Button
                size="sm"
                onClick={() => setShowAddPaymentModal(true)}
                leftIcon={<Plus size={16} />}
              >
                Add Your First Payment Method
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Transaction History */}
      <TransactionHistory />

      {/* Modals */}
      {showDepositModal && (
        <DepositModal
          paymentMethods={paymentMethods}
          onSuccess={handleActionSuccess}
          onClose={() => setShowDepositModal(false)}
        />
      )}
      {showWithdrawModal && (
        <WithdrawModal
          paymentMethods={paymentMethods}
          onSuccess={handleActionSuccess}
          onClose={() => setShowWithdrawModal(false)}
        />
      )}
      {showTransferModal && (
        <TransferModal
          onSuccess={handleActionSuccess}
          onClose={() => setShowTransferModal(false)}
        />
      )}
      {showAddPaymentModal && (
        <AddPaymentMethodModal
          onSuccess={() => {
            loadPaymentMethods();
            setShowAddPaymentModal(false);
          }}
          onClose={() => setShowAddPaymentModal(false)}
        />
      )}
    </div>
  );
};
