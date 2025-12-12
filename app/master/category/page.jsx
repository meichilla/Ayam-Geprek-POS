"use client";

import { useEffect, useState } from "react";
import React from "react";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function CategoryMaster() {
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);

  // MODAL STATES
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "makanan",
  });

  const [editData, setEditData] = useState({
    id: null,
    name: "",
    type: "makanan",
  });

  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      }
    });
  }, [router]);
  // =====================================================
  // LOAD DATA
  // =====================================================
  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const res = await fetch("/api/category");
    const data = await res.json();
    setCategories(data);
  }

  // =====================================================
  // BADGE CLASS
  // =====================================================
  const badgeClass = (type) => {
    switch (type) {
      case "makanan":
        return "bg-orange-100 text-orange-700";
      case "minuman":
        return "bg-blue-100 text-blue-700";
      case "addon":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // GROUPING
  const grouped = {
    makanan: categories.filter((c) => c.type === "makanan"),
    minuman: categories.filter((c) => c.type === "minuman"),
    addon: categories.filter((c) => c.type === "addon"),
  };

  // =====================================================
  // ADD CATEGORY
  // =====================================================
  async function saveAdd() {
    if (!newCategory.name.trim()) {
      showToast("Nama kategori wajib diisi", "error");
      return;
    }

    const res = await fetch("/api/category", {
      method: "POST",
      body: JSON.stringify(newCategory),
    });

    if (res.ok) {
      showToast("Kategori berhasil ditambahkan", "success");
      setShowAdd(false);
      setNewCategory({ name: "", type: "makanan" });
      loadCategories();
    } else {
      showToast("Gagal menambah kategori", "error");
    }
  }

  // =====================================================
  // EDIT CATEGORY
  // =====================================================
  async function saveEdit() {
    const res = await fetch("/api/category", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });

    if (res.ok) {
      showToast("Kategori berhasil diperbarui", "success");
      setShowEdit(false);
      loadCategories();
    } else {
      showToast("Gagal memperbarui kategori", "error");
    }
  }

  // =====================================================
  // DELETE CATEGORY
  // =====================================================
  async function deleteCategory() {
    const res = await fetch("/api/category", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteId }),
    });

    if (res.ok) {
      showToast("Kategori berhasil dihapus", "success");
      setDeleteId(null);
      loadCategories();
    } else {
      showToast("Gagal menghapus kategori", "error");
    }
  }

  // =====================================================
  // UI RENDER
  // =====================================================
  return (
    <div className="py-6 pb-24 relative">
      <h1 className="text-2xl font-bold mb-4">Master Kategori</h1>

      {/* TABLE */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-200 text-left">
            <tr>
              <th className="p-3">Nama Kategori</th>
              <th className="p-3">Tipe</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {["makanan", "minuman", "addon"].map((typeKey) => (
              <React.Fragment key={typeKey}>
                {grouped[typeKey].length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-3 text-gray-400 italic">
                      Tidak ada kategori.
                    </td>
                  </tr>
                ) : (
                  grouped[typeKey].map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="p-3 font-semibold">{c.name}</td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${badgeClass(
                            c.type
                          )}`}
                        >
                          {c.type}
                        </span>
                      </td>

                      <td className="p-3 text-right space-x-3">
                        <button
                          className="text-blue-600"
                          onClick={() => {
                            setEditData({
                              id: c.id,
                              name: c.name,
                              type: c.type,
                            });
                            setShowEdit(true);
                          }}
                        >
                          Edit
                        </button>

                        <button
                          className="text-red-500"
                          onClick={() => setDeleteId(c.id)}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* =======================================
      ADD MODAL
      =========================================*/}
      {showAdd && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-70 flex items-center justify-center p-6">
          <div className="bg-white p-6 rounded-lg w-80 shadow-xl border">
            <h2 className="text-lg font-bold mb-4">Tambah Kategori</h2>

            <input
              className="border w-full p-2 rounded mb-3"
              placeholder="Nama kategori"
              value={newCategory.name}
              onChange={(e) =>
                setNewCategory({ ...newCategory, name: e.target.value })
              }
            />

            <select
              className="border p-2 w-full rounded mb-4"
              value={newCategory.type}
              onChange={(e) =>
                setNewCategory({ ...newCategory, type: e.target.value })
              }
            >
              <option value="makanan">Makanan</option>
              <option value="minuman">Minuman</option>
              <option value="addon">Addon</option>
            </select>

            <div className="flex justify-end gap-3">
              <button className="px-3 py-1 border rounded" onClick={() => setShowAdd(false)}>
                Batal
              </button>
              <button className="px-4 py-1 bg-black text-white rounded" onClick={saveAdd}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================
      EDIT MODAL
      =========================================*/}
      {showEdit && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-70 flex items-center justify-center p-6">
          <div className="bg-white p-6 rounded-lg w-80 shadow-xl border">
            <h2 className="text-lg font-bold mb-4">Edit Kategori</h2>

            <input
              className="border w-full p-2 rounded mb-3"
              value={editData.name}
              onChange={(e) =>
                setEditData({ ...editData, name: e.target.value })
              }
            />

            <select
              className="border p-2 w-full rounded mb-4"
              value={editData.type}
              onChange={(e) =>
                setEditData({ ...editData, type: e.target.value })
              }
            >
              <option value="makanan">Makanan</option>
              <option value="minuman">Minuman</option>
              <option value="addon">Addon</option>
            </select>

            <div className="flex justify-end gap-3">
              <button className="px-3 py-1 border rounded" onClick={() => setShowEdit(false)}>
                Batal
              </button>
              <button className="px-4 py-1 bg-blue-600 text-white rounded" onClick={saveEdit}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================
      DELETE MODAL
      =========================================*/}
      {deleteId && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-70 flex items-center justify-center p-6">
          <div className="bg-white p-6 rounded-lg w-80 shadow-xl border">
            <h2 className="text-lg font-bold mb-3 text-red-600">
              Hapus Kategori?
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              Data kategori akan dihapus secara permanen.
            </p>

            <div className="flex justify-end gap-3">
              <button className="px-3 py-1 border rounded" onClick={() => setDeleteId(null)}>
                Batal
              </button>
              <button className="px-4 py-1 bg-red-600 text-white rounded" onClick={deleteCategory}>
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 bg-black text-white px-5 py-3 rounded-full shadow-lg hover:bg-gray-900 transition font-semibold text-sm"
      >
        + Tambah Kategori
      </button>
    </div>
  );
}
