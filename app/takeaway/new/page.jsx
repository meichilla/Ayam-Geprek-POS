"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast"; // ⬅️ TOAST IMPORT

export default function TakeAwayNewPage() {
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState("");

  const [draft, setDraft] = useState(null);
  const [items, setItems] = useState([]);

  const [customerName, setCustomerName] = useState("");

  const { showToast } = useToast(); // ⬅️ HOOK

  // =======================================================
  // LOAD MENU + CATEGORY
  // =======================================================
  useEffect(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then(setMenu);

    fetch("/api/category")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        if (data.length > 0) setActiveCat(data[0].id);
      });
  }, []);

  // =======================================================
  // CART FUNCTIONS
  // =======================================================
  function addToCart(menuItem) {
    const exist = items.find((i) => i.menu_id === menuItem.id);

    if (exist) {
      updateQty(menuItem.id, exist.quantity + 1);
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        menu_id: menuItem.id,
        menu_name: menuItem.name,
        unit_price: menuItem.price,
        quantity: 1,
        subtotal: menuItem.price,
      },
    ]);
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
    setItems((prev) => prev.filter((it) => it.menu_id !== menuId));
  }

  const total = items.reduce((s, it) => s + (it.subtotal ?? 0), 0);

  // =======================================================
  // SAVE DRAFT → PAKAI TOAST
  // =======================================================
  async function saveDraft() {
    if (items.length === 0) {
      showToast("Tambahkan item terlebih dahulu", "error");
      return;
    }

    const body = {
      order_type: "takeaway",
      source: "takeaway",
      order_id: draft?.id ?? null,
      customer_name: customerName,
      items,
    };

    const res = await fetch("/api/orders/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || !data?.order) {
      showToast("Gagal menyimpan draft", "error");
      return;
    }

    setDraft(data.order);
    showToast("Draft berhasil disimpan!", "success");
  }

  // =======================================================
  // CHECKOUT
  // =======================================================
  function goCheckout() {
    if (!draft?.id) {
      showToast("Simpan draft terlebih dahulu!", "error");
      return;
    }

    window.location.href = `/takeaway/checkout/${draft.id}`;
  }

  // =======================================================
  // GROUP MENU
  // =======================================================
  const grouped = categories.map((cat) => ({
    ...cat,
    items: menu.filter((m) => m.category_id === cat.id),
  }));

  // =======================================================
  // PAGE RENDER
  // =======================================================
  return (
    <div className="p-4 pb-28 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-3">Take Away Baru</h1>

      <div className="text-sm text-gray-600 mb-4">
        {!draft ? "Draft belum disimpan" : `Draft #${draft.id.slice(0, 6)} tersimpan`}
      </div>

      {/* CUSTOMER NAME */}
      <div className="mb-4">
        <label className="block text-sm mb-1 font-semibold">Nama Customer</label>
        <input
          type="text"
          className="border p-2 rounded w-full"
          placeholder="Masukkan nama customer (opsional)"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
      </div>

      {/* CATEGORY TABS */}
      <h2 className="font-semibold text-lg mt-4">Menu</h2>

      <div className="flex gap-2 overflow-x-auto pb-2 mt-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border whitespace-nowrap ${
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
          {items.map((it, idx) => (
            <div
              key={`${it.menu_id}-${idx}`}
              className="bg-white p-3 border rounded-lg shadow flex justify-between"
            >
              <div>
                <div className="font-semibold">{it.menu_name}</div>
                <div className="text-sm text-gray-600">
                  Rp {(it.unit_price ?? 0).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 bg-gray-200 rounded"
                  onClick={() => updateQty(it.menu_id, Math.max(1, it.quantity - 1))}
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

      {/* FOOTER BUTTONS */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex gap-3">
        <button
          onClick={saveDraft}
          className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-semibold"
        >
          Save Draft
        </button>

        <button
          onClick={goCheckout}
          disabled={!draft}
          className={`flex-1 py-3 rounded-lg font-semibold ${
            draft
              ? "bg-black text-white"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
