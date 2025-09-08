"use client";

import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import RefreshIcon from "@mui/icons-material/Refresh";

export type FilterValues = {
  grayscale: number;
  sepia: number;
  brightness: number;
  contrast: number;
  saturate: number;
  blur: number;
};

export const initialFilterValues: FilterValues = {
  grayscale: 0,
  sepia: 0,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  blur: 0,
};

export const filterConfig = [
  { id: "grayscale", name: "Grayscale", min: 0, max: 100, unit: "%" },
  { id: "sepia", name: "Sepia", min: 0, max: 100, unit: "%" },
  { id: "brightness", name: "Brightness", min: 0, max: 200, unit: "%" },
  { id: "contrast", name: "Contrast", min: 0, max: 200, unit: "%" },
  { id: "saturate", name: "Saturation", min: 0, max: 200, unit: "%" },
  { id: "blur", name: "Blur", min: 0, max: 10, unit: "px" },
] as const;

export function getFilterString(values: FilterValues): string {
  return filterConfig
    .map((f) => {
      const value = (values as any)[f.id as keyof FilterValues];
      const initialValue = (initialFilterValues as any)[f.id as keyof FilterValues];
      return value !== initialValue ? `${f.id}(${value}${f.unit})` : "";
    })
    .filter(Boolean)
    .join(" ");
}

export function AdjustmentsPanel({ values, onChangeAction, onResetAction }: {
  values: FilterValues;
  onChangeAction: (id: keyof FilterValues, val: number) => void;
  onResetAction: () => void;
}) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Adjustments</Typography>
      <Stack spacing={2}>
        {filterConfig.map((filter) => (
          <Box key={filter.id}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
              <Typography sx={{ minWidth: 80 }} color="text.secondary">{filter.name}</Typography>
              <Slider
                value={(values as any)[filter.id as keyof FilterValues]}
                onChange={(_, val) => onChangeAction(filter.id as keyof FilterValues, Number(val))}
                min={filter.min}
                max={filter.max}
                aria-labelledby={filter.id}
              />
              <Typography color="text.secondary" sx={{ minWidth: 48, textAlign: "right" }}>
                {(values as any)[filter.id as keyof FilterValues]}{filter.unit}
              </Typography>
            </Stack>
          </Box>
        ))}
        <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={onResetAction}>Reset</Button>
      </Stack>
    </Paper>
  );
}
