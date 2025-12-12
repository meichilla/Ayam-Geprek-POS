import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req) {
  const supabase = supabaseServer();

  const body = await req.json();

  const { error } = await supabase
    .from("menu")
    .insert(body);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
