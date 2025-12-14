import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req) {
  try {
    const supabase = supabaseServer();
    const body = await req.json();

    const { order_id, amount_paid, payment_method } = body;

    if (!order_id) {
      return Response.json({ error: "Missing order_id" }, { status: 400 });
    }

    // ======================================================
    // 1️⃣ AMBIL ORDER + ITEMS
    // ======================================================
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select(
        `
        id,
        total_price,
        status,
        order_type,
        source,
        order_items (
          quantity,
          unit_price,
          supplier_code
        )
        `
      )
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "paid" || order.status === "completed") {
      return Response.json(
        { error: "Order already finished" },
        { status: 400 }
      );
    }

    // ======================================================
    // 2️⃣ HITUNG TOTAL & VALIDASI BAYAR
    // ======================================================
    const total = Number(order.total_price || 0);
    const paid = Number(amount_paid || 0);

    if (payment_method === "cash" && paid < total) {
      return Response.json(
        { error: "Pembayaran kurang", total, paid },
        { status: 400 }
      );
    }

    const change =
      payment_method === "cash" ? Math.max(paid - total, 0) : 0;

    // ======================================================
    // 3️⃣ HITUNG SPLIT P / S
    // ======================================================
    let partnerShare = 0;
    let supplierShare = 0;

    for (const it of order.order_items || []) {
      const subtotal =
        Number(it.quantity || 0) * Number(it.unit_price || 0);

      if (it.supplier_code === "S") {
        supplierShare += subtotal;
      } else {
        partnerShare += subtotal;
      }
    }

    // ======================================================
    // 4️⃣ TENTUKAN CASH BUCKET
    // ======================================================
    const isOnline =
      order.order_type === "online" ||
      ["grabfood", "shopeefood", "gofood"].includes(order.source);

    const cashBucket = isOnline ? "S" : "P";

    // ONLINE: semua ke S
    if (isOnline) {
      supplierShare = total;
      partnerShare = 0;
    }

    // ======================================================
    // 5️⃣ UPDATE ORDER (FINAL)
    // ======================================================
    const { data: updated, error: updErr } = await supabase
      .from("orders")
      .update({
        status: "paid",
        paid_amount: paid || total,
        change_returned: change,
        payment_method,
        paid_at: new Date().toISOString(),
        cash_bucket: cashBucket,
        partner_share: partnerShare,
        supplier_share: supplierShare,
      })
      .eq("id", order_id)
      .select()
      .single();

    if (updErr) {
      console.error(updErr);
      return Response.json({ error: "Failed to update order" }, { status: 500 });
    }

    return Response.json({
      message: "Checkout berhasil",
      order: updated,
    });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
