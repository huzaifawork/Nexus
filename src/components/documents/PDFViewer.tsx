import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Set PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  onClose?: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  fileUrl,
  fileName,
  onClose,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch PDF with authentication
  useEffect(() => {
    const fetchPDF = async () => {
      try {
        setLoading(true);
        const userStr = localStorage.getItem("business_nexus_user");
        const user = userStr ? JSON.parse(userStr) : null;
        const token = user?.token;

        // Extract filename from URL
        const filename = fileUrl.split("/").pop() || "";

        // Fetch with auth header
        const response = await fetch(
          `http://localhost:5000/api/documents/download/${filename}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        }

        const blob = await response.blob();
        setPdfBlob(blob);
        setError(null);
      } catch (err) {
        console.error("PDF fetch error:", err);
        setError(
          `Failed to load PDF: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
        setPdfBlob(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPDF();
  }, [fileUrl]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const onDocumentLoadError = () => {
    setError("Failed to load PDF");
  };

  const handlePrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 2));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = () => {
    if (!pdfBlob) return;
    const link = document.createElement("a");
    const url = URL.createObjectURL(pdfBlob);
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold truncate">{fileName}</h2>
        <div className="flex gap-2 items-center">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-800 rounded transition"
            title="Zoom out"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-sm text-gray-400 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-800 rounded transition"
            title="Zoom in"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-gray-800 rounded transition ml-2"
            title="Download"
            disabled={!pdfBlob}
          >
            <Download size={20} />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded transition ml-2"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-gray-950 flex items-center justify-center">
        {loading ? (
          <div className="text-gray-400 text-center">
            <p className="text-lg font-semibold mb-2">Loading PDF...</p>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">
            <p className="text-xl font-semibold mb-2">Error Loading PDF</p>
            <p>{error}</p>
          </div>
        ) : pdfBlob ? (
          <div className="p-4">
            <Document
              file={pdfBlob}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<div className="text-gray-400">Loading PDF...</div>}
              error={<div className="text-red-500">Failed to load PDF</div>}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          </div>
        ) : (
          <div className="text-gray-400 text-center">
            <p>Unable to load PDF</p>
          </div>
        )}
      </div>

      {/* Footer - Navigation */}
      {numPages > 0 && !error && pdfBlob && (
        <div className="bg-gray-900 text-white p-4 flex items-center justify-center gap-4">
          <button
            onClick={handlePrevPage}
            disabled={pageNumber <= 1}
            className="p-2 hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
            title="Previous page"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm w-24 text-center">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={pageNumber >= numPages}
            className="p-2 hover:bg-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
            title="Next page"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
