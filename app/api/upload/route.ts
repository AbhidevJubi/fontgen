import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

export const dynamic = 'force-dynamic';

/**
 * File Upload API
 * POST /api/upload
 *
 * Request body: FormData with:
 * - file: File object
 * - bucketName: "movie-titles" | "sample-backgrounds"
 * - fileName: optional custom filename
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bucketName = formData.get("bucketName") as string;
    const fileName = formData.get("fileName") as string;

    if (!file || !bucketName) {
      return NextResponse.json(
        { error: "File and bucketName required" },
        { status: 400 },
      );
    }

    // Validate bucket name
    if (!["movie-titles", "sample-backgrounds"].includes(bucketName)) {
      return NextResponse.json(
        { error: "Invalid bucket name" },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();

    // Generate unique filename
    const fileExtension = file.name.split(".").pop();
    const uniqueName =
      fileName ||
      `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(uniqueName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create a signed URL for private storage access
    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(data.path, 60 * 60 * 24 * 7);

    if (signedError) {
      console.warn(
        "Signed URL generation failed, falling back to public URL:",
        signedError.message,
      );
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(data.path);

      return NextResponse.json(
        {
          success: true,
          url: publicUrl,
          path: data.path,
          bucketName,
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        url: signedData.signedUrl,
        path: data.path,
        bucketName,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
