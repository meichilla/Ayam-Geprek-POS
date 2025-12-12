import { supabase } from "../../../lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .order("table_number", { ascending: true });

  if (error) return Response.json({ error }, { status: 500 });

  return Response.json(data);
}
