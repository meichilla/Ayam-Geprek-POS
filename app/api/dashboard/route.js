import { supabase } from "@/lib/supabaseClient";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const range = searchParams.get("range") || "day";
    const start = searchParams.get("start");
    const end   = searchParams.get("end");

    // === DATE RANGE ===
    const today = new Date();
    let fromDate, toDate;

    if (range === "day") {
      fromDate = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      toDate   = new Date().toISOString();
    } else if (range === "week") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      fromDate = d.toISOString();
      toDate   = new Date().toISOString();
    } else if (range === "month") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      fromDate = d.toISOString();
      toDate   = new Date().toISOString();
    } else if (range === "custom" && start && end) {
      fromDate = new Date(start).toISOString();
      toDate   = new Date(`${end}T23:59:59`).toISOString();
    } else {
      fromDate = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      toDate   = new Date().toISOString();
    }

    // === GET ORDERS ===
    const { data: trx, error } = await supabase
      .from("orders")
      .select(`
        id,
        total_price,
        payment_method,
        order_type,
        source,
        created_at,
        customer_name,
        external_id,

        tables:tables!orders_table_id_fkey (
          table_number
        ),

        order_items (
          menu_name,
          quantity,
          subtotal
        )
      `)
      .in("status", ["paid", "completed"])
      .gte("created_at", fromDate)
      .lte("created_at", toDate)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Dashboard query error:", error);
      return Response.json({ error }, { status: 500 });
    }

    // === SUMMARY ===
    const totalSales = trx.reduce((s, t) => s + (t.total_price ?? 0), 0);
    const totalTrx   = trx.length;

    // === Payment Method Breakdown ===
    const paymentSummary = {};
    trx.forEach((t) => {
      const pm = t.payment_method || t.source || "unknown";
      paymentSummary[pm] = (paymentSummary[pm] || 0) + 1;
    });

    // === TOP SELLING ITEMS ===
    const itemCount = {};
    trx.forEach((t) => {
      (t.order_items || []).forEach((it) => {
        itemCount[it.menu_name] =
          (itemCount[it.menu_name] || 0) + it.quantity;
      });
    });

    const topItems = Object.entries(itemCount)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);

    // === Format transactions ===
    const mapped = trx.map((t) => ({
      id: t.id,
      created_at: t.created_at,
      total_price: t.total_price,
      payment_method: t.payment_method,
      order_type: t.order_type,
      source: t.source,
      customer_name: t.customer_name,
      external_id: t.external_id,
      table_name:
        t.tables?.table_number
          ? `Meja ${t.tables.table_number}`
          : t.order_type === "online"
          ? `Online (${t.source})`
          : "Take Away",
    }));

    return Response.json({
      summary: {
        total_trx: totalTrx,
        total_sales: totalSales,
      },
      paymentSummary,
      topItems,
      transactions: mapped,
    });

  } catch (err) {
    console.error("Dashboard API ERROR:", err);
    return Response.json({ error: "Server Failed" }, { status: 500 });
  }
}
