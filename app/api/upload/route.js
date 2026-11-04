import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import { redis } from "@/lib/db";

export async function POST(req) {
  const body = await req.json();
  try {
    const res = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_path, clientPayload) => {
        if (!(await redis.exists(`printer:${clientPayload}`))) throw new Error("Unknown shop");
        return {
          allowedContentTypes: ["application/pdf", "image/jpeg", "image/png"],
          maximumSizeInBytes: 25 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(res);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
