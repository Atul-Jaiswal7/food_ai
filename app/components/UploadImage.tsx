"use client";

import { useRef, useState, useCallback } from "react";

interface UploadImageProps {
  onSelect: (file: File) => void;
  selectedFile: File | null;
}

export default function UploadImage({ onSelect, selectedFile }: UploadImageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onSelect(file);
    },
    [onSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const clear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (previewUrl && selectedFile) {
    return (
      <div className="flex flex-col gap-3">
        <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Selected"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium"
            style={{ background: "rgba(0,0,0,0.7)", color: "var(--accent)" }}
          >
            ✓ Ready
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs truncate flex-1"
            style={{ color: "var(--text-muted)" }}
          >
            {selectedFile.name}
          </span>
          <button
            onClick={clear}
            className="text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className="relative flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer transition-all"
      style={{
        minHeight: "180px",
        border: `2px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
        background: dragging ? "rgba(255,107,53,0.05)" : "var(--surface)",
      }}
    >
      <div
        style={{
          fontSize: "2.5rem",
          filter: dragging ? "none" : "grayscale(0.3)",
        }}
      >
        🖼️
      </div>
      <div className="text-center px-4">
        <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
          {dragging ? "Drop it here!" : "Tap to upload an image"}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          JPG, PNG, WEBP — or drag & drop
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
