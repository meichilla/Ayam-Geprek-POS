"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

export default function TakeAwayNewPage() {
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState("");

  const [draft, setDraft] = useState(null);
  const [items, setItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [openSupplierFor, setOpenSupplierFor] = useState(null);

  const { showToast } = useToast();

  // =======================================================
  // LOAD MENU + CATEGORY
  // =======================================================
  useEffect(() => {
    fetch("/api/menu").then((r) => r.json()).then(setMenu);
    fetch("/api/category")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d);
        if (d.length) setActiveCat(d[0].id);
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

    setItems((p) => [
      ...p,
      {
        menu_id: menuItem.id,
        menu_name: menuItem.name,
        unit_price: menuItem.price,
        quantity: 1,
        subtotal: menuItem.price,
        supplier_code: "S",
      },
    ]);
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
    setItems((p) => p.filter((it) => it.menu_id !== menuId));
  }

  // =======================================================
  // SAVE DRAFT
  // =======================================================
  async function saveDraft({ silent = false } = {}) {
    if (!items.length) {
      if (!silent) showToast("Tambahkan item terlebih dahulu", "error");
      return null;
    }

    const res = await fetch("/api/orders/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_type: "takeaway",
        source: "takeaway",
        order_id: draft?.id ?? null,
        customer_name: customerName,
        items,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data?.order) {
      if (!silent) showToast("Gagal menyimpan draft", "error");
      return null;
    }

    setDraft(data.order);
    if (!silent) showToast("Draft berhasil disimpan!", "success");
    return data.order.id;
  }

  // =======================================================
  // CHECKOUT
  // =======================================================
  async function goCheckout() {
    if (!items.length) {
      showToast("Tambahkan item terlebih dahulu", "error");
      return;
    }

    let orderId = draft?.id;
    if (!orderId) {
      showToast("Menyimpan draft...", "info");
      orderId = await saveDraft({ silent: true });
      if (!orderId) return;
    }

    window.location.href = `/takeaway/checkout/${orderId}`;
  }

  // =======================================================
  // GROUP MENU
  // =======================================================
  const grouped = categories.map((c) => ({
    ...c,
    items: menu.filter((m) => m.category_id === c.id),
  }));

  // =======================================================
  // RENDER
  // =======================================================
  return (
    <div className="p-4 pb-28 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-3">Take Away Baru</h1>

      <div className="text-sm text-gray-600 mb-4">
        {!draft ? "Draft belum disimpan" : `Draft #${draft.id.slice(0, 6)}`}
      </div>

      {/* CUSTOMER */}
      <div className="mb-4">
        <label className="text-sm font-semibold block mb-1">
          Nama Customer
        </label>
        <input
          className="border p-2 rounded w-full"
          placeholder="Masukkan nama customer (opsional)"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
      </div>

      {/* CATEGORY */}
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
              className="bg-white p-3 border rounded-lg shadow cursor-pointer hover:shadow-md"
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

      {!items.length ? (
        <div className="text-gray-500">Belum ada item</div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div
              key={it.menu_id}
              className="bg-white p-3 border rounded-lg shadow"
              onClick={() => setOpenSupplierFor(null)} // close if click card
            >
              {/* HEADER */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{it.menu_name}</div>
                  <div className="text-sm text-gray-600">
                    Rp {it.unit_price.toLocaleString()}
                  </div>
                </div>

                {/* SUPPLIER DROPDOWN */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenSupplierFor(
                        openSupplierFor === it.menu_id
                          ? null
                          : it.menu_id
                      );
                    }}
                    className="text-xs border rounded px-3 py-1 bg-white flex items-center gap-1"
                  >
                    {it.supplier_code}
                    <span className="text-gray-500">▾</span>
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
      )}

      {/* FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow p-4 flex gap-3">
        <button
          onClick={() => saveDraft()}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold"
        >
          Save Draft
        </button>
        <button
          onClick={goCheckout}
          className="flex-1 py-3 bg-black text-white rounded-lg font-semibold"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
