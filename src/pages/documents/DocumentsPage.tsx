import React, { useState, useEffect } from "react";
import { FileText, Plus, Settings, Share2, Palette } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { documentApi, signatureApi } from "../../lib/documentApi";
import { PDFViewer } from "../../components/documents/PDFViewer";
import {
  SignaturePad,
  TypedSignature,
} from "../../components/documents/SignaturePad";
import { DocumentUpload } from "../../components/documents/DocumentUpload";
import { DocumentList } from "../../components/documents/DocumentList";
import { ShareModal } from "../../components/documents/ShareModal";
import { useAuth } from "../../context/AuthContext";

type SignatureMode = "handwritten" | "typed" | null;

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "upload">("list");
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [signatureMode, setSignatureMode] = useState<SignatureMode>(null);
  const [signingDocumentId, setSigningDocumentId] = useState<string | null>(
    null,
  );
  const [showSharedDocs, setShowSharedDocs] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingDocumentId, setSharingDocumentId] = useState<string | null>(
    null,
  );
  const [stats, setStats] = useState({
    total: 0,
    signed: 0,
    shared: 0,
  });

  // Load documents
  useEffect(() => {
    loadDocuments();
  }, [showSharedDocs]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const docs = showSharedDocs
        ? await documentApi.getSharedDocuments()
        : await documentApi.getUserDocuments();

      setDocuments(docs);

      // Calculate stats
      const allDocs = await documentApi.getUserDocuments();
      setStats({
        total: allDocs.length,
        signed: allDocs.filter((d) => d.status === "signed").length,
        shared: allDocs.filter((d) => d.sharedWith.length > 0).length,
      });
    } catch (error) {
      toast.error("Failed to load documents");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentSelect = (doc: any) => {
    setSelectedDocument(doc);

    // If PDF, show viewer
    if (doc.mimeType === "application/pdf") {
      setShowPDFViewer(true);
    } else {
      // Otherwise download
      toast("Document will be opened in your default app");
    }
  };

  const handleSign = (documentId: string) => {
    setSigningDocumentId(documentId);
    setSignatureMode("handwritten");
  };

  const handleSignatureCapture = async (signatureImage: string) => {
    if (!signingDocumentId) return;

    try {
      await signatureApi.createSignature({
        documentId: signingDocumentId,
        signatureImage,
        signatureType:
          signatureMode === "handwritten" ? "handwritten" : "typed",
      });

      toast.success("Document signed successfully");
      setSignatureMode(null);
      setSigningDocumentId(null);
      loadDocuments();
    } catch (error) {
      toast.error("Failed to sign document");
      console.error(error);
    }
  };

  const handleShare = (documentId: string) => {
    const doc = documents.find((d) => d._id === documentId);
    if (doc) {
      setSelectedDocument(doc);
      setSharingDocumentId(documentId);
      setShowShareModal(true);
    }
  };

  const handleShareConfirm = async (userId: string, permission: string) => {
    if (!sharingDocumentId) return;

    try {
      await documentApi.shareDocument(sharingDocumentId, userId, permission);
      toast.success("Document shared successfully");
      setShowShareModal(false);
      setSharingDocumentId(null);
      loadDocuments();
    } catch (error) {
      toast.error("Failed to share document");
      console.error(error);
    }
  };

  const handleUploadSuccess = (doc: any) => {
    loadDocuments();
    setView("list");
  };

  const handleDelete = (documentId: string) => {
    loadDocuments();
  };

  const filteredDocuments =
    documents.length > 0
      ? documents.filter((d) => {
          if (showSharedDocs) return true;
          return d.uploadedBy._id === user?._id;
        })
      : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage, upload, and sign documents</p>
        </div>

        <Button leftIcon={<Plus size={18} />} onClick={() => setView("upload")}>
          Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText size={32} className="text-gray-400" />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Signed</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.signed}
              </p>
            </div>
            <Badge className="bg-green-100 text-green-800">Signed</Badge>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Shared</p>
              <p className="text-2xl font-bold text-blue-600">{stats.shared}</p>
            </div>
            <Share2 size={32} className="text-gray-400" />
          </CardBody>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => {
            setShowSharedDocs(false);
            setView("list");
          }}
          className={`pb-3 px-1 font-medium transition ${
            !showSharedDocs && view === "list"
              ? "text-primary-600 border-b-2 border-primary-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          My Documents
        </button>
        <button
          onClick={() => {
            setShowSharedDocs(true);
            setView("list");
          }}
          className={`pb-3 px-1 font-medium transition ${
            showSharedDocs && view === "list"
              ? "text-primary-600 border-b-2 border-primary-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Shared Documents
        </button>
      </div>

      {/* Content */}
      {view === "list" ? (
        <div>
          {filteredDocuments.length > 0 ? (
            <Card>
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {showSharedDocs ? "Shared with Me" : "My Documents"}
                </h2>
                <span className="text-sm text-gray-600">
                  {filteredDocuments.length} document
                  {filteredDocuments.length !== 1 ? "s" : ""}
                </span>
              </CardHeader>
              <CardBody>
                <DocumentList
                  documents={filteredDocuments}
                  onDocumentSelect={handleDocumentSelect}
                  onDelete={handleDelete}
                  onShare={handleShare}
                  onSign={handleSign}
                  loading={loading}
                />
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody className="text-center py-12">
                <FileText size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {showSharedDocs ? "No Shared Documents" : "No Documents Yet"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {showSharedDocs
                    ? "Documents shared with you will appear here"
                    : "Upload your first document to get started"}
                </p>
                {!showSharedDocs && (
                  <Button onClick={() => setView("upload")}>
                    <Plus size={18} className="mr-2" />
                    Upload Document
                  </Button>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Upload New Document
            </h2>
          </CardHeader>
          <CardBody>
            <DocumentUpload onUploadSuccess={handleUploadSuccess} />
          </CardBody>
        </Card>
      )}

      {/* PDF Viewer Modal */}
      {showPDFViewer && selectedDocument && (
        <PDFViewer
          fileUrl={selectedDocument.fileUrl}
          fileName={selectedDocument.originalName}
          onClose={() => setShowPDFViewer(false)}
        />
      )}

      {/* Signature Pad Modal */}
      {signatureMode === "handwritten" && (
        <SignaturePad
          fieldName="Document Signature"
          onSign={handleSignatureCapture}
          onCancel={() => {
            setSignatureMode(null);
            setSigningDocumentId(null);
          }}
        />
      )}

      {/* Typed Signature Modal */}
      {signatureMode === "typed" && (
        <TypedSignature
          fieldName="Document Signature"
          onSign={handleSignatureCapture}
          onCancel={() => {
            setSignatureMode(null);
            setSigningDocumentId(null);
          }}
        />
      )}

      {/* Quick Menu (TODO: Implement full modal) */}
      {signingDocumentId && !signatureMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">
                Sign Document
              </h3>
            </CardHeader>
            <CardBody className="space-y-3">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setSignatureMode("handwritten")}
              >
                <Palette size={18} className="mr-2" />
                Draw Signature
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setSignatureMode("typed")}
              >
                <FileText size={18} className="mr-2" />
                Type Signature
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setSigningDocumentId(null)}
              >
                Cancel
              </Button>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && sharingDocumentId && selectedDocument && (
        <ShareModal
          documentId={sharingDocumentId}
          documentTitle={selectedDocument.title}
          currentUserId={user?._id || ""}
          onShare={handleShareConfirm}
          onClose={() => {
            setShowShareModal(false);
            setSharingDocumentId(null);
          }}
        />
      )}
    </div>
  );
};
