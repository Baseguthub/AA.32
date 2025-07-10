import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { Camera, X, RefreshCw, Wand, AlertTriangle, Loader2 } from 'lucide-react';
import * as geminiService from '../services/geminiService';
import { CanvasContext } from '../context/CanvasContext';
import { useToast } from '../context/ToastContext';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose }) => {
  const { dispatch } = useContext(CanvasContext);
  const { addToast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError("Camera access was denied. Please enable camera permissions in your browser settings.");
      } else {
        setError("Could not access the camera. Please ensure it's not being used by another application.");
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);


  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleGenerate = async () => {
    if (!capturedImage) return;
    setIsLoading(true);
    try {
      const response = await geminiService.generateFromImage(capturedImage);
      if (response.actions && response.actions.length > 0) {
        dispatch({ type: 'APPLY_AI_ACTIONS', payload: response.actions });
        addToast(response.explanation || 'Diagram generated successfully!', 'success');
      } else {
        addToast(response.explanation || 'Could not detect a diagram.', 'warning');
      }
      onClose();
    } catch (err) {
      console.error("Failed to generate from image:", err);
      addToast('Failed to interpret the diagram. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
      stopCamera();
      onClose();
  }

  if (!isOpen) {
    return null;
  }

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-300">
          <AlertTriangle size={64} className="mb-4" />
          <h2 className="text-xl font-bold mb-2">Camera Error</h2>
          <p className="max-w-md">{error}</p>
        </div>
      );
    }
    
    if (capturedImage) {
        return (
            <>
                <img src={capturedImage} alt="Captured diagram" className="w-full h-full object-contain" />
                {isLoading && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
                        <Loader2 size={64} className="animate-spin mb-4" />
                        <p className="text-xl font-bold">Interpreting Diagram...</p>
                        <p className="text-md text-text-secondary">This may take a moment.</p>
                    </div>
                )}
            </>
        )
    }

    return (
        <video ref={videoRef} playsInline autoPlay className="w-full h-full object-cover"></video>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 command-palette-overlay" onClick={handleClose}>
        <div className="relative w-[95vw] h-[90vh] bg-canvas-bg rounded-xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex-1 relative">
                {renderContent()}
            </div>
            <div className="flex-shrink-0 bg-sidebar-bg p-4 flex items-center justify-center gap-4">
                {capturedImage ? (
                    <>
                        <button onClick={handleRetake} disabled={isLoading} className="flex items-center gap-2 px-6 py-3 rounded-lg bg-panel-bg hover:bg-border-color disabled:opacity-50 transition-colors">
                            <RefreshCw size={20} /> Retake
                        </button>
                        <button onClick={handleGenerate} disabled={isLoading} className="flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition-colors">
                            <Wand size={20} /> Generate Diagram
                        </button>
                    </>
                ) : (
                    <button onClick={handleCapture} disabled={!stream || !!error} className="w-20 h-20 rounded-full bg-white flex items-center justify-center ring-4 ring-offset-4 ring-offset-sidebar-bg ring-white disabled:bg-gray-400 disabled:ring-gray-400 transition-all transform hover:scale-105">
                        <Camera size={40} className="text-sidebar-bg" />
                    </button>
                )}
            </div>
            <button onClick={handleClose} className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors">
                <X size={24} />
            </button>
        </div>
        <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default CameraModal;