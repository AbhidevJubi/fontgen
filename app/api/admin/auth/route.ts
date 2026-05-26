import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { supabase } from "@/lib/supabase-server";

/**
 * Admin Authentication API
 * POST /api/admin/auth
 *
 * Request body:
 * {
 *   action: "login" | "logout",
 *   email?: string,
 *   password?: string
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password } = body;

    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password required" },
          { status: 400 },
        );
      }

      // Fetch admin from database
      const { data, error } = await supabase
        .from("admin_credentials")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 },
        );
      }

      // Compare password hash
      const passwordMatch = await bcrypt.compare(password, data.password_hash);

      if (!passwordMatch) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 },
        );
      }

      // Create session token (simple JWT-like)
      const token = Buffer.from(
        JSON.stringify({
          adminId: data.id,
          email: data.email,
          iat: Date.now(),
        }),
      ).toString("base64");

      return NextResponse.json(
        {
          success: true,
          token,
          email: data.email,
        },
        { status: 200 },
      );
    }

    if (action === "logout") {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Auth error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
