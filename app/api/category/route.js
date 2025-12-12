import { supabase } from "../../../lib/supabaseClient";

// =============================
// GET → Ambil semua kategori
// =============================
export async function GET() {
  const { data, error } = await supabase.from("categories").select("*");

  if (error) {
    console.error(error);
    return Response.json([], { status: 500 });
  }

  return Response.json(data ?? []);
}

// =============================
// POST → Tambah kategori
// =============================
export async function POST(req) {
  const { name, type } = await req.json();

  if (!name || !type) {
    return Response.json(
      { success: false, message: "Nama dan tipe wajib diisi" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({ name, type })
    .select()
    .single();

  if (error) {
    console.error(error);
    return Response.json({ success: false }, { status: 500 });
  }

  return Response.json({ success: true, data });
}

// =============================
// PUT → Update kategori
// =============================
export async function PUT(req) {
  const { id, name, type } = await req.json();

  if (!id || !name || !type) {
    return Response.json(
      { success: false, message: "ID, nama, dan tipe wajib diisi" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("categories")
    .update({ name, type })
    .eq("id", id);

  if (error) {
    console.error(error);
    return Response.json({ success: false }, { status: 500 });
  }

  return Response.json({ success: true });
}

// =============================
// DELETE
// =============================
export async function DELETE(req) {
  const { id } = await req.json();

  if (!id) {
    return Response.json(
      { success: false, message: "ID wajib diisi" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    console.error(error);
    return Response.json({ success: false }, { status: 500 });
  }

  return Response.json({ success: true });
}
