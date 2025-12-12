import { supabase } from "../../../../lib/supabaseClient";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("order_id");

  if (!orderId) {
    return Response.json([], { status: 200 });
  }

  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);

  if (error) return Response.json({ error }, { status: 500 });

  // IMPORTANT → selalu kembalikan array
  return Response.json(data ?? []);
}
