import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const ONLINE_SOURCES = ["grabfood", "shopeefood", "gofood"];
const DIRECT_TO_SUPPLIER_PM = ["qriss"];

export async function GET(req) {
  try {
    const supabase = supabaseServer();
    const { searchParams } = new URL(req.url);

    const range = searchParams.get("range") || "day";
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    /* ===============================
       DATE RANGE
    =============================== */
    const today = new Date();
    let fromDate, toDate;

    if (range === "day") {
      fromDate = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      toDate = new Date().toISOString();
    } else if (range === "week") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      fromDate = d.toISOString();
      toDate = new Date().toISOString();
    } else if (range === "month") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      fromDate = d.toISOString();
      toDate = new Date().toISOString();
    } else if (range === "custom" && start && end) {
      fromDate = new Date(start).toISOString();
      toDate = new Date(`${end}T23:59:59`).toISOString();
    } else {
      fromDate = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      toDate = new Date().toISOString();
    }

    /* ===============================
       FETCH ORDERS
    =============================== */
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        id,
        total_price,
        payment_method,
        source,
        created_at,
        supplier_share,
        partner_share,
        order_items (
          menu_id,
          menu_name,
          quantity,
          subtotal,
          supplier_code,
          menu:menu_id (
            category_id,
            categories:category_id (
              name
            )
          )
        )
      `)
      .in("status", ["paid", "completed"])
      .gte("created_at", fromDate)
      .lte("created_at", toDate);

    if (error) {
      console.error("Settlement query error:", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    /* ===============================
       EMPTY GUARD
    =============================== */
    if (!orders || orders.length === 0) {
      return NextResponse.json({
        summary: {
          partner: { cash_in_hand: 0, revenue: 0 },
          supplier: { revenue: 0, cash_received: 0, cash_pending: 0 },
        },
        supplierPending: {},
        detail_items: [],
      });
    }

    /* ===============================
       AGGREGATION
    =============================== */
    let supplierRevenue = 0;
    let supplierCashDirect = 0;
    let partnerCash = 0;
    let partnerRevenue = 0;

    const supplierPending = {};
    const detail_items = [];

    orders.forEach((o) => {
      const isOnline = ONLINE_SOURCES.includes(o.source);
      const directToSupplier =
        isOnline || DIRECT_TO_SUPPLIER_PM.includes(o.payment_method);

      supplierRevenue += o.supplier_share ?? 0;
      partnerRevenue += o.partner_share ?? 0;

      if (directToSupplier) {
        supplierCashDirect += o.total_price ?? 0;
      } else {
        partnerCash += o.total_price ?? 0;
      }

      (o.order_items || []).forEach((it) => {
        const categoryName =
          it.menu?.categories?.name ?? "Uncategorized";

        detail_items.push({
          menu_id: it.menu_id,
          menu_name: it.menu_name,
          category_name: categoryName,
          quantity: it.quantity,
          subtotal: it.subtotal,
          supplier_code: it.supplier_code ?? "UNKNOWN",
          source: o.source,
        });

        if (!directToSupplier) {
          const code = it.supplier_code || "UNKNOWN";
          supplierPending[code] =
            (supplierPending[code] || 0) + (it.subtotal ?? 0);
        }
      });
    });

    /* ===============================
       RESPONSE
    =============================== */
    return NextResponse.json({
      summary: {
        partner: {
          cash_in_hand: partnerCash,
          revenue: partnerRevenue,
        },
        supplier: {
          revenue: supplierRevenue,
          cash_received: supplierCashDirect,
          cash_pending: supplierRevenue - supplierCashDirect,
        },
      },
      supplierPending,
      detail_items,
    });

  } catch (err) {
    console.error("Settlement API ERROR:", err);
    return NextResponse.json(
      { error: "Server Failed" },
      { status: 500 }
    );
  }
}
