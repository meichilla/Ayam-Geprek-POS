import { supabase } from "@/lib/supabaseClient";

export async function POST(req) {
  try {
    const body = await req.json();
    const { order_id } = body;

    if (!order_id)
      return Response.json({ success: false, message: "order_id required" });

    await supabase
      .from("order_items")
      .delete()
      .eq("order_id", order_id);

    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", order_id)
      .eq("order_type", "online")
      .eq("status", "draft");

    if (error) return Response.json({ success: false });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ success: false });
  }
}
