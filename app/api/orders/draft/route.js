import { supabaseServer } from "@/lib/supabaseServer";;

export async function GET(req) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(req.url);

  const tableId = searchParams.get("table_id");
  const orderId = searchParams.get("orderId");

  let query = supabase.from("orders").select("*").eq("status", "draft");

  if (tableId) query = query.eq("table_id", tableId);

  if (orderId) query = query.eq("id", orderId);

  const { data, error } = await query;

  if (error) return Response.json({ error }, { status: 500 });

  if (orderId) return Response.json(data?.[0] ?? null);

  if (tableId) return Response.json(data?.[0] ?? null);

  return Response.json(data);
}
