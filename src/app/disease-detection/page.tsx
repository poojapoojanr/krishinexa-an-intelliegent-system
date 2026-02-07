"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/use-translation";

type ResultType = {
  diseaseName: string;
  severity: string;
  treatment: string;
  confidence?: number;
  is_confident?: boolean;
  top_predictions?: Array<{ disease: string; confidence: number }>;
  message?: string;
  status?: string;
};

export default function DiseaseDetectionPage() {
  const { t } = useTranslation();
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<ResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const MAX_IMAGE_SIZE = 512;

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();
        img.src = reader.result as string;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_IMAGE_SIZE) {
            height = (height * MAX_IMAGE_SIZE) / width;
            width = MAX_IMAGE_SIZE;
          } else if (height > MAX_IMAGE_SIZE) {
            width = (width * MAX_IMAGE_SIZE) / height;
            height = MAX_IMAGE_SIZE;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) return reject();

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg"));
        };
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    setUploadError(null);
    const file = e.target.files[0];
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (file.type && !allowedTypes.has(file.type)) {
      setUploadError(t('Please upload a JPG/PNG/WEBP image.', 'Please upload a JPG/PNG/WEBP image.'));
      return;
    }
    const maxBytes = 6 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError(t('Image too large (max 6MB).', 'Image too large (max 6MB).'));
      return;
    }

    const resized = await resizeImage(file);
    setImage(resized);
    setResult(null);
  };

  const handlePredict = async () => {
    if (!image) return;

    setLoading(true);
    setResult(null);

    try {
      // convert dataURL to Blob
      const dataURLtoBlob = (dataurl: string) => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      };

      const blob = dataURLtoBlob(image);
      const form = new FormData();
      // backend expects field name 'image' (multipart file)
      form.append('image', blob, 'upload.jpg');

      const res = await fetch('http://127.0.0.1:8000/api/disease/predict', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('Prediction HTTP error', res.status, text);
        throw new Error('Prediction request failed');
      }

      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes('application/json')) {
        const text = await res.text().catch(() => '');
        console.error('Prediction returned non-JSON response', contentType, text);
        throw new Error('Invalid response format from server');
      }

      const data = await res.json();

      // Map backend response to UI ResultType shape (be resilient)
      // sanitize mapping: ensure strings and reasonable length
      const pickString = (v: any, fallback = 'Unknown') => {
        if (typeof v === 'string') {
          const s = v.trim();
          return s.length > 0 && s.length < 200 ? s : fallback;
        }
        return fallback;
      };

      const mapped: ResultType = {
        diseaseName: pickString(
          data.disease || data.diseaseName || data.top_predictions?.[0]?.disease,
          'Unknown'
        ),
        severity: pickString(data.severity, 'Unknown'),
        treatment: pickString(
          data.treatment || data.advice || 'See recommended treatment',
          ''
        ),
        confidence: typeof data.confidence === 'number' ? data.confidence : undefined,
        is_confident: typeof data.is_confident === 'boolean' ? data.is_confident : undefined,
        top_predictions: Array.isArray(data.top_predictions) ? data.top_predictions : undefined,
        message: typeof data.message === 'string' ? data.message : undefined,
        status: typeof data.status === 'string' ? data.status : undefined,
      };

      setResult(mapped);
    } catch {
      alert("Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const severityColor =
    result?.severity.toLowerCase() === "high"
      ? "#e53935"
      : result?.severity.toLowerCase() === "medium"
      ? "#fb8c00"
      : "#43a047";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f4f8",
        padding: "40px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 650,
          margin: "auto",
          background: "#ffffff",
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>
          🌿 {t('Crop Disease Prediction', 'Crop Disease Prediction')}
        </h2>

        {/* Upload Card */}
        <div
          style={{
            border: "2px dashed #cfd8dc",
            padding: 20,
            borderRadius: 10,
            textAlign: "center",
          }}
        >
          <input type="file" accept="image/*" onChange={handleUpload} />

          {uploadError && (
            <p style={{ marginTop: 10, color: "#d32f2f", fontSize: 14 }}>
              {uploadError}
            </p>
          )}

          {image && (
            <div style={{ marginTop: 16 }}>
              <img
                src={image}
                alt={t('Uploaded crop', 'Uploaded crop')}
                style={{
                  maxWidth: "100%",
                  borderRadius: 8,
                  marginTop: 10,
                }}
              />
            </div>
          )}
        </div>

        {/* Predict Button */}
        <button
          onClick={handlePredict}
          disabled={!image || loading}
          style={{
            marginTop: 24,
            width: "100%",
            padding: "14px",
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 8,
            border: "none",
            background: !image || loading ? "#b0bec5" : "#2e7d32",
            color: "#ffffff",
            cursor: !image || loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? t('Analyzing Image...', 'Analyzing Image...') : t('Predict Disease', 'Predict Disease')}
        </button>

        {/* Result Card */}
        {result && (
          <div
            style={{
              marginTop: 32,
              padding: 20,
              background: "#f9fafb",
              borderRadius: 10,
              borderLeft: `6px solid ${severityColor}`,
            }}
          >
            <h3 style={{ marginBottom: 12 }}>🩺 {t('Diagnosis Result', 'Diagnosis Result')}</h3>

            {/* Show backend message if present */}
            {result.message && (
              <p style={{ marginBottom: 10, color: "#455a64" }}>
                {result.message}
              </p>
            )}

            {/* Show backend status if present */}
            {result.status && (
              <p style={{ marginBottom: 10, color: "#789262", fontSize: 13 }}>
                <strong>Status:</strong> {result.status}
              </p>
            )}

            {result.is_confident === false && !result.message && (
              <p style={{ marginBottom: 10, color: "#455a64" }}>
                {t(
                  'Not confident enough to give a reliable disease name. Try a clearer close-up leaf photo.',
                  'Not confident enough to give a reliable disease name. Try a clearer close-up leaf photo.'
                )}
              </p>
            )}

            <p>
              <strong>{t('Disease', 'Disease')}:</strong> {result.diseaseName}
            </p>

            <p>
              <strong>{t('Severity', 'Severity')}:</strong>{" "}
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 12,
                  background: severityColor,
                  color: "#fff",
                  fontSize: 14,
                }}
              >
                {result.severity}
              </span>
            </p>

            {typeof result.confidence === 'number' && (
              <p style={{ marginTop: 10 }}>
                <strong>{t('Confidence', 'Confidence')}:</strong> {Math.round(result.confidence * 100)}%
              </p>
            )}

            {/* Show top predictions if available */}
            {Array.isArray(result.top_predictions) && result.top_predictions.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <strong>Top Predictions:</strong>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {result.top_predictions.map((pred, idx) => (
                    <li key={idx}>
                      {pred.disease} ({Math.round(pred.confidence * 100)}%)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p style={{ marginTop: 12 }}>
              <strong>{t('Treatment', 'Treatment')}:</strong>
            </p>
            <p>{result.treatment}</p>
          </div>
        )}
      </div>
    </div>
  );
}