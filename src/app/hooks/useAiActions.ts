"use client";

import { useTaskGate } from "../task-gate";

const DEFAULT_TIMEOUT = Number(process.env.NEXT_PUBLIC_GEMINI_TIMEOUT ?? 180000);

export function useAiActions() {
  const { runExclusive } = useTaskGate();

  async function autoSmile(file: File): Promise<{ dataUrl: string; file: File }> {
    const url = await runExclusive(async (signal) => {
      const form = new FormData();
      form.append("image", file);
      form.append("prompt", "Make the subject smile naturally, preserving identity.");
      const res = await fetch("/api/generate", { method: "POST", body: form, signal });
      if (!res.ok) {
        let msg = `${res.status} ${res.statusText}`;
        try { const err = await res.json(); if (err?.error) msg = err.error; } catch {}
        throw new Error(msg);
      }
      const json = (await res.json()) as { data: string; mimeType: string };
      return `data:${json.mimeType};base64,${json.data}`;
    }, { timeoutMs: DEFAULT_TIMEOUT });

    const outFile = dataURLtoFile(url, `smile-${file.name}`);
    return { dataUrl: url, file: outFile };
  }

  return { autoSmile };
}

function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) throw new Error("Invalid data URL");
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}
