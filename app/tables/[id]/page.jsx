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
    const t = tables.find((x) => x.id === tableId);
    setTableInfo(t);
  }

  async function loadMenu() {
    setMenu(await fetch("/api/menu").then((r) => r.json()));
  }

  async function loadCategories() {
    const data = await fetch("/api/category").then((r) => r.json());
    setCategories(data);
    if (data.length > 0) setActiveCat(data[0].id);
  }

  async function loadDraft() {
    const draftOrder = await fetch(`/api/orders/draft?table_id=${tableId}`).then((r) =>
      r.json()
    );

    if (!draftOrder?.id) return;

    setDraft(draftOrder);

    const itemsData = await fetch(
      `/api/orders/items?order_id=${draftOrder.id}`
    ).then((r) => r.json());

    const normalized = (itemsData || []).map((it) => ({
      id: it.id ?? null,
      order_id: draftOrder.id,
      menu_id: it.menu_id,
      menu_name: it.menu_name,
      unit_price: it.unit_price,
      quantity: it.quantity,
      subtotal: it.subtotal,
    }));

    setItems(normalized);
  }

  // ===============================
  // CART (LOCAL ONLY)
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
        id: null,
        order_id: draft?.id ?? null,
        menu_id: menuItem.id,
        menu_name: menuItem.name,
        unit_price: menuItem.price,
        quantity: 1,
        subtotal: menuItem.price,
      },
    ]);

    showToast(`${menuItem.name} ditambahkan`);
  }

  function updateQty(menuId, qty) {
    setItems((prev) =>
      prev.map((it) =>
        it.menu_id === menuId
          ? { ...it, quantity: qty, subtotal: qty * it.unit_price }
          : it
      )
    );
  }

  function removeItem(menuId) {
    const removed = items.find((i) => i.menu_id === menuId);
    setItems((prev) => prev.filter((it) => it.menu_id !== menuId));
    showToast(`${removed?.menu_name} dihapus`, "error");
  }

  const total = items.reduce((s, it) => s + (it.subtotal ?? 0), 0);

  // ===============================
  // SAVE DRAFT — MANUAL ONLY
  // ===============================
  async function saveDraft() {
    if (items.length === 0) {
      showToast("Tidak ada item.", "error");
      return;
    }

    setIsSaving(true);

    const body = {
      table_id: tableId,
      order_id: draft?.id ?? null,
      items,
    };

    const res = await fetch("/api/orders/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setIsSaving(false);

    if (data?.order) {
      setDraft(data.order);
      showToast("Draft berhasil disimpan");
    } else {
      showToast("Gagal menyimpan draft", "error");
    }
  }

  function goCheckout() {
    if (!draft?.id) {
      showToast("Simpan draft terlebih dahulu", "error");
      return;
    }
    window.location.href = `/tables/${tableId}/checkout`;
  }

  // ===============================
  // GROUP MENU BY CATEGORY
  // ===============================
  const grouped = categories.map((cat) => ({
    ...cat,
    items: menu.filter((m) => m.category_id === cat.id),
  }));

  // ===============================
  // UI
  // ===============================
  return (
    <div className="p-4 pb-28 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-3">
        {tableInfo ? tableInfo.name : "Memuat meja..."}
      </h1>

      <div className="text-sm text-gray-600 mb-4">
        {draft ? "Melanjutkan draft pesanan" : "Pesanan baru"}
      </div>

      {/* CATEGORY TABS */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={`px-2 rounded-full text-sm font-semibold border ${
              activeCat === cat.id
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* MENU GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
        {grouped
          .find((g) => g.id === activeCat)
          ?.items.map((item) => (
            <div
              key={item.id}
              onClick={() => addToCart(item)}
              className="bg-white p-3 border rounded-lg shadow cursor-pointer hover:shadow-md transition"
            >
              <div className="font-semibold">{item.name}</div>
              <div className="text-sm text-gray-500">{item.category_name}</div>
              <div className="font-bold mt-1">
                Rp {item.price.toLocaleString()}
              </div>
            </div>
          ))}
      </div>

      {/* CART */}
      <h2 className="font-semibold text-lg mt-6 mb-2">Pesanan</h2>

      {items.length === 0 ? (
        <div className="text-gray-500">Belum ada item</div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div
              key={it.menu_id}
              className="bg-white p-3 border rounded-lg shadow flex justify-between"
            >
              <div>
                <div className="font-semibold">{it.menu_name}</div>
                <div className="text-sm text-gray-600">
                  Rp {it.unit_price.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
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
                  className="ml-3 text-red-500"
                  onClick={() => removeItem(it.menu_id)}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex gap-3">
        <button
          onClick={saveDraft}
          disabled={isSaving || items.length === 0}
          className={`flex-1 py-3 rounded-lg font-semibold ${
            items.length === 0
              ? "bg-blue-300 text-white"
              : "bg-blue-600 text-white"
          }`}
        >
          {isSaving ? "Menyimpan..." : "Save Draft"}
        </button>

        <button
          onClick={goCheckout}
          disabled={!draft}
          className={`flex-1 py-3 rounded-lg font-semibold ${
            draft ? "bg-black text-white" : "bg-gray-300 text-gray-500"
          }`}
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
