import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req) {
  try {
    const supabase = supabaseServer();
    const body = await req.json();
    const {
      order_id,
      order_type,
      source,
      external_id,
      customer_name,
      payment_method,
      items = [],
    } = body;

    let orderId = order_id;

    if (!orderId) {
      orderId = crypto.randomUUID();

      const { error: createErr } = await supabase
        .from("orders")
        .insert({
          id: orderId,
          status: "draft",
          order_type: order_type || "online",
          payment_method,
          source,
          external_id,
          customer_name,
          total_price: 0,
        });

      if (createErr) {
        return Response.json({ error: createErr.message }, { status: 500 });
      }
    }

    // =============================
    // RESET ITEMS
    // =============================
    await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId);

    // =============================
    // INSERT ITEMS
    // =============================
    if (items.length > 0) {
      const payload = items.map((it) => ({
        order_id: orderId,
        menu_id: it.menu_id,
        unit_price: it.unit_price,
        menu_name: it.menu_name,
        quantity: it.quantity,
        subtotal: it.subtotal,
      }));

      const { error: itemErr } = await supabase
        .from("order_items")
        .insert(payload);

      if (itemErr) {
        return Response.json({ error: itemErr.message }, { status: 500 });
      }
    }

    // =============================
    // UPDATE TOTAL
    // =============================
    const total = items.reduce((s, it) => s + (it.subtotal ?? 0), 0);

    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        total_price: total,
        source,
        external_id,
        customer_name,
      })
      .eq("id", orderId);

    if (updateErr) {
      return Response.json({ error: updateErr.message }, { status: 500 });
    }

    return Response.json({
      order: {
        id: orderId,
        source,
        external_id,
        customer_name,
        total_price: total,
      },
    });
  } catch (err) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
