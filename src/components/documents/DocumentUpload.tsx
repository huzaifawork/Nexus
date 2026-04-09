import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, AlertCircle, CheckCircle, Loader } from "lucide-react";
import toast from "react-hot-toast";
import { documentApi } from "../../lib/documentApi";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface Document {
  _id: string;
  title: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  status: string;
}

interface DocumentUploadProps {
  onUploadSuccess?: (document: Document) => void;
  acceptedFileTypes?: string[];
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadSuccess,
  acceptedFileTypes = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".txt",
    ".csv",
  ],
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce(
      (acc, ext) => {
        acc[`application/${ext.slice(1)}`] = [ext];
        return acc;
      },
      {} as Record<string, string[]>,
    ),
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    setUploading(true);

    try {
      for (const file of files) {
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        const document = await documentApi.uploadDocument(file, {
          title,
          description,
          tags: tags
            ? tags
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t)
            : [],
        });

        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
        onUploadSuccess?.(document);

        // Reset form after successful upload
        setFiles([]);
        setTitle("");
        setDescription("");
        setTags("");

        toast.success(`${file.name} uploaded successfully`);
      }
    } catch (error) {
      toast.error("Failed to upload document");
      console.error(error);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Upload Document
      </h3>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          isDragActive
            ? "border-primary-500 bg-primary-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-3 text-gray-400" size={32} />
        <p className="text-sm font-medium text-gray-900">
          {isDragActive
            ? "Drop files here"
            : "Drag & drop files here, or click to select"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Supported formats: {acceptedFileTypes.join(", ")}
        </p>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Selected Files ({files.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <File size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-2 text-red-500 hover:text-red-700 text-xs font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata Form */}
      {files.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Document Details
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Title *
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tags
              </label>
              <Input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Comma-separated tags (e.g., contract, legal, confidential)"
              />
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {Object.entries(uploadProgress).length > 0 && (
        <div className="mt-4 space-y-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="flex items-center gap-2">
              <span className="text-xs text-gray-600 flex-1 truncate">
                {fileName}
              </span>
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {progress === 100 ? (
                <CheckCircle
                  size={16}
                  className="text-green-500 flex-shrink-0"
                />
              ) : (
                <Loader
                  size={16}
                  className="text-primary-500 animate-spin flex-shrink-0"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <div className="mt-4 flex gap-2">
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || !title.trim() || uploading}
          className="flex-1"
        >
          {uploading ? (
            <>
              <Loader size={18} className="animate-spin mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={18} className="mr-2" />
              Upload {files.length === 1 ? "File" : `${files.length} Files`}
            </>
          )}
        </Button>
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-start gap-2">
        <AlertCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Maximum file size: 50 MB. Documents are stored securely and only
          accessible to you and those you share with.
        </p>
      </div>
    </div>
  );
};

export default DocumentUpload;
