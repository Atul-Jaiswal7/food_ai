"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<"idle" | "live" | "captured">("idle");
  const [error, setError] = useState<string | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<
    "unknown" | "granted" | "denied"
  >("unknown");

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setPermissionState("granted");
      setMode("live");

      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      }, 50);
    } catch (err: unknown) {
      stopStream();
      setPermissionState("denied");
      const e = err as { name?: string };
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setError("Camera access denied. Please allow camera permission and try again.");
      } else if (e.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Could not access camera. Try uploading an image instead.");
      }
    }
  }, [stopStream]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setCapturedUrl(url);
        setMode("captured");
        stopStream();

        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        onCapture(file);
      },
      "image/jpeg",
      0.92
    );
  }, [onCapture, stopStream]);

  const retake = useCallback(() => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(null);
    setMode("idle");
    startCamera();
  }, [capturedUrl, startCamera]);

  // Fallback: native file input with camera capture
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      setCapturedUrl(url);
      setMode("captured");
      onCapture(file);
    },
    [onCapture]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* IDLE */}
      {mode === "idle" && (
        <div className="flex flex-col gap-2">
          {typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia ? (
            <button
              onClick={startCamera}
              className="w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: "var(--surface-2)",
                color: "var(--text)",
                border: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>📷</span>
              Open Camera
            </button>
          ) : null}

          {/* Fallback input */}
          <label
            className="w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-muted)",
              border: "1px dashed var(--border)",
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>📸</span>
            Use Device Camera (Native)
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileInput}
            />
          </label>
        </div>
      )}

      {/* LIVE PREVIEW */}
      {mode === "live" && (
        <div className="flex flex-col gap-3">
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{ background: "#000", aspectRatio: "4/3" }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.3) 100%)",
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none flex items-center justify-center"
            >
              <div
                style={{
                  width: "60%",
                  aspectRatio: "1",
                  border: "2px solid rgba(255,107,53,0.6)",
                  borderRadius: "12px",
                }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={capture}
              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              📸 Capture
            </button>
            <button
              onClick={() => { stopStream(); setMode("idle"); }}
              className="px-4 py-3 rounded-xl text-sm transition-all"
              style={{
                background: "var(--surface-2)",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* CAPTURED */}
      {mode === "captured" && capturedUrl && (
        <div className="flex flex-col gap-3">
          <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedUrl}
              alt="Captured"
              className="w-full h-full object-cover"
            />
            <div
              className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium"
              style={{ background: "rgba(0,0,0,0.7)", color: "var(--accent)" }}
            >
              ✓ Captured
            </div>
          </div>
          <button
            onClick={retake}
            className="w-full py-2 rounded-xl text-sm transition-all"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            ↩ Retake
          </button>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div
          className="p-3 rounded-xl text-sm"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171",
          }}
        >
          {error}
          {permissionState === "denied" && (
            <p className="mt-1 text-xs opacity-70">
              Go to browser settings → Site Settings → Camera to allow access.
            </p>
          )}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
