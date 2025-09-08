"use client";

import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import NextImage from "next/image";

export function CanvasPane({
  title,
  imageUrl,
  overlay,
  busy,
  filter,
}: {
  title: string;
  imageUrl?: string | null;
  overlay?: React.ReactNode;
  busy?: boolean;
  filter?: string;
}) {
  return (
    <Paper sx={{ p: 2, minHeight: 400, display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="subtitle1" align="center" color="text.secondary">
        {title}
      </Typography>
      <Box sx={{ position: "relative", flex: 1, minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default", borderRadius: 1 }}>
        {busy && <CircularProgress color="primary" />}
        {!busy && imageUrl ? (
          <>
            <NextImage src={imageUrl} alt={title} fill unoptimized sizes="(max-width: 1024px) 100vw, 50vw" style={{ objectFit: "contain", filter }} />
            {overlay}
          </>
        ) : null}
        {!busy && !imageUrl ? (
          <Stack alignItems="center" spacing={2}>
            <Typography color="text.secondary">No image</Typography>
          </Stack>
        ) : null}
      </Box>
    </Paper>
  );
}
