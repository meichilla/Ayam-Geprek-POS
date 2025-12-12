import { supabase } from "@/lib/supabaseClient";

export async function GET(req) {
  try {
    const pathname = req.nextUrl.pathname;
    const id = pathname.split("/").pop();

    if (!id) {
      return Response.json(
        { error: "ID tidak ditemukan" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return Response.json(
        { error: "Order tidak ditemukan" },
        { status: 404 }
      );
    }

    return Response.json(data);
  } catch (e) {
    console.error("API error:", e);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
