"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

/* =========================
   TOGGLE SWITCH COMPONENT
   ========================= */
function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function TableMaster() {
  const { showToast } = useToast();
  const router = useRouter();

  const [tables, setTables] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableName, setNewTableName] = useState("");

  const [editData, setEditData] = useState({
    id: null,
    table_number: "",
    name: "",
    is_active: true,
  });

  /* =========================
     AUTH CHECK
     ========================= */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
    });
  }, [router]);

  /* =========================
     LOAD DATA
     ========================= */
  useEffect(() => {
    loadTables();
  }, []);

  async function loadTables() {
    const res = await fetch("/api/tables");
    const data = await res.json();
    setTables(data ?? []);
  }

  /* =========================
     ADD TABLE
     ========================= */
  async function saveAdd() {
    if (!newTableNumber || !newTableName) {
      showToast("Nomor dan nama meja wajib diisi", "error");
      return;
    }

    const res = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table_number: newTableNumber,
        name: newTableName,
      }),
    });

    if (res.ok) {
      showToast("Meja berhasil ditambahkan", "success");
      setShowAdd(false);
      setNewTableNumber("");
      setNewTableName("");
      loadTables();
    } else {
      const err = await res.json();
      showToast(err.error ?? "Gagal menambah meja", "error");
    }
  }

  /* =========================
     EDIT TABLE
     ========================= */
  async function saveEdit() {
    const res = await fetch(`/api/tables/${editData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });

    if (res.ok) {
      showToast("Meja berhasil diperbarui", "success");
      setShowEdit(false);
      loadTables();
    } else {
      const err = await res.json();
      showToast(err.error ?? "Gagal memperbarui meja", "error");
    }
  }

  /* =========================
     TOGGLE AKTIF / NONAKTIF
     ========================= */
  async function toggleActive(table) {
    const res = await fetch(`/api/tables/${table.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...table, 
        is_active: !table.is_active,
      }),
    });

    if (res.ok) {
      showToast(
        table.is_active ? "Meja dinonaktifkan" : "Meja diaktifkan",
        "success"
      );
      loadTables();
    } else {
      const err = await res.json();
      showToast(err.error ?? "Gagal ubah status meja", "error");
    }
  }

  return (
    <div className="py-6 pb-24">
      <h1 className="text-2xl font-bold mb-4">Master Meja</h1>

      {/* TABLE LIST */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 text-left">No</th>
              <th className="p-3 text-left">Meja</th>
              <th className="p-3 text-right">Status</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {tables.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3">
                  <div className="font-semibold">
                    {t.table_number}
                  </div>
                </td>

                <td className="p-3">
                  <div className="font-semibold">
                    {t.name}
                  </div>
                </td>

                <td className="p-3 text-right">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      t.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {t.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>

                <td className="p-3 text-right flex items-center justify-end gap-3">
                  <button
                    className="text-blue-600"
                    onClick={() => {
                      setEditData(t);
                      setShowEdit(true);
                    }}
                  >
                    Edit
                  </button>

                  <ToggleSwitch
                    checked={t.is_active}
                    onChange={() => toggleActive(t)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD MODAL */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-80">
            <h2 className="font-bold mb-4">Tambah Meja</h2>

            <input
              className="border w-full p-2 mb-3"
              placeholder="Nomor meja"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
            />

            <input
              className="border w-full p-2 mb-4"
              placeholder="Nama meja"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)}>Batal</button>
              <button
                className="bg-black text-white px-4 py-1"
                onClick={saveAdd}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-80">
            <h2 className="font-bold mb-4">Edit Meja</h2>

            <input
              className="border w-full p-2 mb-3"
              value={editData.table_number}
              onChange={(e) =>
                setEditData({ ...editData, table_number: e.target.value })
              }
            />

            <input
              className="border w-full p-2 mb-4"
              value={editData.name}
              onChange={(e) =>
                setEditData({ ...editData, name: e.target.value })
              }
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowEdit(false)}>Batal</button>
              <button
                className="bg-blue-600 text-white px-4 py-1"
                onClick={saveEdit}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 bg-black text-white px-5 py-3 rounded-full shadow"
      >
        + Tambah Meja
      </button>
    </div>
  );
}
