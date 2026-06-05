"use client";

import { useRef, useState } from "react";
import { StatusMessage } from "@/app/components/ui/status-message";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  previewClassName?: string;
  accept?: string;
}

export function ImageUploadField({
  value,
  onChange,
  label = "Upload Image",
  previewClassName = "w-full h-48 rounded-xl object-cover",
  accept = "image/*",
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);
  const [statusMessage, setStatusMessage] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);

  const handleFile = async (file: File) => {
    setStatusMessage(null);

    if (!file.type.startsWith("image/")) {
      setStatusMessage({
        type: "error",
        message: "Please select an image file.",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({
        type: "error",
        message: "File too large. Max 5MB.",
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        onChange(data.url);
        setPreview(data.url);
        setStatusMessage({
          type: "success",
          message: "Image uploaded successfully.",
        });
      } else {
        setStatusMessage({
          type: "error",
          message: data.error || "Upload failed.",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        message: "Upload failed.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative group">
          {/* biome-ignore lint/performance/noImgElement: uploaded images served from same origin */}
          <img src={preview} alt="Preview" className={previewClassName} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
          >
            <span className="material-symbols-outlined text-white text-3xl">
              {uploading ? "progress_activity" : "edit"}
            </span>
          </button>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="w-full h-48 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-violet-50/50 transition-all flex flex-col items-center justify-center space-y-2 text-gray-500 hover:text-primary"
        >
          <span className="material-symbols-outlined text-4xl">
            {uploading ? "progress_activity" : "cloud_upload"}
          </span>
          <span className="text-sm font-medium">
            {uploading ? "Uploading..." : label}
          </span>
          <span className="text-xs text-gray-400">Drop or click to upload</span>
        </button>
      )}

      {statusMessage && (
        <StatusMessage
          type={statusMessage.type}
          message={statusMessage.message}
          className="mt-3"
        />
      )}
    </div>
  );
}
