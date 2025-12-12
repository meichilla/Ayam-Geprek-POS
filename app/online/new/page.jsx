"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast"; // ⬅️ IMPORT

export default function OnlineNewOrderPage() {
  const { showToast } = useToast(); // ⬅️ HOOK TOAST

  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);

  const [activeCat, setActiveCat] = useState("");

  const [draft, setDraft] = useState(null);
  const [items, setItems] = useState([]);

  const [source, setSource] = useState("grabfood");
  const [customerName, setCustomerName] = useState("");
  const [externalId, setExternalId] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  // LOAD MENU + CATEGORY
  useEffect(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => setMenu(data));

    fetch("/api/category")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        if (data.length > 0) setActiveCat(data[0].id);
      });
  }, []);

  // CART FUNCTIONS
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

  const total = items.reduce((a, b) => a + b.subtotal, 0);

  // ==========================
  // SAVE DRAFT
  // ==========================
  async function saveDraftToServer() {
    if (items.length === 0) {
      showToast("Draft kosong!", "error");
      return null;
    }

    setIsSaving(true);

    const body = {
      order_type: "online",
      source,
      payment_method:
        source === "grabfood"
          ? "ovo"
          : source === "shopeefood"
          ? "shopeepay"
          : "gopay",
      customer_name: customerName,
      external_id: externalId,
      order_id: draft?.id ?? null,
      items,
    };

    try {
      const res = await fetch("/api/online/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setIsSaving(false);

      if (!data?.order) {
        showToast("Gagal menyimpan draft!", "error");
        return null;
      }

      setDraft(data.order);
      showToast("Draft tersimpan", "success");
      return data.order;

    } catch (err) {
      console.error(err);
      setIsSaving(false);
      showToast("Error menyimpan draft!", "error");
      return null;
    }
  }

  // ==========================
  // CHECKOUT
  // ==========================
  async function handleCheckout() {
    if (items.length === 0) {
      showToast("Tidak ada item untuk checkout", "error");
      return;
    }

    let finalDraft = draft;

    if (!draft?.id) {
      finalDraft = await saveDraftToServer();
      if (!finalDraft) return;
    }

    window.location.href = `/online/checkout/${finalDraft.id}`;
  }

  // GROUP MENU
  const grouped = categories.map((cat) => ({
    ...cat,
    items: menu.filter((m) => m.category_id === cat.id),
  }));

  // RENDER
  return (
    <div className="p-4 pb-28 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-3">Pesanan Online Baru</h1>

      <div className="text-sm text-gray-600 mb-4">
        {draft ? `Draft #${draft.id.slice(0, 6)} tersimpan` : "Draft belum dibuat"}
      </div>

      {/* PLATFORM */}
      <div className="mb-4">
        <label className="block text-sm mb-1 font-semibold">Platform</label>
        <select
          className="border p-2 rounded w-full"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="grabfood">GrabFood</option>
          <option value="shopeefood">ShopeeFood</option>
          <option value="gofood">GoFood</option>
        </select>
      </div>

      {/* EXTERNAL ID */}
      <div className="mb-4">
        <label className="block text-sm mb-1 font-semibold">External Order ID</label>
        <input
          className="border p-2 rounded w-full"
          placeholder="GF-123, SF-999"
          value={externalId}
          onChange={(e) => setExternalId(e.target.value)}
        />
      </div>

      {/* CUSTOMER */}
      <div className="mb-4">
        <label className="block text-sm mb-1 font-semibold">Nama Customer</label>
        <input
          className="border p-2 rounded w-full"
          placeholder="Nama customer"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
      </div>

      {/* MENU TABS */}
      <h2 className="font-semibold text-lg mt-4">Menu</h2>

      <div className="flex gap-2 overflow-x-auto pb-2 mt-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border ${
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

      {/* FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex gap-3">

        {/* SAVE DRAFT BUTTON */}
        <button
          onClick={saveDraftToServer}
          disabled={items.length === 0 || isSaving}
          className={`flex-1 py-3 rounded-lg font-semibold ${
            items.length === 0
              ? "bg-blue-300 text-white cursor-not-allowed"
              : "bg-blue-600 text-white"
          }`}
        >
          {isSaving ? "Menyimpan..." : "Save Draft"}
        </button>

        {/* CHECKOUT BUTTON */}
        <button
          onClick={handleCheckout}
          disabled={items.length === 0}
          className={`flex-1 py-3 rounded-lg font-semibold ${
            items.length === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white"
          }`}
        >
          Checkout
        </button>

      </div>
    </div>
  );  
}
