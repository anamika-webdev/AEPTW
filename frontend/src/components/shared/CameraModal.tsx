import React, { useRef, useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { X, Camera } from 'lucide-react';

interface CameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (blob: Blob) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);

    useEffect(() => {
        let mounted = true;

        if (isOpen) {
            startCamera(mounted);
        }

        return () => {
            mounted = false;
            stopCamera();
        };
    }, [isOpen]);

    const startCamera = async (mounted: boolean) => {
        try {
            // Stop any existing stream first
            stopCamera();

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Back camera on mobile
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            // Check if component is still mounted
            if (!mounted || !videoRef.current) {
                stream.getTracks().forEach(track => track.stop());
                return;
            }

            streamRef.current = stream;
            videoRef.current.srcObject = stream;

            // Wait for video to be ready before playing
            videoRef.current.onloadedmetadata = () => {
                if (videoRef.current && mounted) {
                    videoRef.current.play()
                        .then(() => {
                            if (mounted) {
                                setIsCameraReady(true);
                            }
                        })
                        .catch((error) => {
                            // Ignore AbortError - it's expected when component unmounts
                            if (error.name !== 'AbortError') {
                                console.error('Video play error:', error);
                            }
                        });
                }
            };
        } catch (error) {
            console.error('Camera error:', error);
            alert('Unable to access camera. Please check permissions.');
            onClose();
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraReady(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !isCameraReady) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(videoRef.current, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) {
                    onCapture(blob);
                    stopCamera();
                    onClose();
                }
            }, 'image/jpeg', 0.9);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="relative w-full max-w-4xl p-4">
                {/* Camera Preview */}
                <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                        ref={videoRef}
                        className="w-full h-auto max-h-[80vh] object-contain mx-auto"
                        playsInline
                        autoPlay
                        muted
                    />

                    {/* Camera Controls Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center justify-center gap-4">
                            {/* Cancel Button */}
                            <Button
                                onClick={() => {
                                    stopCamera();
                                    onClose();
                                }}
                                variant="outline"
                                size="lg"
                                className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                            >
                                <X className="w-5 h-5 mr-2" />
                                Cancel
                            </Button>

                            {/* Capture Button */}
                            <button
                                onClick={capturePhoto}
                                disabled={!isCameraReady}
                                className="w-16 h-16 rounded-full bg-white border-4 border-white/50 hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Capture photo"
                            >
                                <Camera className="w-8 h-8 mx-auto text-slate-900" />
                            </button>
                        </div>
                    </div>

                    {/* Camera Loading Indicator */}
                    {!isCameraReady && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                            <div className="text-center text-white">
                                <div className="w-12 h-12 mx-auto mb-4 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                <p>Starting camera...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="mt-4 text-center text-white">
                    <p className="text-sm">
                        Position the subject in the frame and tap the button to capture
                    </p>
                </div>
            </div>
        </div>
    );
};
