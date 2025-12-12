import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        id,
        source,
        external_id,
        customer_name,
        total_price,
        created_at,
        status,
        order_type,
        order_items (
          menu_name,
          quantity,
          subtotal
        )
      `)
      .eq("order_type", "online")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET /api/online error:", error);
      return Response.json({ error }, { status: 500 });
    }

    const drafts = orders.filter((o) => o.status === "draft");
    const completed = orders.filter((o) => o.status === "completed");

    const sorted = [...drafts, ...completed];

    const result = sorted.map((o) => ({
      id: o.id,
      source: o.source,
      external_id: o.external_id,
      customer_name: o.customer_name,
      total_price: o.total_price,
      created_at: o.created_at,
      status: o.status,
      items: o.order_items || [],
    }));

    return Response.json(result);
  } catch (err) {
    console.error("API /online error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
