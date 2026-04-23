"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setMode("live");

      setTimeout(() => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }, 50);
    } catch {
      stopStream();
      setError("Could not access camera. Try uploading an image instead.");
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
        onCapture(new File([blob], "capture.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  }, [onCapture, stopStream]);

  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setCapturedUrl(URL.createObjectURL(file));
      setMode("captured");
      onCapture(file);
    },
    [onCapture]
  );

  return (
    <div className="flex flex-col gap-3">
      {mode === "idle" && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={startCamera}
            className="rounded-[1.5rem] py-4 text-sm font-semibold"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          >
            Open Camera
          </button>
          <label
            className="cursor-pointer rounded-[1.5rem] py-4 text-center text-sm font-semibold"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
          >
            Use Device Camera
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

      {mode === "live" && (
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-[1.5rem] bg-black" style={{ aspectRatio: "4/3" }}>
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button
              type="button"
              onClick={capture}
              className="rounded-2xl py-3 text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Capture
            </button>
            <button
              type="button"
              onClick={() => {
                stopStream();
                setMode("idle");
              }}
              className="rounded-2xl px-4 py-3 text-sm"
              style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "captured" && capturedUrl && (
        <div className="flex flex-col gap-3">
          <div className="relative overflow-hidden rounded-[1.5rem]" style={{ aspectRatio: "4/3" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={capturedUrl} alt="Captured food" className="h-full w-full object-cover" />
            <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-medium" style={{ color: "var(--accent)" }}>
              Captured
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (capturedUrl) URL.revokeObjectURL(capturedUrl);
              setCapturedUrl(null);
              setMode("idle");
              void startCamera();
            }}
            className="rounded-2xl py-3 text-sm font-semibold"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
          >
            Retake
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-2xl p-3 text-center text-sm" style={{ background: "#fff", color: "#dc2626" }}>
          {error}
        </p>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
