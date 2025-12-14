"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";

export default function TakeAwayEditPage() {
  const { id: orderId } = useParams();

  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState("");

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [customerName, setCustomerName] = useState("");

  const typingTimer = useRef(null);
  const [openSupplierFor, setOpenSupplierFor] = useState(null);

  // =======================================================
  // LOAD MENU + CATEGORY + ORDER
  // =======================================================
  useEffect(() => {
    loadMenu();
    loadCategories();
    loadDraft();
  }, [orderId]);

  async function loadMenu() {
    const data = await fetch("/api/menu").then((r) => r.json());
    setMenu(data);
  }

  async function loadCategories() {
    const data = await fetch("/api/category").then((r) => r.json());
    setCategories(data);
    if (data.length) setActiveCat(data[0].id);
  }

  async function loadDraft() {
    const draftOrder = await fetch(
      `/api/orders/draft?orderId=${orderId}`
    ).then((r) => r.json());

    if (!draftOrder) return;

    setOrder(draftOrder);
    setCustomerName(draftOrder.customer_name || "");

    const itemsData = await fetch(
      `/api/orders/items?order_id=${draftOrder.id}`
    ).then((r) => r.json());

    const normalized = (itemsData || []).map((it) => ({
      menu_id: it.menu_id,
      menu_name: it.menu_name,
      unit_price: it.unit_price,
      quantity: it.quantity,
      subtotal: it.subtotal,
      supplier_code: it.supplier_code ?? "S",
    }));

    setItems(normalized);
  }

  // =======================================================
  // SAVE DRAFT
  // =======================================================
  const saveDraft = useCallback(
    async (newItems, newName = customerName) => {
      await fetch("/api/orders/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_type: "takeaway",
          order_id: orderId,
          customer_name: newName,
          items: newItems,
        }),
      });
    },
    [orderId, customerName]
  );

  // =======================================================
  // CUSTOMER NAME (DEBOUNCE)
  // =======================================================
  function updateCustomerName(name) {
    setCustomerName(name);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      saveDraft(items, name);
    }, 500);
  }

  // =======================================================
  // CART FUNCTIONS
  // =======================================================
  function addToCart(menuItem) {
    const exist = items.find((i) => i.menu_id === menuItem.id);
    if (exist) {
      updateQty(menuItem.id, exist.quantity + 1);
      return;
    }

    const newItems = [
      ...items,
      {
        menu_id: menuItem.id,
        menu_name: menuItem.name,
        unit_price: menuItem.price,
        quantity: 1,
        subtotal: menuItem.price,
        supplier_code: "S",
      },
    ];

    setItems(newItems);
    saveDraft(newItems);
  }

  function updateQty(menuId, qty) {
    const newItems = items.map((it) =>
      it.menu_id === menuId
        ? { ...it, quantity: qty, subtotal: qty * it.unit_price }
        : it
    );
    setItems(newItems);
    saveDraft(newItems);
  }

  function updateSupplier(menuId, code) {
    const newItems = items.map((it) =>
      it.menu_id === menuId ? { ...it, supplier_code: code } : it
    );
    setItems(newItems);
    saveDraft(newItems);
  }

  async function handleCheckout() {
    await saveDraft(items, customerName);

    // baru pindah halaman
    window.location.href = `/takeaway/checkout/${orderId}`;
  }

  function removeItem(menuId) {
    const newItems = items.filter((it) => it.menu_id !== menuId);
    setItems(newItems);
    saveDraft(newItems);
  }

  const total = items.reduce((s, it) => s + (it.subtotal ?? 0), 0);

  // =======================================================
  // GROUP MENU
  // =======================================================
  const grouped = categories.map((c) => ({
    ...c,
    items: menu.filter((m) => m.category_id === c.id),
  }));

  if (!order) return <div className="p-4">Loading...</div>;

  // =======================================================
  // RENDER
  // =======================================================
  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-3">
        Take Away {customerName || `#${orderId.slice(0, 6)}`}
      </h1>

      {/* CUSTOMER */}
      <div className="mb-4">
        <label className="text-sm font-semibold block mb-1">
          Nama Customer
        </label>
        <input
          value={customerName}
          onChange={(e) => updateCustomerName(e.target.value)}
          className="border p-2 rounded w-full"
        />
      </div>

      {/* CATEGORY */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((c) => (
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
              className="bg-white p-3 border rounded-lg shadow cursor-pointer hover:shadow-md"
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

              {/* SUPPLIER DROPDOWN (SAMA PERSIS) */}
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

      {/* FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow p-4">
        <div className="flex justify-between font-bold text-lg mb-3">
          <span>Total</span>
          <span>Rp {total.toLocaleString()}</span>
        </div>

        <button
          onClick={handleCheckout}
          className="block w-full bg-black text-white text-center py-3 rounded-lg font-semibold"
        >
          Checkout
        </button>

      </div>
    </div>
  );
}
