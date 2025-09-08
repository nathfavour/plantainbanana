import { NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server is missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("image");
    const prompt = formData.get("prompt");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing image file in form data" },
        { status: 400 }
      );
    }
    if (typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Missing prompt in form data" },
        { status: 400 }
      );
    }

    const mimeType = file.type || "application/octet-stream";
    const buf = Buffer.from(await file.arrayBuffer());
    const base64 = buf.toString("base64");

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType } },
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const candidates: any[] = (response as any)?.candidates ?? [];
    for (const cand of candidates) {
      const parts: any[] = cand?.content?.parts ?? [];
      for (const part of parts) {
        const inlineData = (part as any).inlineData as
          | { data: string; mimeType: string }
          | undefined;
        if (inlineData?.data && inlineData?.mimeType) {
          return NextResponse.json({
            data: inlineData.data,
            mimeType: inlineData.mimeType,
          });
        }
      }
    }

    return NextResponse.json(
      { error: "Model did not return an image" },
      { status: 502 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
