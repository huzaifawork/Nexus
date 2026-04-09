import axios from "axios";

const API_BASE = "http://localhost:5000/api";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface SharedUser {
  userId: string;
  permission: "view" | "comment" | "edit";
  sharedAt: string;
}

interface Document {
  _id: string;
  title: string;
  description: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  fileUrl: string;
  uploadedBy: User;
  uploadedAt: string;
  version: number;
  status: "draft" | "active" | "archived" | "signed";
  sharedWith: SharedUser[];
  signatures: Signature[];
  tags: string[];
}

interface Signature {
  _id: string;
  signedBy: User;
  signedAt: string;
  signatureImage: string;
  signatureType: "handwritten" | "typed" | "biometric";
  document: string;
  fieldName: string;
  status: "pending" | "signed" | "rejected";
  isVerified: boolean;
}

interface DocumentMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  associatedType?: string;
  associatedId?: string;
}

interface SignatureData {
  documentId: string;
  signatureImage: string;
  signatureType?: "handwritten" | "typed" | "biometric";
  fieldName?: string;
  location?: string;
  reason?: string;
  notes?: string;
}

interface AuditTrail {
  action: string;
  performedBy: User;
  timestamp: string;
  details: string;
}

const getAuthHeader = () => {
  const userStr = localStorage.getItem("business_nexus_user");
  const user = userStr ? JSON.parse(userStr) : null;
  return {
    Authorization: `Bearer ${user?.token || ""}`,
  };
};

// Document APIs
export const documentApi = {
  // Upload document
  async uploadDocument(
    file: File,
    metadata: DocumentMetadata,
  ): Promise<Document> {
    const formData = new FormData();
    formData.append("document", file);
    formData.append("title", metadata.title || file.name);
    formData.append("description", metadata.description || "");
    if (metadata.tags) formData.append("tags", JSON.stringify(metadata.tags));
    if (metadata.associatedType)
      formData.append("associatedType", metadata.associatedType);
    if (metadata.associatedId)
      formData.append("associatedId", metadata.associatedId);

    const response = await axios.post(
      `${API_BASE}/documents/upload`,
      formData,
      {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data.document;
  },

  // Get all user documents
  async getUserDocuments(
    filters?: Record<string, string | number>,
  ): Promise<Document[]> {
    const response = await axios.get(`${API_BASE}/documents`, {
      headers: getAuthHeader(),
      params: filters,
    });
    return response.data.documents;
  },

  // Get documents shared with user
  async getSharedDocuments(): Promise<Document[]> {
    const response = await axios.get(`${API_BASE}/documents/shared`, {
      headers: getAuthHeader(),
    });
    return response.data.documents;
  },

  // Get single document
  async getDocument(id: string): Promise<Document> {
    const response = await axios.get(`${API_BASE}/documents/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Download document
  async downloadDocument(filename: string): Promise<Blob> {
    const response = await axios.get(
      `${API_BASE}/documents/download/${filename}`,
      {
        headers: getAuthHeader(),
        responseType: "blob",
      },
    );
    return response.data;
  },

  // Update document
  async updateDocument(
    id: string,
    metadata: Partial<DocumentMetadata>,
  ): Promise<Document> {
    const response = await axios.put(`${API_BASE}/documents/${id}`, metadata, {
      headers: getAuthHeader(),
    });
    return response.data.document;
  },

  // Create new version
  async createVersion(id: string, file: File): Promise<Document> {
    const formData = new FormData();
    formData.append("document", file);

    const response = await axios.post(
      `${API_BASE}/documents/${id}/version`,
      formData,
      {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data.document;
  },

  // Share document
  async shareDocument(
    id: string,
    userId: string,
    permission: string = "view",
  ): Promise<Document> {
    const response = await axios.post(
      `${API_BASE}/documents/${id}/share`,
      { userId, permission },
      { headers: getAuthHeader() },
    );
    return response.data.document;
  },

  // Revoke access
  async revokeAccess(id: string, userId: string): Promise<Document> {
    const response = await axios.delete(
      `${API_BASE}/documents/${id}/share/${userId}`,
      { headers: getAuthHeader() },
    );
    return response.data.document;
  },

  // Delete document
  async deleteDocument(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/documents/${id}`, {
      headers: getAuthHeader(),
    });
  },
};

// Signature APIs
export const signatureApi = {
  // Create signature
  async createSignature(data: SignatureData): Promise<Signature> {
    const response = await axios.post(`${API_BASE}/signatures`, data, {
      headers: getAuthHeader(),
    });
    return response.data.signature;
  },

  // Get document signatures
  async getDocumentSignatures(documentId: string): Promise<Signature[]> {
    const response = await axios.get(
      `${API_BASE}/signatures/document/${documentId}`,
      { headers: getAuthHeader() },
    );
    return response.data.signatures;
  },

  // Get signature
  async getSignature(signatureId: string): Promise<Signature> {
    const response = await axios.get(`${API_BASE}/signatures/${signatureId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Get user signatures
  async getUserSignatures(): Promise<Signature[]> {
    const response = await axios.get(`${API_BASE}/signatures/user/signatures`, {
      headers: getAuthHeader(),
    });
    return response.data.signatures;
  },

  // Update signature status
  async updateSignatureStatus(
    signatureId: string,
    status: string,
  ): Promise<Signature> {
    const response = await axios.put(
      `${API_BASE}/signatures/${signatureId}`,
      { status },
      { headers: getAuthHeader() },
    );
    return response.data.signature;
  },

  // Verify signature
  async verifySignature(signatureId: string): Promise<Signature> {
    const response = await axios.post(
      `${API_BASE}/signatures/${signatureId}/verify`,
      {},
      { headers: getAuthHeader() },
    );
    return response.data.signature;
  },

  // Delete signature
  async deleteSignature(signatureId: string): Promise<void> {
    await axios.delete(`${API_BASE}/signatures/${signatureId}`, {
      headers: getAuthHeader(),
    });
  },

  // Get audit trail
  async getAuditTrail(documentId: string): Promise<AuditTrail[]> {
    const response = await axios.get(
      `${API_BASE}/signatures/document/${documentId}/audit`,
      { headers: getAuthHeader() },
    );
    return response.data;
  },
};
