"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function OnlineOrderDetailPage() {
  const { id } = useParams();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);

  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState("");

  const [items, setItems] = useState([]);
  const [customerName, setCustomerName] = useState("");

  const [saving, setSaving] = useState(false);

  /* ===================================================
     LOAD ORDER
  =================================================== */
  useEffect(() => {
    if (!id) return;

    fetch(`/api/online/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data);

        const fixedItems = (data.items || []).map((it) => ({
          ...it,
          unit_price: Number(it.unit_price),
          subtotal: Number(it.unit_price) * it.quantity,
        }));

        setItems(fixedItems);
        setCustomerName(data.customer_name || "");
      });
  }, [id]);

  /* ===================================================
     LOAD MENU + CATEGORY
  =================================================== */
  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((data) => {
        setMenu(data);
      });

    fetch("/api/category")
      .then((r) => r.json())
      .then((cats) => {
        setCategories(cats);
        if (cats.length) setActiveCat(cats[0].id);
      });
  }, []);

  if (!order) return <div className="p-4">Memuat...</div>;

  const { flag, priceKey } = getPlatformConfig(order.source);

  /* ===================================================
     CART LOGIC (PLATFORM PRICE)
  =================================================== */
  function addToCart(menuItem) {
    const price = Number(menuItem[priceKey]);
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

  const total = items.reduce((s, it) => s + it.subtotal, 0);

  /* ===================================================
     SAVE DRAFT
  =================================================== */
  async function saveDraft(silent = false) {
    setSaving(true);

    try {
      const res = await fetch("/api/online/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          order_type: "online",
          source: order.source,
          external_id: order.external_id,
          customer_name: customerName,
          items,
        }),
      });

      const data = await res.json();
      setSaving(false);

      if (!data?.order) {
        showToast("Gagal menyimpan draft", "error");
        return false;
      }

      setOrder(data.order);
      if (!silent) showToast("Draft tersimpan", "success");
      return true;
    } catch {
      setSaving(false);
      showToast("Terjadi kesalahan", "error");
      return false;
    }
  }

  /* ===================================================
     CHECKOUT
  =================================================== */
  async function handleCheckout() {
    if (saving) return;

    const ok = await saveDraft(true);
    if (!ok) return;

    window.location.href = `/online/checkout/${order.id}`;
  }

  /* ===================================================
     GROUP MENU (PLATFORM BASED)
  =================================================== */
  const grouped = categories
    .map((cat) => ({
      ...cat,
      items: menu.filter(
        (m) =>
          m.category_id === cat.id &&
          m[flag] === true &&
          Number(m[priceKey]) > 0
      ),
    }))
    .filter((g) => g.items.length > 0);

  /* ===================================================
     RENDER
  =================================================== */
  return (
    <div className="p-4 pb-28 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-2">
        Edit Pesanan {order.source?.toUpperCase()}
      </h1>

      {/* INFO */}
      <div className="bg-white border rounded p-4 mb-4 space-y-3">
        <div className="text-sm">
          External ID: {order.external_id || "-"}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="w-20">Customer</span>
          <input
            className="border rounded px-2 py-1 text-sm flex-1"
            placeholder="Nama customer"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <div className="font-bold">
          Total: Rp {total.toLocaleString()}
        </div>
      </div>

      {/* MENU */}
      <h2 className="font-semibold text-lg mt-4">Menu</h2>

      {grouped.length === 0 ? (
        <div className="mt-4 text-gray-500 text-sm">
          Tidak ada menu untuk platform ini
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2 mt-2">
            {grouped.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${
                  activeCat === cat.id
                    ? "bg-black text-white"
                    : "bg-white"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3">
            {grouped
              .find((g) => g.id === activeCat)
              ?.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="bg-white p-3 border rounded-lg shadow cursor-pointer hover:shadow-md"
                >
                  <div className="font-semibold line-clamp-2">
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
                onClick={() =>
                  updateQty(it.menu_id, Math.max(1, it.quantity - 1))
                }
                className="px-2 bg-gray-200 rounded"
              >
                -
              </button>
              <div>{it.quantity}</div>
              <button
                onClick={() => updateQty(it.menu_id, it.quantity + 1)}
                className="px-2 bg-gray-200 rounded"
              >
                +
              </button>
              <button
                onClick={() => removeItem(it.menu_id)}
                className="ml-2 text-red-500 text-sm"
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
          onClick={() => saveDraft()}
          disabled={saving}
          className="flex-1 bg-blue-600 text-white py-3 rounded font-semibold"
        >
          {saving ? "Menyimpan..." : "Save as Draft"}
        </button>

        <button
          onClick={handleCheckout}
          disabled={saving}
          className="flex-1 bg-black text-white py-3 rounded font-semibold"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
