"use client";

import React, { useEffect, useState } from "react";
import NextImage from "next/image";
import { GoogleGenAI, Modality } from "@google/genai";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import EditIcon from "@mui/icons-material/Edit";
import TuneIcon from "@mui/icons-material/Tune";
import RefreshIcon from "@mui/icons-material/Refresh";

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
      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } else {
      const img = new Image();
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
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar position="static" color="default" enableColorOnDark>
        <Toolbar>
          <Typography variant="h6" component="div">
            Plantainbananas Editor
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Left toolbar */}
        <Box
          sx={{
            width: 60,
            bgcolor: "background.paper",
            borderRight: 1,
            borderColor: "divider",
            p: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Button
            size="small"
            variant="outlined"
            startIcon={<UploadFileIcon />}
            component="label"
          >
            Upload
            <input hidden type="file" accept="image/*" onChange={handleImageUpload} />
          </Button>
        </Box>

        {/* Canvas area */}
        <Box sx={{ flex: 1, p: 2, overflowY: "auto", bgcolor: "background.default" }}>
          <Grid container spacing={2}>
            {/* Original panel */}
            <Grid xs={12} md={6}>
              <Paper sx={{ p: 2, minHeight: 400, display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="subtitle1" align="center" color="text.secondary">
                  Original
                </Typography>
                <Box
                  sx={{
                    position: "relative",
                    flex: 1,
                    minHeight: 300,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "background.default",
                    borderRadius: 1,
                  }}
                >
                  {selectedImage ? (
                    <>
                      <NextImage
                        src={selectedImage.url}
                        alt="Original uploaded content"
                        fill
                        unoptimized
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        style={{ objectFit: "contain" }}
                      />
                      <IconButton
                        aria-label="Download original image"
                        title="Download original image"
                        onClick={() => handleDownload(selectedImage.file, "")}
                        sx={{ position: "absolute", top: 8, right: 8 }}
                        color="primary"
                      >
                        <DownloadIcon />
                      </IconButton>
                    </>
                  ) : (
                    <Stack alignItems="center" spacing={2}>
                      <AddPhotoAlternateIcon sx={{ fontSize: 48, color: "text.secondary" }} />
                      <Typography color="text.secondary">Upload an image to start</Typography>
                    </Stack>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* Generated panel */}
            <Grid xs={12} md={6}>
              <Paper sx={{ p: 2, minHeight: 400, display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="subtitle1" align="center" color="text.secondary">
                  Generated
                </Typography>
                <Box
                  sx={{
                    position: "relative",
                    flex: 1,
                    minHeight: 300,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "background.default",
                    borderRadius: 1,
                  }}
                >
                  {loading && <CircularProgress color="primary" />}
                  {!loading && generatedImage ? (
                    <>
                      <NextImage
                        src={generatedImage.url}
                        alt="AI generated content"
                        fill
                        unoptimized
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        style={{ objectFit: "contain", filter: getFilterString() }}
                      />
                      <IconButton
                        aria-label="Download generated image"
                        title="Download generated image"
                        onClick={() => handleDownload(generatedImage.file, getFilterString())}
                        sx={{ position: "absolute", top: 8, right: 8 }}
                        color="primary"
                      >
                        <DownloadIcon />
                      </IconButton>
                    </>
                  ) : (
                    !loading && (
                      <Stack alignItems="center" spacing={2}>
                        <AutoAwesomeIcon sx={{ fontSize: 48, color: "text.secondary" }} />
                        <Typography color="text.secondary">Your generated image will appear here</Typography>
                      </Stack>
                    )
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Right sidebar */}
        <Box
          sx={{
            width: 320,
            p: 2,
            bgcolor: "background.paper",
            borderLeft: 1,
            borderColor: "divider",
            overflowY: "auto",
          }}
        >
          <Stack spacing={2}>
            <Paper sx={{ p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <EditIcon fontSize="small" />
                <Typography variant="subtitle1" fontWeight={600}>Generator</Typography>
              </Stack>
              <TextField
                fullWidth
                multiline
                minRows={4}
                placeholder="Describe your edits (e.g., 'add a birthday hat', 'make it a sunny day')..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={!selectedImage || loading}
                aria-label="Image edit prompt"
              />
              <Button
                variant="contained"
                startIcon={<AutoAwesomeIcon />}
                onClick={handleGenerateClick}
                disabled={!prompt || !selectedImage || loading}
                sx={{ mt: 2 }}
              >
                {loading ? "Generating..." : "Generate"}
              </Button>
              {error && (
                <Alert sx={{ mt: 2 }} severity="error" role="alert">{error}</Alert>
              )}
            </Paper>

            {generatedImage && !loading && (
              <Paper sx={{ p: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <TuneIcon fontSize="small" />
                  <Typography variant="subtitle1" fontWeight={600}>Adjustments</Typography>
                </Stack>

                <Stack spacing={2}>
                  {filterConfig.map((filter) => (
                    <Box key={filter.id}>
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                        <Typography sx={{ minWidth: 80 }} color="text.secondary">{filter.name}</Typography>
                        <Slider
                          value={(filters as any)[filter.id as keyof typeof filters]}
                          onChange={(_, val) => handleFilterChange(filter.id, String(val as number))}
                          min={filter.min}
                          max={filter.max}
                          aria-labelledby={filter.id}
                        />
                        <Typography color="text.secondary" sx={{ minWidth: 48, textAlign: "right" }}>
                          {(filters as any)[filter.id as keyof typeof filters]}{filter.unit}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                  <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={resetFilters}>
                    Reset
                  </Button>
                </Stack>
              </Paper>
            )}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
