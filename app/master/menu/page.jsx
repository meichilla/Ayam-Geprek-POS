"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function MenuMaster() {
  const { showToast } = useToast();

  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuMerged, setMenuMerged] = useState([]);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [newMenuData, setNewMenuData] = useState({
    name: "",
    price: "",
    category_id: "",
    details: "",
    image_url: "",
  });

  const [editData, setEditData] = useState({
    id: null,
    name: "",
    price: "",
    category_id: "",
    details: "",
    image_url: "",
  });

  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      }
    });
  }, [router]);

  // LOAD DATA
  useEffect(() => {
    fetch("/api/menu").then((r) => r.json()).then(setMenu);
    fetch("/api/category").then((r) => r.json()).then(setCategories);
  }, []);

  useEffect(() => {
    const list = menu.map((item) => {
      const cat = categories.find((c) => c.id === item.category_id);

      return {
        ...item,
        category_name: cat?.name ?? "Unknown",
        category_type: cat?.type ?? "",
      };
    });

    setMenuMerged(list);
  }, [menu, categories]);

  // BADGE
  const typeBadge = (t) =>
    t === "makanan"
      ? "bg-orange-100 text-orange-700"
      : t === "minuman"
      ? "bg-blue-100 text-blue-700"
      : t === "addon"
      ? "bg-green-100 text-green-700"
      : "bg-gray-100 text-gray-700";

  // UPLOAD
  async function uploadImage(file) {
    const fd = new FormData();
    fd.append("file", file);

    const up = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await up.json();

    if (!up.ok) {
      showToast("Upload gagal!", "error");
      return "";
    }

    return json.url;
  }

  // SAVE ADD
  async function saveAdd() {
    if (!newMenuData.name.trim()) {
      showToast("Nama menu wajib diisi!", "error");
      return;
    }
    if (!newMenuData.category_id) {
      showToast("Pilih kategori!", "error");
      return;
    }

    const body = {
      ...newMenuData,
      price: Number(newMenuData.price),
      details: newMenuData.details.split("\n").filter((d) => d.trim()),
    };

    const res = await fetch("/api/menu/add", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!res.ok) return showToast("Gagal menambah menu", "error");

    showToast("Menu berhasil ditambahkan!", "success");

    setShowAdd(false);
    setNewMenuData({
      name: "",
      price: "",
      category_id: "",
      details: "",
      image_url: "",
    });

    setMenu(await fetch("/api/menu").then((r) => r.json()));
  }

  // SAVE EDIT
  async function saveEdit() {
    const body = {
      ...editData,
      price: Number(editData.price),
      details: editData.details.split("\n").filter((d) => d.trim()),
    };

    const res = await fetch("/api/menu/update", {
      method: "PUT",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return showToast("Gagal update menu", "error");
    }

    showToast("Menu berhasil diupdate!", "success");

    setShowEdit(false);
    setMenu(await fetch("/api/menu").then((r) => r.json()));
  }

  // DELETE CONFIRM
  async function confirmDelete() {
    const res = await fetch("/api/menu/delete", {
      method: "DELETE",
      body: JSON.stringify({ id: deleteId }),
    });

    if (!res.ok) {
      showToast("Gagal menghapus menu", "error");
      return;
    }

    showToast("Menu berhasil dihapus", "success");

    setMenu(menu.filter((m) => m.id !== deleteId));
    setShowDeleteConfirm(false);
    setDeleteId(null);
  }

  // FILTER
  const filtered = menuMerged.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      categoryFilter === "all" || item.category_id === categoryFilter;
    return matchSearch && matchCat;
  });

  const grouped = categories
    .map((cat) => ({
      ...cat,
      items: filtered.filter((m) => m.category_id === cat.id),
    }))
    .filter((c) => c.items.length > 0);

  // MODAL FORM
  const modal = (isAdd) => {
    const data = isAdd ? newMenuData : editData;
    const setData = isAdd ? setNewMenuData : setEditData;
    const saveFn = isAdd ? saveAdd : saveEdit;

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">
            {isAdd ? "Tambah Menu" : "Edit Menu"}
          </h2>

          {/* IMAGE */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700">Foto Menu</label>

            <div className="mt-3 flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg border bg-gray-100 overflow-hidden flex items-center justify-center">
                {data.image_url ? (
                  <img src={data.image_url} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">No Image</span>
                )}
              </div>

              <button
                className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm"
                onClick={() => document.getElementById("fileInput").click()}
              >
                Pilih Gambar
              </button>

              <input
                id="fileInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const url = await uploadImage(file);
                  if (url) setData({ ...data, image_url: url });
                }}
              />
            </div>
          </div>

          {/* INPUTS */}
          <div className="mb-4">
            <label className="text-sm font-medium">Nama Menu</label>
            <input
              className="border rounded-lg p-2 w-full mt-1"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
            />
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium">Kategori</label>
            <select
              className="border rounded-lg p-2 w-full mt-1"
              value={data.category_id}
              onChange={(e) => setData({ ...data, category_id: e.target.value })}
            >
              <option value="">Pilih kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium">Harga</label>
            <input
              type="number"
              className="border rounded-lg p-2 w-full mt-1"
              value={data.price}
              onChange={(e) => setData({ ...data, price: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Detail</label>
            <textarea
              className="border rounded-lg p-2 w-full mt-1"
              rows="3"
              value={data.details}
              onChange={(e) => setData({ ...data, details: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button
              className="px-4 py-1 border rounded-lg"
              onClick={() => (isAdd ? setShowAdd(false) : setShowEdit(false))}
            >
              Batal
            </button>

            <button className="px-4 py-1 bg-black text-white rounded-lg" onClick={saveFn}>
              Simpan
            </button>
          </div>
        </div>
      </div>
    );
  };

  // DELETE MODAL
  const deleteModal = (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl max-w-xs w-full shadow-lg">
        <h2 className="text-lg font-bold mb-3 text-red-600">Hapus Menu?</h2>
        <p className="text-sm text-gray-600 mb-5">
          Menu akan dihapus secara permanen.
        </p>

        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-1 border rounded-lg"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Batal
          </button>

          <button
            className="px-4 py-1 bg-red-600 text-white rounded-lg"
            onClick={confirmDelete}
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="py-6 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Master Menu</h1>

        <div className="flex gap-3 w-full sm:w-auto">
          <input
            className="border p-2 rounded-md flex-1"
            placeholder="Cari menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border p-2 rounded-md"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Semua</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-8">
        {grouped.map((group) => (
          <div key={group.id}>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              {group.name}
              <span className={`text-xs px-2 py-1 rounded ${typeBadge(group.type)}`}>
                {group.type}
              </span>
            </h2>

            <div className="border rounded-xl bg-white shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3">Menu</th>
                    <th className="p-3">Harga</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {group.items.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex gap-3 items-center min-w-[180px]">
                          <img
                            src={item.image_url || "/noimg.png"}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="text-sm font-semibold break-words">
                            {item.name}
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-semibold whitespace-nowrap">
                        Rp {Number(item.price).toLocaleString()}
                      </td>

                      <td className="p-3 text-right space-x-3 whitespace-nowrap">
                        <button
                          className="text-blue-600"
                          onClick={() => {
                            setEditData({
                              id: item.id,
                              name: item.name,
                              price: item.price,
                              category_id: item.category_id,
                              details: (item.details || []).join("\n"),
                              image_url: item.image_url,
                            });
                            setShowEdit(true);
                          }}
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          className="text-red-500"
                          onClick={() => {
                            setDeleteId(item.id);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </div>
        ))}
      </div>

      {/* ADD BUTTON */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 bg-black text-white p-4 rounded-full shadow-xl"
      >
        <Plus size={22} />
      </button>

      {/* MODALS */}
      {showAdd && modal(true)}
      {showEdit && modal(false)}
      {showDeleteConfirm && deleteModal}
    </div>
  );
}
