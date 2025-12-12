import { supabase } from "@/lib/supabaseClient";

export async function POST(req) {
  const form = await req.formData();
  const file = form.get("file");

  if (!file) {
    return Response.json({ error: "No file uploaded" }, { status: 400 });
  }

  const fileName = `menu/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from("iam-gondes")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 400 });
  }

  // Public URL
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/iam-gondes/${fileName}`;

  return Response.json({ url });
}
