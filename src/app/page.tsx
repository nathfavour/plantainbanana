"use client";

import React, { useEffect, useState } from "react";
import { GoogleGenAI, Modality } from "@google/genai";

// Utility to convert file to base64
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        const parts = reader.result.split(",");
        if (parts.length === 2 && parts[1]) {
          resolve(parts[1]);
        } else {
          reject(new Error("Invalid data URL format."));
        }
      } else {
        reject(new Error("Failed to read file as a data URL."));
      }
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  } as const;
};

// Utility to convert a data URL to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error("Invalid data URL format for MIME type extraction.");
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

const initialFilterValues = {
  grayscale: 0,
  sepia: 0,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  blur: 0,
};

const filterConfig = [
  { id: "grayscale", name: "Grayscale", min: 0, max: 100, unit: "%" },
  { id: "sepia", name: "Sepia", min: 0, max: 100, unit: "%" },
  { id: "brightness", name: "Brightness", min: 0, max: 200, unit: "%" },
  { id: "contrast", name: "Contrast", min: 0, max: 200, unit: "%" },
  { id: "saturate", name: "Saturation", min: 0, max: 200, unit: "%" },
  { id: "blur", name: "Blur", min: 0, max: 10, unit: "px" },
] as const;

export default function Home() {
  const [uploadedImages, setUploadedImages] = useState<
    { file: File; url: string }[]
  >([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [generatedImages, setGeneratedImages] = useState<{
    [key: number]: { url: string; file: File };
  }>({});
  const [filters, setFilters] = useState(initialFilterValues);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFilters(initialFilterValues);
  }, [selectedImageIndex]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      if (file) {
        const newImage = { file, url: URL.createObjectURL(file) };
        setUploadedImages([newImage]);
        setSelectedImageIndex(0);
        setGeneratedImages({});
        setPrompt("");
        setError(null);
      }
    }
    // Reset the input value to allow uploading the same file again
    e.target.value = "";
  };

  const handleFilterChange = (id: string, value: string) => {
    setFilters((prev) => ({ ...prev, [id]: parseInt(value, 10) }));
  };

  const resetFilters = () => {
    setFilters(initialFilterValues);
  };

  const handleGenerateClick = async () => {
    if (selectedImageIndex === null || !prompt) return;
    const currentImage = uploadedImages[selectedImageIndex];
    if (!currentImage) return;

    setLoading(true);
    setError(null);
    setFilters(initialFilterValues);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing NEXT_PUBLIC_GEMINI_API_KEY");
      const ai = new GoogleGenAI({ apiKey });
      const imagePart = await fileToGenerativePart(currentImage.file);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: {
          parts: [imagePart, { text: prompt }],
        },
        config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
      });

      const candidates = (response as any)?.candidates ?? [];
      let imageFound = false;
      for (const cand of candidates) {
        const parts = cand?.content?.parts ?? [];
        for (const part of parts) {
          const inlineData = (part as any).inlineData as
            | { data: string; mimeType: string }
            | undefined;
          if (inlineData) {
            const { data, mimeType } = inlineData;
            const url = `data:${mimeType};base64,${data}`;
            const file = dataURLtoFile(
              url,
              `generated-${currentImage.file.name}`
            );
            setGeneratedImages((prev) => ({
              ...prev,
              [selectedImageIndex!]: { url, file },
            }));
            imageFound = true;
            break;
          }
        }
        if (imageFound) break;
      }
      if (!imageFound) {
        setError("Model did not return an image. Please try again.");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(`Error: ${message}`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getFilterString = () => {
    return filterConfig
      .map((f) => {
        const value = (filters as any)[f.id as keyof typeof filters];
        const initialValue = (initialFilterValues as any)[
          f.id as keyof typeof initialFilterValues
        ];
        return value !== initialValue ? `${f.id}(${value}${f.unit})` : "";
      })
      .filter(Boolean)
      .join(" ");
  };

  const handleDownload = (file: File | undefined, filterString: string) => {
    if (!file) return;

    const filtersAreActive = filterString.trim() !== "";

    if (!filtersAreActive) {
      // Simple download for unfiltered images
      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } else {
      // Canvas-based download for filtered images
      const img = new Image();
      // Required for cross-origin images on a canvas
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          (ctx as any).filter = filterString;
          ctx.drawImage(img, 0, 0);
          const link = document.createElement("a");
          link.href = canvas.toDataURL(file.type);
          link.download = `filtered-${file.name}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const selectedImage =
    selectedImageIndex !== null ? uploadedImages[selectedImageIndex] : null;
  const generatedImage =
    selectedImageIndex !== null ? generatedImages[selectedImageIndex] : null;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Plantainbananas Editor</h1>
      </header>
      <main className="main-layout">
        <aside className="left-toolbar">
          <label htmlFor="file-upload" className="tool-button active" aria-label="Upload Image">
            <span className="material-icons">upload_file</span>
            Upload
          </label>
          <input id="file-upload" type="file" accept="image/*" onChange={handleImageUpload} />
        </aside>

        <section className="canvas-area">
          <div className="image-panels">
            <div className="panel" aria-labelledby="original-image-heading">
              <h2 id="original-image-heading">Original</h2>
              <div className="image-container">
                {selectedImage ? (
                  <>
                    <img src={selectedImage.url} alt="Original uploaded content" />
                    <button
                      className="download-button"
                      onClick={() => handleDownload(selectedImage.file, "")}
                      aria-label="Download original image"
                      title="Download original image"
                    >
                      <span className="material-icons">download</span>
                    </button>
                  </>
                ) : (
                  <div className="placeholder">
                    <span className="material-icons">add_photo_alternate</span>
                    <span>Upload an image to start</span>
                  </div>
                )}
              </div>
            </div>
            <div className="panel" aria-labelledby="generated-image-heading">
              <h2 id="generated-image-heading">Generated</h2>
              <div className="image-container">
                {loading && (
                  <div className="loader" role="status" aria-label="Loading generated image"></div>
                )}
                {!loading && generatedImage ? (
                  <>
                    <img src={generatedImage.url} alt="AI generated content" style={{ filter: getFilterString() }} />
                    <button
                      className="download-button"
                      onClick={() => handleDownload(generatedImage.file, getFilterString())}
                      aria-label="Download generated image"
                      title="Download generated image"
                    >
                      <span className="material-icons">download</span>
                    </button>
                  </>
                ) : (
                  !loading && (
                    <div className="placeholder">
                      <span className="material-icons">auto_awesome</span>
                      <span>Your generated image will appear here</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className="right-sidebar">
          <div className="sidebar-panel">
            <h3>
              <span className="material-icons">edit</span>
              Generator
            </h3>
            <textarea
              className="prompt-input"
              placeholder="Describe your edits (e.g., 'add a birthday hat', 'make it a sunny day')..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={!selectedImage || loading}
              aria-label="Image edit prompt"
              rows={4}
            />
            <button
              className="generate-button"
              onClick={handleGenerateClick}
              disabled={!prompt || !selectedImage || loading}
            >
              <span className="material-icons">auto_awesome</span>
              {loading ? "Generating..." : "Generate"}
            </button>
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
          </div>

          {generatedImage && !loading && (
            <div className="sidebar-panel">
              <h3>
                <span className="material-icons">tune</span>
                Adjustments
              </h3>
              <div className="filter-controls">
                {filterConfig.map((filter) => (
                  <div key={filter.id} className="filter-slider">
                    <label htmlFor={filter.id}>{filter.name}</label>
                    <input
                      type="range"
                      id={filter.id}
                      name={filter.id}
                      min={filter.min}
                      max={filter.max}
                      value={(filters as any)[filter.id as keyof typeof filters]}
                      onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    />
                    <span>
                      {(filters as any)[filter.id as keyof typeof filters]}
                      {filter.unit}
                    </span>
                  </div>
                ))}
                <button onClick={resetFilters} className="reset-button">
                  <span className="material-icons" style={{ fontSize: "16px" }}>
                    refresh
                  </span>
                  Reset
                </button>
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
