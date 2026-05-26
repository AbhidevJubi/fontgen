import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";

/**
 * Movies API
 * GET: Fetch all movies
 * POST: Create new movie (admin only)
 * PUT: Update movie (admin only)
 * DELETE: Delete movie (admin only)
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language");
    const actor = searchParams.get("actor");
    const year = searchParams.get("year");
    const featured = searchParams.get("featured");

    let query = supabase.from("movies").select("*");

    if (language) query = query.eq("language", language);
    if (actor) query = query.eq("actor", actor);
    if (year) query = query.eq("year", parseInt(year));
    if (featured) query = query.eq("featured", featured === "true");

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("GET movies error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      movieName,
      language,
      actor,
      year,
      featured,
      titleImageUrl,
      sampleImagesUrls,
    } = body;

    if (!movieName || !language || !actor || !year || !titleImageUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("movies")
      .insert([
        {
          movie_name: movieName,
          language,
          actor,
          year: parseInt(year),
          featured: featured || false,
          title_image_url: titleImageUrl,
          sample_images_urls: sampleImagesUrls || [],
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data[0] }, { status: 201 });
  } catch (err) {
    console.error("POST movie error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      movieName,
      language,
      actor,
      year,
      featured,
      titleImageUrl,
      sampleImagesUrls,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Movie ID required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("movies")
      .update({
        ...(movieName && { movie_name: movieName }),
        ...(language && { language }),
        ...(actor && { actor }),
        ...(year && { year: parseInt(year) }),
        ...(featured !== undefined && { featured }),
        ...(titleImageUrl && { title_image_url: titleImageUrl }),
        ...(sampleImagesUrls && { sample_images_urls: sampleImagesUrls }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data[0] }, { status: 200 });
  } catch (err) {
    console.error("PUT movie error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Movie ID required" }, { status: 400 });
    }

    const { error } = await supabase.from("movies").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE movie error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
