import { supabaseServer } from "@/lib/supabaseServer";;

export async function POST(req) {
  const supabase = supabaseServer();
  const body = await req.json();
  const { items, total, paid, change, payment_method } = body;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      total_price: total,
      paid_amount: paid,
      change_amount: change,
      payment_method
    })
    .select()
    .single();

  if (orderError) return Response.json({ error: orderError }, { status: 500 });

  const orderId = order.id;

  const formattedItems = items.map((i) => ({
    order_id: orderId,
    menu_id: i.id,
    menu_name: i.name,
    unit_price: i.price,
    quantity: i.qty,
    subtotal: i.qty * i.price,
    item_type: i.item_type ?? "main",
    supplier_code: i.supplier_code || "S"
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(formattedItems);

  if (itemsError)
    return Response.json({ error: itemsError }, { status: 500 });

  return Response.json({ success: true, orderId });
}
