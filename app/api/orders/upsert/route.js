import { supabaseServer } from "@/lib/supabaseServer";;

export async function POST(req) {
  const supabase = supabaseServer();
  const body = await req.json();
  const { table_id, order_id, items, order_type = "dine-in", customer_name, source } = body;

  const total = items.reduce((s, it) => s + (it.subtotal || 0), 0);

  // =============================
  // 1. CREATE ORDER BARU
  // =============================
  if (!order_id) {
    const { data: newOrder, error: orderErr } = await supabase
      .from("orders")
      .insert({
        table_id: order_type === "dine-in" ? table_id : null,
        order_type,
        status: "draft",
        total_price: total,
        customer_name: customer_name || null,
        source
      })
      .select()
      .single();

    if (orderErr) return Response.json({ error: orderErr }, { status: 500 });

    const formatted = items.map((it) => ({
      order_id: newOrder.id,
      menu_id: it.menu_id,
      menu_name: it.menu_name,
      unit_price: it.unit_price,
      quantity: it.quantity,
      subtotal: it.subtotal,
      item_type: "main",
    }));

    const { error: itemErr } = await supabase
      .from("order_items")
      .insert(formatted);

    if (itemErr) return Response.json({ error: itemErr }, { status: 500 });

    return Response.json({ order: newOrder });
  }

  // =============================
  // 2. UPDATE ORDER EXISTING
  // =============================
  const { data: updatedOrder, error: updErr } = await supabase
    .from("orders")
    .update({
      total_price: total,
      table_id: order_type === "dine-in" ? table_id : null,
      customer_name: customer_name || null,
      source
    })
    .eq("id", order_id)
    .select()
    .single();

  if (updErr) return Response.json({ error: updErr }, { status: 500 });

  // =============================
  // 3. DELETE ITEM YANG HILANG
  // =============================
  const { data: existingItems } = await supabase
    .from("order_items")
    .select("menu_id")
    .eq("order_id", order_id);

  const existingIds = existingItems.map((i) => i.menu_id);
  const incomingIds = items.map((i) => i.menu_id);

  const toDelete = existingIds.filter((id) => !incomingIds.includes(id));

  if (toDelete.length > 0) {
    await supabase
      .from("order_items")
      .delete()
      .eq("order_id", order_id)
      .in("menu_id", toDelete);
  }

  // =============================
  // 4. UPSERT SEMUA ITEM
  // =============================
  for (const it of items) {
    await supabase.from("order_items").upsert({
      order_id,
      menu_id: it.menu_id,
      menu_name: it.menu_name,
      unit_price: it.unit_price,
      quantity: it.quantity,
      subtotal: it.subtotal,
      item_type: "main",
    });
  }

  return Response.json({ order: updatedOrder });
}
