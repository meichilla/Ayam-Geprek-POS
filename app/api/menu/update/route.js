import { supabaseServer } from "@/lib/supabaseServer";

export async function PUT(req) {
  const supabase = supabaseServer();

  const body = await req.json();
  const { id, ...fields } = body;

  if (!id) {
    return Response.json(
      { error: "Missing menu id" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("menu")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, data });
}
