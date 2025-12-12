"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";

export default function TakeAwayEditPage() {
  const { id: orderId } = useParams();

  const [menu, setMenu] = useState([]);
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const typingTimer = useRef(null);

  // LOAD MENU + ORDER + ITEMS
  useEffect(() => {
    loadMenu();
    loadDraft();
  }, [orderId]);

  async function loadMenu() {
    const data = await fetch("/api/menu").then((r) => r.json());
    setMenu(data);
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

    // NORMALISASI
    const normalized = (itemsData || []).map((it) => ({
      id: it.id,
      order_id: it.order_id,
      menu_id: it.menu_id,
      menu_name: it.menu_name,
      unit_price: it.unit_price,
      quantity: it.quantity,
      subtotal: it.subtotal,
    }));

    setItems(normalized);
  }

  // SAVE DRAFT
  const saveDraft = useCallback(
    async (newItems, newName = customerName) => {
      const body = {
        order_type: "takeaway",
        order_id: orderId,
        customer_name: newName,
        items: newItems,
      };

      const res = await fetch("/api/orders/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data?.order) setOrder(data.order);
    },
    [orderId, customerName]
  );

  // UPDATE CUSTOMER NAME
  function updateCustomerName(name) {
    setCustomerName(name);

    // CLEAR TIMER SEBELUMNYA
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }

    // SET TIMEOUT 500ms UNTUK SIMPAN DRAFT
    typingTimer.current = setTimeout(() => {
      saveDraft(items, name);
    }, 500);
  }

  // CART FUNCTIONS
  function addToCart(menuItem) {
    const exist = items.find((i) => i.menu_id === menuItem.id);

    if (exist) {
      updateQty(menuItem.id, exist.quantity + 1);
      return;
    }

    const newItem = {
      menu_id: menuItem.id,
      menu_name: menuItem.name,
      unit_price: menuItem.price,
      quantity: 1,
      subtotal: menuItem.price,
    };

    const newItems = [...items, newItem];
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

  function removeItem(menuId) {
    const newItems = items.filter((it) => it.menu_id !== menuId);
    setItems(newItems);
    saveDraft(newItems);
  }

  const total = items.reduce((s, it) => s + (it.subtotal ?? 0), 0);

  if (!order) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-3">
        Take Away {customerName ? `(${customerName})` : `#${orderId.slice(0, 6)}`}
      </h1>

      {/* CUSTOMER NAME INPUT */}
      <div className="mb-4">
        <label className="text-sm font-medium">Customer Name</label>
        <input
          value={customerName}
          onChange={(e) => updateCustomerName(e.target.value)}
          placeholder="Nama Customer (optional)"
          className="border p-2 rounded w-full mt-1"
        />
      </div>

      {/* MENU */}
      <h2 className="font-semibold text-lg mt-4 mb-2">Menu</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {menu.map((item) => (
          <div
            key={item.id}
            onClick={() => addToCart(item)}
            className="bg-white p-3 border rounded shadow cursor-pointer hover:shadow-md"
          >
            <div className="font-semibold">{item.name}</div>
            <div className="text-sm text-gray-600">
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
              className="bg-white p-3 border rounded shadow flex justify-between"
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="flex justify-between font-bold text-lg mb-3">
          <span>Total</span>
          <span>Rp {total.toLocaleString()}</span>
        </div>

        <a
          href={`/takeaway/checkout/${orderId}`}
          className="block bg-black text-white text-center py-3 rounded-lg font-semibold"
        >
          Checkout
        </a>
      </div>
    </div>
  );
}
