"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { useToast } from "@/components/Toast";

const emptyForm = {
  id: null,
  name: "",
  category_id: "",
  price: "",

  is_gofood: false,
  is_grabfood: false,
  is_shopeefood: false,

  price_gofood: "",
  price_grabfood: "",
  price_shopeefood: "",
};

export default function MenuMaster() {
  const { showToast } = useToast();

  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuMerged, setMenuMerged] = useState([]);

  // FILTER (WAJIB ADA)
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // MODAL STATE
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [draftForm, setDraftForm] = useState(emptyForm);

  /* ======================
     LOAD DATA
  ====================== */
  useEffect(() => {
    fetch("/api/menu").then((r) => r.json()).then(setMenu);
    fetch("/api/category").then((r) => r.json()).then(setCategories);
  }, []);

  useEffect(() => {
    const list = menu.map((item) => {
      const cat = categories.find((c) => c.id === item.category_id);
      return { ...item, category_name: cat?.name ?? "Unknown" };
    });
    setMenuMerged(list);
  }, [menu, categories]);

  /* ======================
     SAVE MENU
  ====================== */
  async function saveMenu(isEdit, data) {
    const {
      category_name,
      ...clean
    } = data;

    const payload = {
      ...clean,
      is_online: clean.is_gofood || clean.is_grabfood || clean.is_shopeefood,
      price: Number(clean.price),
      price_gofood: clean.is_gofood ? Number(clean.price_gofood || 0) : null,
      price_grabfood: clean.is_grabfood ? Number(clean.price_grabfood || 0) : null,
      price_shopeefood: clean.is_shopeefood
        ? Number(clean.price_shopeefood || 0)
        : null,
    };

    const res = await fetch(
      isEdit ? "/api/menu/update" : "/api/menu/add",
      {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      showToast("Gagal menyimpan menu", "error");
      return;
    }

    showToast(isEdit ? "Menu diupdate" : "Menu ditambahkan", "success");
    setShowAdd(false);
    setShowEdit(false);
    setDraftForm(emptyForm);
    setMenu(await fetch("/api/menu").then((r) => r.json()));
  }

  /* ======================
     MODAL FORM (BALIK)
  ====================== */
  const ModalForm = ({ isEdit, initialData }) => {
    const [localForm, setLocalForm] = useState(initialData);

    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl w-full max-w-md p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">
              {isEdit ? "Edit Menu" : "Tambah Menu"}
            </h2>
            <button onClick={() => (setShowAdd(false), setShowEdit(false))}>
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3">
            <input
              className="border p-2 rounded w-full"
              placeholder="Nama menu"
              value={localForm.name}
              onChange={(e) =>
                setLocalForm({ ...localForm, name: e.target.value })
              }
            />

            <select
              className="border p-2 rounded w-full"
              value={localForm.category_id}
              onChange={(e) =>
                setLocalForm({ ...localForm, category_id: e.target.value })
              }
            >
              <option value="">Pilih kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <input
              className="border p-2 rounded w-full"
              placeholder="Harga Offline"
              value={localForm.price}
              onChange={(e) =>
                setLocalForm({
                  ...localForm,
                  price: e.target.value.replace(/\D/g, ""),
                })
              }
            />

            {[
              ["GoFood", "is_gofood", "price_gofood"],
              ["GrabFood", "is_grabfood", "price_grabfood"],
              ["ShopeeFood", "is_shopeefood", "price_shopeefood"],
            ].map(([label, flag, priceKey]) => (
              <div key={label}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={localForm[flag]}
                    onChange={(e) =>
                      setLocalForm({
                        ...localForm,
                        [flag]: e.target.checked,
                      })
                    }
                  />
                  {label}
                </label>

                {localForm[flag] && (
                  <input
                    className="border p-2 rounded w-full mt-1"
                    placeholder={`Harga ${label}`}
                    value={localForm[priceKey]}
                    onChange={(e) =>
                      setLocalForm({
                        ...localForm,
                        [priceKey]: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button
              className="px-4 py-1 border rounded"
              onClick={() => (setShowAdd(false), setShowEdit(false))}
            >
              Batal
            </button>
            <button
              className="px-4 py-1 bg-black text-white rounded"
              onClick={() => saveMenu(isEdit, localForm)}
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ======================
     FILTER LOGIC
  ====================== */
  const filtered = menuMerged.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      categoryFilter === "all" || m.category_id === categoryFilter;
    return matchSearch && matchCat;
  });

  const grouped = categories
    .map((cat) => ({
      ...cat,
      items: filtered.filter((m) => m.category_id === cat.id),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="py-6 pb-24">
      {/* HEADER + FILTER */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Master Menu</h1>

        <div className="flex gap-3">
          <input
            className="border p-2 rounded"
            placeholder="Cari menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border p-2 rounded"
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

      {/* TABLE */}
      {grouped.map((group) => (
        <div key={group.id} className="mb-8">
          <h2 className="font-bold mb-2">{group.name}</h2>

          <div className="border rounded-xl bg-white">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[65%]" />
                <col className="w-[20%]" />
                <col className="w-[15%]" />
              </colgroup>

              <tbody>
                {group.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-gray-50 align-middle"
                  >
                    <td className="p-3 align-middle">
                      <div className="font-semibold text-sm leading-tight line-clamp-3">
                        {item.name}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] mt-2">
                        {item.is_gofood && (
                          <span className="p-1 rounded font-medium bg-[#00AA13]/10 text-[#00AA13]">
                            Gojek
                          </span>
                        )}
                        {item.is_grabfood && (
                          <span className="p-1 rounded font-medium bg-[#00B14F]/10 text-[#00B14F]">
                            Grab
                          </span>
                        )}
                        {item.is_shopeefood && (
                          <span className="p-1 rounded font-medium bg-[#EE4D2D]/10 text-[#EE4D2D]">
                            Shopee
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="text-center font-semibold text-xs whitespace-nowrap">
                      Rp {Number(item.price).toLocaleString()}
                    </td>

                    <td className="p-3 text-right">
                      <button
                        className="text-blue-600 p-1"
                        onClick={() => {
                          setDraftForm({
                            ...item,
                            price: String(item.price),
                          });
                          setShowEdit(true);
                        }}
                      >
                        <Pencil size={18} />
                      </button>
                      <button className="text-red-500 p-1">
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

      {/* FAB ADD */}
      <button
        onClick={() => {
          setDraftForm(emptyForm);
          setShowAdd(true);
        }}
        className="fixed bottom-6 right-6 bg-black text-white p-4 rounded-full"
      >
        <Plus size={22} />
      </button>

      {showAdd && <ModalForm initialData={emptyForm}/>}
      {showEdit && <ModalForm isEdit initialData={draftForm} />}
    </div>
  );
}
