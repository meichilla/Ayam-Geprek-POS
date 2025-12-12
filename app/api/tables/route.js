import { supabaseServer } from "@/lib/supabaseServer";;

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .order("table_number", { ascending: true });

  if (error) return Response.json({ error }, { status: 500 });

  return Response.json(data);
}

export async function POST(req) {
  const supabase = supabaseServer();
  const { table_number, name } = await req.json();

  if (!table_number || !name) {
    return Response.json(
      { error: "table_number dan name wajib diisi" },
      { status: 400 }
    );
  }

  const { data: existing, error: findError } = await supabase
    .from("tables")
    .select("*")
    .eq("table_number", table_number)
    .eq("is_active", false)
    .maybeSingle();

  if (findError) {
    return Response.json(
      { error: findError.message },
      { status: 500 }
    );
  }

  if (existing) {
    const { data, error } = await supabase
      .from("tables")
      .update({
        is_active: true,
        name,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      ...data,
      restored: true,
    });
  }

  const { data, error } = await supabase
    .from("tables")
    .insert({
      table_number,
      name,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    ...data,
    created: true,
  });
}
