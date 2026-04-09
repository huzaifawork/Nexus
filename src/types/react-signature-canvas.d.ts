declare module "react-signature-canvas" {
  import { Ref, Component } from "react";

  interface SignatureCanvasProps {
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
    backgroundColor?: string;
    penColor?: string;
    dotSize?: number | (() => number);
    minWidth?: number;
    maxWidth?: number;
    minDistance?: number;
    throttle?: number;
    onBegin?: () => void;
    onEnd?: () => void;
    onMouseDown?: (event: MouseEvent) => void;
    onMouseMove?: (event: MouseEvent) => void;
    onMouseUp?: (event: MouseEvent) => void;
  }

  class SignatureCanvas extends Component<SignatureCanvasProps> {
    clear(): void;
    isEmpty(): boolean;
    toDataURL(type?: string, encoderOptions?: number): string;
    toData(): Array<Array<{ x: number; y: number; pressure: number }>>;
    fromData(
      data: Array<Array<{ x: number; y: number; pressure: number }>>,
    ): void;
    drawImage(imageUrl: string): void;
    getSignaturePad(): any;
  }

  export default SignatureCanvas;
}
