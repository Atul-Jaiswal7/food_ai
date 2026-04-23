"use client";

import { useCallback, useRef, useState } from "react";

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
      setPreviewUrl(URL.createObjectURL(file));
      onSelect(file);
    },
    [onSelect]
  );

  const clear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (previewUrl && selectedFile) {
    return (
      <div className="flex flex-col gap-3">
        <div className="relative overflow-hidden rounded-[1.5rem]" style={{ aspectRatio: "4/3" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Selected food" className="h-full w-full object-cover" />
          <span
            className="absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.94)", color: "var(--accent)" }}
          >
            Ready
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-xs" style={{ color: "var(--text-muted)" }}>
            {selectedFile.name}
          </span>
          <button
            type="button"
            onClick={clear}
            className="rounded-full px-4 py-2 text-xs font-medium"
            style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
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
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.5rem] text-center"
      style={{
        minHeight: "180px",
        background: dragging ? "#edf7f5" : "var(--surface-2)",
        border: `1px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
      }}
    >
      <div
        className="grid h-12 w-12 place-items-center rounded-full text-2xl"
        style={{ background: "#fff", color: "var(--accent)" }}
      >
        +
      </div>
      <div>
        <p className="text-sm font-semibold">Tap to upload food image</p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          JPG, PNG, or WEBP
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
