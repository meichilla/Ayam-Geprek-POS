import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(req.url);

  const order_type = searchParams.get("order_type");
  const date = searchParams.get("date");     // yyyy-mm-dd
  const start = searchParams.get("start");   // yyyy-mm-dd
  const end = searchParams.get("end");       // yyyy-mm-dd

  let query = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  // =====================================================
  // FILTER: ORDER TYPE
  // =====================================================
  if (order_type) {
    query = query.eq("order_type", order_type);
  }

  // =====================================================
  // FILTER: DATE
  // =====================================================
  if (date) {
    query = query
      .gte("created_at", `${date}T00:00:00`)
      .lt("created_at", `${date}T23:59:59`);
  }

  // =====================================================
  // FILTER: RANGE
  // =====================================================
  if (start && end) {
    query = query
      .gte("created_at", `${start}T00:00:00`)
      .lte("created_at", `${end}T23:59:59`);
  }

  // =====================================================
  // DEFAULT: TODAY (ANTI DATA KEBANYAKAN)
  // =====================================================
  if (!date && !start && !end) {
    const today = new Date().toISOString().split("T")[0];
    query = query
      .gte("created_at", `${today}T00:00:00`)
      .lt("created_at", `${today}T23:59:59`);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
