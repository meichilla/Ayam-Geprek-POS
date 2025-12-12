import { supabaseServer } from "@/lib/supabaseServer";;

export async function POST(req) {
  const supabase = supabaseServer();
  const { order_id } = await req.json();

  if (!order_id) {
    return Response.json({ error: "Missing order_id" }, { status: 400 });
  }
  await supabase.from("order_items").delete().eq("order_id", order_id);

  await supabase.from("orders").delete().eq("id", order_id);

  return Response.json({ success: true });
}
