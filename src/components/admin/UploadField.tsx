"use client";

import { useId, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import { cn } from "@/utils/cn";

/** Matches the fixed allow-list `/api/uploads` accepts — see `src/app/api/uploads/route.ts`. `pdfs` is handled separately, see below. */
export type UploadFieldFolder = "testimonials" | "doctors" | "real-life-stories" | "pdfs" | "homepage";

/** Mirrors `SIGNED_UPLOAD_FOLDERS.pdfs.maxBytes` in `src/app/api/uploads/sign/route.ts` — kept in sync there, checked here for instant client-side feedback before any network call. */
const PDF_MAX_BYTES = 15 * 1024 * 1024;

export interface UploadFieldValue {
  url: string;
  publicId: string;
}

export interface UploadFieldProps {
  label?: string;
  folder: UploadFieldFolder;
  /** MIME accept string for the native file picker; defaults to the folder's expected type. */
  accept?: string;
  value?: UploadFieldValue | null;
  onChange: (value: UploadFieldValue | null) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const DEFAULT_ACCEPT: Record<UploadFieldFolder, string> = {
  testimonials: "image/jpeg,image/png,image/webp",
  doctors: "image/jpeg,image/png,image/webp",
  "real-life-stories": "image/jpeg,image/png,image/webp",
  pdfs: "application/pdf",
  homepage: "image/jpeg,image/png,image/webp",
};

function isImageAccept(accept: string): boolean {
  return accept.includes("image");
}

function uploadWithProgress(
  file: File,
  folder: UploadFieldFolder,
  onProgress: (percent: number) => void
): Promise<UploadFieldValue> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      let body: { success: boolean; data?: { url: string; secureUrl: string; publicId: string }; error?: { message?: string } };
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("Upload failed. Please try again."));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300 && body.success && body.data) {
        resolve({ url: body.data.secureUrl || body.data.url, publicId: body.data.publicId });
      } else {
        reject(new Error(body.error?.message ?? "Upload failed. Please try again."));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed. Please check your connection."));

    xhr.send(formData);
  });
}

interface SignedUploadResponse {
  cloudName: string;
  apiKey: string;
  resourceType: "raw";
  uploadUrl: string;
  params: Record<string, string | number | boolean>;
}

/**
 * PDFs skip `/api/uploads` (and therefore Vercel's ~4.5MB serverless
 * function body cap) entirely — the browser gets a short-lived signature
 * from `/api/uploads/sign`, then uploads the file bytes straight to
 * Cloudinary. Cloudinary's response shape is the same either way, so this
 * still resolves to a plain `{url, publicId}`, matching `uploadWithProgress`.
 */
function uploadPdfDirectToCloudinary(file: File, onProgress: (percent: number) => void): Promise<UploadFieldValue> {
  return new Promise((resolve, reject) => {
    (async () => {
      if (file.type !== "application/pdf") {
        reject(new Error("Please choose a PDF file."));
        return;
      }
      if (file.size > PDF_MAX_BYTES) {
        reject(new Error(`This file is too large — PDFs must be smaller than ${PDF_MAX_BYTES / (1024 * 1024)}MB.`));
        return;
      }

      const signResponse = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "pdfs", filename: file.name, fileSize: file.size }),
      });
      const signBody: { success: boolean; data?: SignedUploadResponse; error?: { message?: string } } =
        await signResponse.json();
      if (!signResponse.ok || !signBody.success || !signBody.data) {
        reject(new Error(signBody.error?.message ?? "Could not start the upload. Please try again."));
        return;
      }

      const { uploadUrl, apiKey, params } = signBody.data;
      const formData = new FormData();
      for (const [key, value] of Object.entries(params)) {
        formData.append(key, String(value));
      }
      formData.append("api_key", apiKey);
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        let body: { secure_url?: string; url?: string; public_id?: string; error?: { message?: string } };
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          reject(new Error("The upload was interrupted. Please try again."));
          return;
        }

        if (xhr.status >= 200 && xhr.status < 300 && body.public_id) {
          resolve({ url: body.secure_url || body.url || "", publicId: body.public_id });
        } else {
          reject(new Error(body.error?.message ?? "Upload failed. Please try again."));
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed. Please check your connection."));

      xhr.send(formData);
    })().catch((err) => reject(err instanceof Error ? err : new Error("Upload failed. Please try again.")));
  });
}

/**
 * File input with preview, upload progress, and Cloudinary integration via
 * `/api/uploads`. Returns `{url, publicId}` to the parent form on success —
 * the parent stores those two strings on the entity, same as every other
 * `photoUrl`/`photoPublicId` field pair. Used by Testimonials, Doctors
 * (photo), PDF Management (file), and Homepage Images; the folder implies
 * image vs. PDF.
 */
export function UploadField({
  label,
  folder,
  accept,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  className,
}: UploadFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const resolvedAccept = accept ?? DEFAULT_ACCEPT[folder];
  const isImage = isImageAccept(resolvedAccept);
  const isUploading = progress !== null;
  const displayError = error ?? localError ?? undefined;

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setLocalError(null);
    setProgress(0);

    try {
      const result =
        folder === "pdfs" ? await uploadPdfDirectToCloudinary(file, setProgress) : await uploadWithProgress(file, folder, setProgress);
      onChange(result);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setProgress(null);
    }
  }

  function handleRemove() {
    onChange(null);
    setLocalError(null);
  }

  const fileName = value?.publicId.split("/").pop();

  return (
    <div className={cn("text-left", className)}>
      {label && (
        <label htmlFor={inputId} className="mb-2 block font-semibold text-ink">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      {/* Native `required` is intentionally not set: this input is visually
          hidden, and browsers refuse to submit a form with a hidden,
          invalid-required control. Missing-file validation is left to the
          parent form's existing fieldErrors flow instead. */}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={resolvedAccept}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
        aria-invalid={Boolean(displayError)}
        aria-describedby={displayError ? `${inputId}-error` : undefined}
      />

      {value && !isUploading ? (
        <div className="flex items-center gap-4 rounded-xl border border-gray-300 p-4">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- existing file preview, arbitrary Cloudinary host
            <img src={value.url} alt="Uploaded preview" className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-surface-light text-2xl" aria-hidden="true">
              📄
            </div>
          )}
          <div className="min-w-0 flex-1">
            <a
              href={value.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate font-medium text-primary hover:underline"
            >
              {fileName}
            </a>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={handleRemove}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 px-6 py-8 text-center",
            displayError && "border-red-400",
            (disabled || isUploading) && "opacity-60"
          )}
        >
          {isUploading ? (
            <>
              <Loader size="md" />
              <p className="text-sm text-ink-muted">Uploading… {progress}%</p>
              <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-light">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300 ease-brand"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-ink-muted">{isImage ? "Upload an image" : "Upload a PDF file"}</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
              >
                Choose File
              </Button>
            </>
          )}
        </div>
      )}

      {displayError && (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-sm text-red-600">
          {displayError}
        </p>
      )}
    </div>
  );
}
