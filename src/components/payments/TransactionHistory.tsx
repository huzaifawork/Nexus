import React, { useState, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";

interface Transaction {
  _id: string;
  type: "deposit" | "withdrawal" | "transfer_out" | "transfer_in" | "refund";
  amount: number;
  status: "pending" | "completed" | "failed" | "cancelled";
  description: string;
  createdAt: string;
  fee?: number;
}

export const TransactionHistory: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchTransactions();
  }, [page, filter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const query =
        filter !== "all"
          ? `?type=${filter}&limit=${limit}&page=${page}`
          : `?limit=${limit}&page=${page}`;
      const response = await axios.get(
        `http://localhost:5000/api/payments/transactions${query}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        },
      );
      setTransactions(response.data.transactions);
      setTotalPages(Math.ceil(response.data.total / limit));
    } catch (error: any) {
      toast.error("Failed to load transactions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="text-green-600" size={18} />;
      case "withdrawal":
        return <ArrowUpRight className="text-red-600" size={18} />;
      case "transfer_out":
        return <Send className="text-orange-600" size={18} />;
      case "transfer_in":
        return <ArrowDownLeft className="text-blue-600" size={18} />;
      case "refund":
        return <CheckCircle className="text-purple-600" size={18} />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      deposit: "Deposit",
      withdrawal: "Withdrawal",
      transfer_out: "Transfer Out",
      transfer_in: "Transfer In",
      refund: "Refund",
    };
    return labels[type] || type;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="text-green-600" size={16} />;
      case "pending":
        return <Clock className="text-yellow-600" size={16} />;
      case "failed":
      case "cancelled":
        return <XCircle className="text-red-600" size={16} />;
      default:
        return null;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAmountColor = (type: string) => {
    if (type === "deposit" || type === "transfer_in") return "text-green-600";
    if (type === "withdrawal" || type === "transfer_out") return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Transaction History
        </h3>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setFilter("all");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              setFilter("deposit");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "deposit"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Deposits
          </button>
          <button
            onClick={() => {
              setFilter("withdrawal");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "withdrawal"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Withdrawals
          </button>
          <button
            onClick={() => {
              setFilter("transfer_out");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "transfer_out"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Transfers
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader className="animate-spin mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Loading transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-500">No transactions found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction._id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg">
                          {getTypeIcon(transaction.type)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {getTypeLabel(transaction.type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td
                      className={`px-6 py-4 text-right text-sm font-semibold ${getAmountColor(transaction.type)}`}
                    >
                      {transaction.type === "withdrawal" ||
                      transaction.type === "transfer_out"
                        ? "-"
                        : "+"}
                      ${transaction.amount.toFixed(2)}
                      {transaction.fee && transaction.fee > 0 && (
                        <span className="text-xs text-gray-500 block">
                          Fee: ${transaction.fee.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getStatusIcon(transaction.status)}
                        <span className="text-xs font-medium capitalize text-gray-600">
                          {transaction.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {transaction.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 p-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransactionHistory;
