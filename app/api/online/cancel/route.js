import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req) {
  try {
    const supabase = supabaseServer();
    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      return Response.json(
        { success: false, message: "order_id required" },
        { status: 400 }
      );
    }

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

    if (error) {
      return Response.json({ success: false }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ success: false }, { status: 500 });
  }
}
