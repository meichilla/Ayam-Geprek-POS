import { supabase } from "../../../../lib/supabaseClient";

export async function DELETE(req) {
  const body = await req.json();

  const { error } = await supabase
    .from("menu")
    .delete()
    .eq("id", body.id);

  if (error) return Response.json({ error }, { status: 500 });

  return Response.json({ success: true });
}
