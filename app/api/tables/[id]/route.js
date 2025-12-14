import { supabaseServer } from "@/lib/supabaseServer";

// ==========================
// UPDATE TABLE (EDIT)
// ==========================
export async function PUT(request, context) {
  const supabase = supabaseServer();
  const { params } = context;
  const { table_number, name, is_active } = await request.json();

  let id = params?.id;
  if (!id) {
    const url = new URL(request.url);
    id = url.pathname.split("/").pop();
  }

  if (!id) {
    return Response.json(
      { error: "ID meja tidak ditemukan" },
      { status: 400 }
    );
  }

  if (!table_number || !name) {
    return Response.json(
      { error: "table_number dan name wajib diisi" },
      { status: 400 }
    );
  }

  if (is_active === true) {
    const { data: conflict } = await supabase
      .from("tables")
      .select("id")
      .eq("table_number", table_number)
      .eq("is_active", true)
      .neq("id", id)
      .maybeSingle();

    if (conflict) {
      return Response.json(
        { error: "Nomor meja sudah aktif digunakan" },
        { status: 409 }
      );
    }
  }

  const { error } = await supabase
    .from("tables")
    .update({
      table_number,
      name,
      is_active,
    })
    .eq("id", id);

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
}