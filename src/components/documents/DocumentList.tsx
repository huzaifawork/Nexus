import React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  File,
  Download,
  Trash2,
  Share2,
  Eye,
  FileText,
  CheckCircle,
  Loader,
} from "lucide-react";
import toast from "react-hot-toast";
import { documentApi } from "../../lib/documentApi";
import { Badge } from "../ui/Badge";

interface DocumentData {
  _id: string;
  title: string;
  description: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  status: "draft" | "active" | "archived" | "signed";
}

interface DocumentListProps {
  documents: DocumentData[];
  onDocumentSelect?: (document: DocumentData) => void;
  onDelete?: (documentId: string) => void;
  onShare?: (documentId: string) => void;
  onSign?: (documentId: string) => void;
  loading?: boolean;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDocumentSelect,
  onDelete,
  onShare,
  onSign,
  loading = false,
}) => {
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("pdf"))
      return <FileText size={20} className="text-red-500" />;
    if (mimeType.includes("word") || mimeType.includes("document"))
      return <FileText size={20} className="text-blue-500" />;
    if (mimeType.includes("sheet") || mimeType.includes("excel"))
      return <FileText size={20} className="text-green-500" />;
    return <File size={20} className="text-gray-500" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "signed":
        return <Badge className="bg-green-100 text-green-800">Signed</Badge>;
      case "archived":
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>;
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleDownload = async (doc: DocumentData) => {
    try {
      const blob = await documentApi.downloadDocument(doc.filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Document downloaded");
    } catch {
      toast.error("Failed to download document");
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;

    try {
      await documentApi.deleteDocument(documentId);
      toast.success("Document deleted");
      onDelete?.(documentId);
    } catch {
      toast.error("Failed to delete document");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
        <File size={32} className="mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600">No documents yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Upload your first document to get started
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
              Size
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
              Uploaded
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr
              key={doc._id}
              className="border-b border-gray-200 hover:bg-gray-50 transition cursor-pointer"
              onClick={() => onDocumentSelect?.(doc)}
            >
              {/* Name */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {getFileIcon(doc.mimeType)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {doc.originalName}
                    </p>
                  </div>
                </div>
              </td>

              {/* Status */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {doc.status === "signed" && (
                    <CheckCircle size={16} className="text-green-500" />
                  )}
                  {getStatusBadge(doc.status)}
                </div>
              </td>

              {/* Size */}
              <td className="px-4 py-3">
                <span className="text-sm text-gray-600">
                  {formatFileSize(doc.size)}
                </span>
              </td>

              {/* Date */}
              <td className="px-4 py-3">
                <span className="text-sm text-gray-600">
                  {formatDistanceToNow(new Date(doc.uploadedAt), {
                    addSuffix: true,
                  })}
                </span>
              </td>

              {/* Actions */}
              <td className="px-4 py-3">
                <div
                  className="flex items-center justify-end gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onDocumentSelect?.(doc)}
                    className="p-1 hover:bg-gray-200 rounded transition"
                    title="View"
                  >
                    <Eye size={16} className="text-gray-600" />
                  </button>

                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-1 hover:bg-gray-200 rounded transition"
                    title="Download"
                  >
                    <Download size={16} className="text-gray-600" />
                  </button>

                  {doc.status !== "signed" && (
                    <button
                      onClick={() => onSign?.(doc._id)}
                      className="p-1 hover:bg-gray-200 rounded transition"
                      title="Sign"
                    >
                      <CheckCircle size={16} className="text-gray-600" />
                    </button>
                  )}

                  <button
                    onClick={() => onShare?.(doc._id)}
                    className="p-1 hover:bg-gray-200 rounded transition"
                    title="Share"
                  >
                    <Share2 size={16} className="text-gray-600" />
                  </button>

                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="p-1 hover:bg-red-100 rounded transition"
                    title="Delete"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentList;
