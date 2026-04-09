import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { RotateCcw, Check, X } from "lucide-react";
import { Button } from "../ui/Button";

interface SignaturePadProps {
  onSign: (signatureImage: string) => void;
  onCancel?: () => void;
  fieldName?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSign,
  onCancel,
  fieldName = "Signature",
}) => {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    signatureRef.current?.clear();
    setIsEmpty(true);
  };

  const handleSign = () => {
    if (signatureRef.current && !isEmpty) {
      const imageData = signatureRef.current.toDataURL("image/png");
      onSign(imageData);
    }
  };

  const handleCanvasChange = () => {
    setIsEmpty(signatureRef.current?.isEmpty() ?? true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900">{fieldName}</h3>
          <p className="text-sm text-gray-600 mt-1">
            Draw your signature below
          </p>
        </div>

        {/* Signature Canvas */}
        <div className="p-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white">
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                width: 400,
                height: 200,
                className: "w-full cursor-crosshair",
              }}
              onEnd={handleCanvasChange}
              throttle={16}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 p-4 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={handleClear}
            disabled={isEmpty}
          >
            <RotateCcw size={18} />
            Clear
          </Button>
          <Button
            variant="secondary"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={onCancel}
          >
            <X size={18} />
            Cancel
          </Button>
          <Button
            className="flex-1 flex items-center justify-center gap-2"
            onClick={handleSign}
            disabled={isEmpty}
          >
            <Check size={18} />
            Sign
          </Button>
        </div>
      </div>
    </div>
  );
};

// Alternative: Typed signature component
interface TypedSignatureProps {
  onSign: (signatureName: string) => void;
  onCancel?: () => void;
  fieldName?: string;
}

export const TypedSignature: React.FC<TypedSignatureProps> = ({
  onSign,
  onCancel,
  fieldName = "Signature",
}) => {
  const [name, setName] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateSignatureImage = (text: string) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw signature
    ctx.font = 'italic 48px "Brush Script MT", cursive, sans-serif';
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL("image/png");
  };

  const handleSign = () => {
    if (name.trim()) {
      const signatureImage = generateSignatureImage(name);
      if (signatureImage) {
        onSign(signatureImage);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900">{fieldName}</h3>
          <p className="text-sm text-gray-600 mt-1">
            Type your name for signature
          </p>
        </div>

        {/* Preview Canvas (hidden) */}
        <canvas ref={canvasRef} width={400} height={200} className="hidden" />

        {/* Input */}
        <div className="p-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Preview:</p>
            <p
              style={{
                fontFamily: 'italic "Brush Script MT", cursive',
                fontSize: "32px",
              }}
            >
              {name || "Your signature"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 p-4 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1 flex items-center justify-center gap-2"
            onClick={onCancel}
          >
            <X size={18} />
            Cancel
          </Button>
          <Button
            className="flex-1 flex items-center justify-center gap-2"
            onClick={handleSign}
            disabled={!name.trim()}
          >
            <Check size={18} />
            Sign
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;
