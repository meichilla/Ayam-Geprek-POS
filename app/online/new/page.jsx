"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

/* ===============================
   HELPER PLATFORM CONFIG
=============================== */
function getPlatformConfig(source) {
  switch (source) {
    case "grabfood":
      return { flag: "is_grabfood", priceKey: "price_grabfood" };
    case "shopeefood":
      return { flag: "is_shopeefood", priceKey: "price_shopeefood" };
    case "gofood":
      return { flag: "is_gofood", priceKey: "price_gofood" };
    default:
      return {};
  }
}

export default function OnlineNewOrderPage() {
  const { showToast } = useToast();

  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState("");

  const [draft, setDraft] = useState(null);
  const [items, setItems] = useState([]);

  const [source, setSource] = useState("grabfood");
  const [customerName, setCustomerName] = useState("");
  const [externalId, setExternalId] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  /* ===============================
     LOAD MENU + CATEGORY
  =============================== */
  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((data) => {
        setMenu(data);
      });

    fetch("/api/category")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d);
        if (d.length) setActiveCat(d[0].id);
      });
  }, []);

  /* ===============================
     CART
  =============================== */
  function addToCart(menuItem) {
    const { priceKey } = getPlatformConfig(source);
    const price = Number(menuItem[priceKey]);

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
        unit_price: price,
        quantity: 1,
        subtotal: price,
        supplier_code: 'S',
      },
    ]);
  }

  function updateQty(menuId, qty) {
    setItems((prev) =>
      prev.map((it) =>
        it.menu_id === menuId
          ? {
              ...it,
              quantity: qty,
              subtotal: qty * it.unit_price,
            }
          : it
      )
    );
  }

  function removeItem(menuId) {
    setItems((prev) => prev.filter((it) => it.menu_id !== menuId));
  }

  /* ===============================
     TOTAL
  =============================== */
  const total = items.reduce((s, it) => s + it.subtotal, 0);

  /* ===============================
     SAVE DRAFT
  =============================== */
  async function saveDraftToServer() {
    if (!items.length) {
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
    } catch {
      setIsSaving(false);
      showToast("Error menyimpan draft!", "error");
      return null;
    }
  }

  /* ===============================
     CHECKOUT
  =============================== */
  async function handleCheckout() {
    if (!items.length) {
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

  /* ===============================
     GROUP MENU (PLATFORM BASED)
  =============================== */
  const { flag, priceKey } = getPlatformConfig(source);

  const grouped = categories
    .map((c) => ({
      ...c,
      items: menu.filter(
        (m) =>
          m.category_id === c.id &&
          m[flag] === true &&
          Number(m[priceKey]) > 0
      ),
    }))
    .filter((g) => g.items.length > 0);

  /* ===============================
     UI
  =============================== */
  return (
    <div className="p-4 pb-32 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-3">Pesanan Online Baru</h1>

      <div className="text-sm text-gray-600 mb-4">
        {draft
          ? `Draft #${draft.id.slice(0, 6)} tersimpan`
          : "Draft belum dibuat"}
      </div>

      {/* PLATFORM */}
      <div className="mb-4">
        <label className="text-sm font-semibold block mb-1">Platform</label>
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
        <label className="text-sm font-semibold block mb-1">
          External Order ID
        </label>
        <input
          className="border p-2 rounded w-full"
          value={externalId}
          placeholder="GF-123, SF-999"
          onChange={(e) => setExternalId(e.target.value)}
        />
      </div>

      {/* CUSTOMER */}
      <div className="mb-4">
        <label className="text-sm font-semibold block mb-1">
          Nama Customer
        </label>
        <input
          className="border p-2 rounded w-full"
          value={customerName}
          placeholder="Nama Customer (opsional)"
          onChange={(e) => setCustomerName(e.target.value)}
        />
      </div>

      <h2 className="font-semibold text-lg my-2">Menu</h2>

      {/* CATEGORY */}
      {grouped.length === 0 ? (
        <div className="mt-6 text-gray-500 text-sm">
          Tidak ada menu untuk platform ini
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {grouped.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border ${
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
                  className="bg-white p-3 border rounded-lg shadow cursor-pointer hover:shadow-md transition"
                >
                  <div className="font-semibold line-clamp-3">
                    {item.name}
                  </div>
                  <div className="font-bold mt-1">
                    Rp {Number(item[priceKey]).toLocaleString()}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {/* CART */}
      <h2 className="font-semibold text-lg mt-6 mb-2">Pesanan</h2>

      {!items.length ? (
        <div className="text-gray-500">Belum ada item</div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div
              key={it.menu_id}
              className="bg-white p-3 border rounded-lg shadow flex justify-between"
            >
              <div>
                <div className="font-semibold text-sm line-clamp-3">{it.menu_name}</div>
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

      {/* TOTAL */}
      {items.length > 0 && (
        <div className="mt-4 bg-white border rounded-lg shadow p-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>Rp {total.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex gap-3">
        <button
          onClick={saveDraftToServer}
          disabled={items.length === 0 || isSaving}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold"
        >
          {isSaving ? "Menyimpan..." : "Save Draft"}
        </button>

        <button
          onClick={handleCheckout}
          disabled={items.length === 0}
          className="flex-1 py-3 bg-black text-white rounded-lg font-semibold"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
