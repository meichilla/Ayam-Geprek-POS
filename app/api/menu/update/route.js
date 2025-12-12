import { supabase } from "../../../../lib/supabaseClient";

export async function PUT(req) {
  const body = await req.json();
  const { id, ...fields } = body;

  const { data, error } = await supabase
    .from("menu")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error }, { status: 500 });

  return Response.json({ success: true, data });
}
