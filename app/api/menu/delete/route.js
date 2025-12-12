import { supabaseServer } from "@/lib/supabaseServer";

export async function DELETE(req) {
  const supabase = supabaseServer();

  const { id } = await req.json();

  if (!id) {
    return Response.json({ error: "Missing menu id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("menu")
    .delete()
    .eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
