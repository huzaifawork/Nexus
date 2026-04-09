import React, { useState, useEffect } from "react";
import { X, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import axios, { AxiosError } from "axios";

interface ShareModalProps {
  documentId: string;
  documentTitle: string;
  onClose: () => void;
  onShareSuccess?: () => void;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  documentId,
  documentTitle,
  onClose,
  onShareSuccess,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [permission, setPermission] = useState<"view" | "edit" | "sign">(
    "view",
  );
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        setUsersError(null);
        const userStr = localStorage.getItem("business_nexus_user");
        const currentUser = userStr ? JSON.parse(userStr) : null;
        const token = currentUser?.token;

        console.log(
          "Fetching users with token:",
          !!token,
          "currentUser:",
          currentUser,
        );

        if (!token) {
          setUsersError("No authentication token found");
          setUsersLoading(false);
          return;
        }

        const response = await axios.get("http://localhost:5000/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Users response:", response.data);
        console.log("Total users:", response.data.users?.length);

        // Filter out current user
        const filteredUsers = response.data.users?.filter(
          (u: User) => u._id !== currentUser?._id,
        );
        console.log("Filtered users count:", filteredUsers?.length);
        setUsers(filteredUsers || []);
      } catch (error: unknown) {
        console.error("Failed to fetch users:", error);
        const errorMsg =
          error instanceof AxiosError
            ? error.response?.data?.message || error.message
            : "Failed to load users";
        setUsersError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleShare = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    setLoading(true);
    try {
      const userStr = localStorage.getItem("business_nexus_user");
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const token = currentUser?.token;

      await axios.post(
        `http://localhost:5000/api/documents/${documentId}/share`,
        {
          userId: selectedUserId,
          permission,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const selectedUser = users.find((u) => u._id === selectedUserId);
      toast.success(
        `Shared with ${selectedUser?.name || "user"} (${permission})`,
      );
      setSelectedUserId("");
      setPermission("view");

      onShareSuccess?.();
      setTimeout(onClose, 1000);
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share document");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Share Document
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
          {/* Document title */}
          <div>
            <p className="text-sm text-gray-600">Document</p>
            <p className="text-sm font-medium text-gray-900 truncate">
              {documentTitle}
            </p>
          </div>

          {/* User search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share with
            </label>
            <Input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {/* User list */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select User
            </label>
            {usersError && (
              <div className="p-3 mb-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {usersError}
              </div>
            )}
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              {usersLoading ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Loading users...
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => setSelectedUserId(user._id)}
                    className={`p-3 cursor-pointer border-b last:border-b-0 transition ${
                      selectedUserId === user._id
                        ? "bg-primary-50 border-l-4 border-l-primary-500"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-600">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {user.role}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {searchTerm ? "No users found" : "No other users available"}
                </div>
              )}
            </div>
          </div>

          {/* Permission level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permission Level
            </label>
            <div className="space-y-2">
              {[
                {
                  value: "view" as const,
                  label: "View Only",
                  desc: "Can view and download",
                },
                {
                  value: "edit" as const,
                  label: "Edit",
                  desc: "Can view and edit",
                },
                {
                  value: "sign" as const,
                  label: "Sign",
                  desc: "Can view, edit and sign",
                },
              ].map((perm) => (
                <div key={perm.value}>
                  <label className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="permission"
                      value={perm.value}
                      checked={permission === perm.value}
                      onChange={(e) =>
                        setPermission(e.target.value as typeof permission)
                      }
                      className="w-4 h-4 text-primary-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {perm.label}
                      </p>
                      <p className="text-xs text-gray-500">{perm.desc}</p>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={!selectedUserId || loading}
            leftIcon={<UserPlus size={16} />}
            className="flex-1"
          >
            {loading ? "Sharing..." : "Share"}
          </Button>
        </div>
      </div>
    </div>
  );
};
