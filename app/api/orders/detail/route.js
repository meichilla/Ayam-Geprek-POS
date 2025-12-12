import { supabase } from "@/lib/supabaseClient";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  const { data: items, error: itemErr } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id);

  return Response.json({
    order: order ?? null,
    items: items ?? [],
  });
}
