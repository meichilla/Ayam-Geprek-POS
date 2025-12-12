import { supabase } from "@/lib/supabaseClient";

export async function POST(req) {
  try {
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

      const { error: createErr } = await supabase.from("orders").insert({
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
        console.error("Insert order error:", createErr);
        return Response.json({ error: createErr }, { status: 500 });
      }
    }

    await supabase.from("order_items").delete().eq("order_id", orderId);

    // Insert baru
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
        console.error("Item insert error:", itemErr);
        return Response.json({ error: itemErr }, { status: 500 });
      }
    }

    // Update total
    const total = items.reduce((s, it) => s + (it.subtotal ?? 0), 0);

    await supabase
      .from("orders")
      .update({
        total_price: total,
        source,
        external_id,
        customer_name,
      })
      .eq("id", orderId);

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
    console.error("UPSERT ONLINE ERROR:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
