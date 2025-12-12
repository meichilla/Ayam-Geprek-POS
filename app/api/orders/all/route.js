import { supabase } from "@/lib/supabaseClient";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const order_type = searchParams.get("order_type");

  let query = supabase.from("orders").select("*");

  if (order_type) query = query.eq("order_type", order_type);

  const { data, error } = await query;

  if (error) return Response.json({ error }, { status: 500 });

  return Response.json(data);
}
