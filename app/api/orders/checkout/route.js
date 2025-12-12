import { supabase } from "@/lib/supabaseClient";

export async function POST(req) {
  const body = await req.json();
  const { order_id, amount_paid, payment_method } = body;

  if (!order_id) {
    return Response.json({ error: "Missing order_id" }, { status: 400 });
  }

  // === 1. Ambil order ===
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, total_price, status")
    .eq("id", order_id)
    .single();

  if (orderErr || !order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status === "paid") {
    return Response.json({ error: "Order already paid" }, { status: 400 });
  }

  // === 2. Hitung kembalian ===
  const total = order.total_price || 0;
  const paid = Number(amount_paid || 0);
  const change = paid - total;

  if (paid < total) {
    return Response.json(
      { error: "Pembayaran kurang", total, paid },
      { status: 400 }
    );
  }

  // === 3. Update order menjadi PAID ===
  const { data: updated, error: updErr } = await supabase
    .from("orders")
    .update({
      status: "paid",
      paid_amount: paid,
      change_returned: change,
      payment_method,
      paid_at: new Date().toISOString(),
    })
    .eq("id", order_id)
    .select()
    .single();

  if (updErr) {
    console.error(updErr);
    return Response.json({ error: updErr }, { status: 500 });
  }

  return Response.json({
    message: "Checkout Berhasil",
    order: updated,
  });
}
