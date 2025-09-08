"use client";

import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function AppShell({
  left,
  right,
  children,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar position="static" color="default" enableColorOnDark>
        <Toolbar>
          <Typography variant="h6" component="div">Plantainbananas Editor</Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Paper component="aside" sx={{ width: { xs: 64, md: 72 }, p: 1, borderRight: 1, borderColor: "divider", display: { xs: "none", sm: "flex" }, flexDirection: "column", gap: 1 }}>
          {left}
        </Paper>
        <Box component="main" sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {children}
        </Box>
        <Paper component="aside" sx={{ width: { xs: 0, md: 340 }, display: { xs: "none", md: "block" }, p: 2, borderLeft: 1, borderColor: "divider", overflowY: "auto" }}>
          <Stack spacing={2}>{right}</Stack>
        </Paper>
      </Box>
    </Box>
  );
}
