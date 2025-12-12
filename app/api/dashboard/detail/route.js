import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req) {
  const supabase = supabaseServer();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  // =============================
  // GET ORDER
  // =============================
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select(`
      *,
      tables:tables!orders_table_id_fkey (
        table_number
      )
    `)
    .eq("id", id)
    .single();

  if (orderErr) {
    console.error(orderErr);
    return Response.json({ error: orderErr.message }, { status: 500 });
  }

  // =============================
  // GET ITEMS
  // =============================
  const { data: items, error: itemErr } = await supabase
    .from("order_items")
    .select("menu_name, quantity, subtotal")
    .eq("order_id", id);

  if (itemErr) {
    console.error(itemErr);
    return Response.json({ error: itemErr.message }, { status: 500 });
  }

  return Response.json({
    id: order.id,
    table_name: order.tables?.table_number
      ? `Meja ${order.tables.table_number}`
      : "Take Away",
    total_price: order.total_price,
    payment_method: order.payment_method,
    created_at: order.created_at,
    items: items ?? [],
  });
}
