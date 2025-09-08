"use client";

import React from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { TaskGateProvider } from "./task-gate";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#8a3ffc" },
    background: { default: "#121212", paper: "#1e1e1e" },
  },
  shape: { borderRadius: 8 },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TaskGateProvider>
        {children}
      </TaskGateProvider>
    </ThemeProvider>
  );
}
