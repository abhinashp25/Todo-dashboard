import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client (uses same anon key — RLS handles security)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { parent_title, ghost_title, priority, accepted } = await req.json();

    const { error } = await supabase.from("ghost_feedback").insert({
      parent_title,
      ghost_title,
      priority,
      accepted,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/ghost-feedback]", err);
    return NextResponse.json({ error: "Failed to log feedback" }, { status: 500 });
  }
}
