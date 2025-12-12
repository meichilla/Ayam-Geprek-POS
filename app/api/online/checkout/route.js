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

    const { error } = await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", order_id);

    if (error) {
      return Response.json({ success: false }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ success: false }, { status: 500 });
  }
}
