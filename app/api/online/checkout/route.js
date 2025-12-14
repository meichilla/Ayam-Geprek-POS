import { supabaseServer } from "@/lib/supabaseServer";
import { create } from "domain";

export async function POST(req) {
  try {
    const supabase = supabaseServer();
    const { order_id } = await req.json();

    if (!order_id) {
      return Response.json(
        { success: false, message: "order_id required" },
        { status: 400 }
      );
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, total_price")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return Response.json(
        { success: false, message: "order not found" },
        { status: 404 }
      );
    }

    const supplierShare = order.total_price ?? 0;

    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        status: "completed",
        paid_at: new Date().toISOString(),
        cash_bucket: "S",
        paid_amount: order.total_price,
        supplier_share: supplierShare,
        partner_share: 0,
      })
      .eq("id", order_id);

    if (updateErr) {
      console.error(updateErr);
      return Response.json({ success: false }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ success: false }, { status: 500 });
  }
}
