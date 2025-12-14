"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function TablePOSPage() {
  const { id: tableId } = useParams();
  const { showToast } = useToast();

  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState("");

  const [draft, setDraft] = useState(null);
  const [items, setItems] = useState([]);
  const [tableInfo, setTableInfo] = useState(null);

  const [isSaving, setIsSaving] = useState(false);

  // 🔑 supplier dropdown
  const [openSupplierFor, setOpenSupplierFor] = useState(null);

  // ===============================
  // LOAD DATA
  // ===============================
  useEffect(() => {
    loadTableInfo();
    loadMenu();
    loadCategories();
    loadDraft();
  }, []);

  async function loadTableInfo() {
    const tables = await fetch("/api/tables").then((r) => r.json());
    setTableInfo(tables.find((x) => x.id === tableId));
  }

  async function loadMenu() {
    setMenu(await fetch("/api/menu").then((r) => r.json()));
  }

  async function loadCategories() {
    const data = await fetch("/api/category").then((r) => r.json());
    setCategories(data);
    if (data.length) setActiveCat(data[0].id);
  }

  async function loadDraft() {
    const draftOrder = await fetch(
      `/api/orders/draft?table_id=${tableId}`
    ).then((r) => r.json());

    if (!draftOrder?.id) return;

    setDraft(draftOrder);

    const itemsData = await fetch(
      `/api/orders/items?order_id=${draftOrder.id}`
    ).then((r) => r.json());

    setItems(
      (itemsData || []).map((it) => ({
        menu_id: it.menu_id,
        menu_name: it.menu_name,
        unit_price: it.unit_price,
        quantity: it.quantity,
        subtotal: it.subtotal,
        supplier_code: it.supplier_code ?? "S",
      }))
    );
  }

  // ===============================
  // CART
  // ===============================
  function addToCart(menuItem) {
    const exist = items.find((i) => i.menu_id === menuItem.id);
    if (exist) {
      updateQty(menuItem.id, exist.quantity + 1);
      return;
    }

    setItems([
      ...items,
      {
        menu_id: menuItem.id,
        menu_name: menuItem.name,
        unit_price: menuItem.price,
        quantity: 1,
        subtotal: menuItem.price,
        supplier_code: "S",
      },
    ]);

    showToast(`${menuItem.name} ditambahkan`);
  }

  function updateQty(menuId, qty) {
    setItems((p) =>
      p.map((it) =>
        it.menu_id === menuId
          ? { ...it, quantity: qty, subtotal: qty * it.unit_price }
          : it
      )
    );
  }

  function updateSupplier(menuId, code) {
    setItems((p) =>
      p.map((it) =>
        it.menu_id === menuId ? { ...it, supplier_code: code } : it
      )
    );
  }

  function removeItem(menuId) {
    const removed = items.find((i) => i.menu_id === menuId);
    setItems((p) => p.filter((it) => it.menu_id !== menuId));
    showToast(`${removed?.menu_name} dihapus`, "error");
  }

  const total = items.reduce((s, it) => s + (it.subtotal ?? 0), 0);

  // ===============================
  // SAVE DRAFT
  // ===============================
  async function saveDraft({ redirect = false } = {}) {
    if (!items.length) {
      showToast("Tidak ada item", "error");
      return null;
    }

    setIsSaving(true);

    const res = await fetch("/api/orders/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table_id: tableId,
        order_id: draft?.id ?? null,
        order_type: "dine-in",
        items,
      }),
    });

    const data = await res.json();
    setIsSaving(false);

    if (!data?.order) {
      showToast("Gagal menyimpan draft", "error");
      return null;
    }

    setDraft(data.order);
    showToast("Draft tersimpan");

    if (redirect) {
      window.location.href = `/tables/${tableId}/checkout`;
    }

    return data.order;
  }

  async function goCheckout() {
    if (items.length === 0) {
      showToast("Tambahkan minimal 1 item", "error");
      return;
    }

    await saveDraft({ redirect: true });
  }

  // ===============================
  // GROUP MENU
  // ===============================
  const grouped = categories.map((c) => ({
    ...c,
    items: menu.filter((m) => m.category_id === c.id),
  }));

  // ===============================
  // UI
  // ===============================
  return (
    <div className="p-4 pb-28 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-3">
        {tableInfo ? tableInfo.name : "Memuat meja..."}
      </h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCat(c.id)}
            className={`px-4 rounded-full text-sm font-semibold border ${
              activeCat === c.id
                ? "bg-black text-white"
                : "bg-white text-gray-700"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* MENU */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
        {grouped
          .find((g) => g.id === activeCat)
          ?.items.map((item) => (
            <div
              key={item.id}
              onClick={() => addToCart(item)}
              className="bg-white p-3 border rounded-lg shadow cursor-pointer"
            >
              <div className="font-semibold">{item.name}</div>
              <div className="font-bold mt-1">
                Rp {item.price.toLocaleString()}
              </div>
            </div>
          ))}
      </div>

      {/* CART */}
      <h2 className="font-semibold text-lg mt-6 mb-2">Pesanan</h2>

      <div className="space-y-3">
        {items.map((it) => (
          <div
            key={it.menu_id}
            className="bg-white p-3 border rounded-lg shadow"
            onClick={() => setOpenSupplierFor(null)}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{it.menu_name}</div>
                <div className="text-sm text-gray-600">
                  Rp {it.unit_price.toLocaleString()}
                </div>
              </div>

              {/* SUPPLIER */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenSupplierFor(
                      openSupplierFor === it.menu_id ? null : it.menu_id
                    );
                  }}
                  className="text-xs border rounded px-3 py-1 bg-white flex gap-1"
                >
                  {it.supplier_code} ▾
                </button>

                {openSupplierFor === it.menu_id && (
                  <div
                    className="absolute right-0 mt-1 w-20 bg-white border rounded shadow z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {["S", "P"].map((code) => (
                      <button
                        key={code}
                        onClick={() => {
                          updateSupplier(it.menu_id, code);
                          setOpenSupplierFor(null);
                        }}
                        className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-100 ${
                          it.supplier_code === code
                            ? "font-semibold bg-gray-50"
                            : ""
                        }`}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* QTY */}
            <div className="flex items-center gap-2 mt-2">
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() =>
                  updateQty(it.menu_id, Math.max(1, it.quantity - 1))
                }
              >
                -
              </button>

              <div>{it.quantity}</div>

              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() => updateQty(it.menu_id, it.quantity + 1)}
              >
                +
              </button>

              <button
                className="ml-auto text-red-500"
                onClick={() => removeItem(it.menu_id)}
              >
                Hapus
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex gap-3">
        <button
          onClick={saveDraft}
          disabled={isSaving}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold"
        >
          {isSaving ? "Menyimpan..." : "Save Draft"}
        </button>

        <button
          onClick={goCheckout}
          disabled={isSaving || items.length === 0}
          className={`flex-1 py-3 rounded-lg font-semibold ${
            items.length > 0
              ? "bg-black text-white"
              : "bg-gray-300 text-gray-500"
          }`}
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
