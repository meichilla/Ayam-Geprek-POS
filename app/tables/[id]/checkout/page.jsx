"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/Toast"; // ⬅️ IMPORT TOAST

export default function CheckoutPage() {
  const { id: tableId } = useParams();z
  const { showToast } = useToast(); // ⬅️ TOAST HOOK

  const [draft, setDraft] = useState(null);
  const [items, setItems] = useState([]);
  const [paid, setPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [tableInfo, setTableInfo] = useState(null);

  const total = (items ?? []).reduce((s, it) => s + it.subtotal, 0);
  const change = paid ? paid - total : 0;

  // ============================
  // LOAD DRAFT ORDER + ITEMS
  // ============================
  useEffect(() => {
    loadDraft();
    loadTableInfo();
  }, []);

  async function loadTableInfo() {
    const tables = await fetch("/api/tables").then((r) => r.json());
    const t = tables.find((x) => x.id === tableId);
    setTableInfo(t);
  }

  async function loadDraft() {
    const order = await fetch(`/api/orders/draft?table_id=${tableId}`).then((r) =>
      r.json()
    );

    if (order) {
      setDraft(order);

      const itemList = await fetch(
        `/api/orders/items?order_id=${order.id}`
      ).then((r) => r.json());

      setItems(itemList || []);
    }
  }

  // ============================
  // SUBMIT CHECKOUT
  // ============================
  async function handleSubmit() {
    if (!draft) {
      showToast("Draft order tidak ditemukan", "error");
      return;
    }

    if (paid < total) {
      showToast("Uang tidak cukup!", "error");
      return;
    }

    const body = {
      order_id: draft.id,
      amount_paid: paid,
      change_amount: change,
      total_price: total,
      payment_method: paymentMethod,
    };

    const res = await fetch("/api/orders/checkout", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      showToast("Gagal checkout", "error");
      return;
    }

    showToast("Pembayaran berhasil!", "success");
    router.push("/tables");
  }

  if (!draft) {
    return <div className="p-4">Memuat pesanan...</div>;
  }

  // =============================
  // UI RENDER
  // =============================
  return (
    <div className="p-4 max-w-xl mx-auto pb-24">
      <h1 className="text-xl font-bold mb-4">
        Checkout • {tableInfo ? tableInfo.name : "Memuat meja..."}
      </h1>

      {/* ORDER ITEMS */}
      <div className="bg-white border rounded-lg shadow p-4 mb-4">
        <h2 className="font-semibold text-lg mb-3">Pesanan</h2>

        {items.map((it) => (
          <div
            key={it.menu_id}
            className="flex justify-between border-b py-2"
          >
            <div>
              <div className="font-medium">{it.menu_name}</div>
              <div className="text-sm text-gray-500">
                {it.quantity} x Rp {it.unit_price.toLocaleString()}
              </div>
            </div>

            <div className="font-semibold">
              Rp {it.subtotal.toLocaleString()}
            </div>
          </div>
        ))}

        <div className="flex justify-between font-bold text-lg mt-4">
          <span>Total</span>
          <span>Rp {total.toLocaleString()}</span>
        </div>
      </div>

      {/* PAYMENT */}
      <div className="bg-white border rounded-lg shadow p-4 mb-4">
        <h2 className="font-semibold mb-3">Pembayaran</h2>

        <label className="text-sm">Metode Pembayaran</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full p-2 border rounded mb-3"
        >
          <option value="cash">Cash</option>
          <option value="qris">QRIS</option>
          <option value="transfer">Transfer Bank</option>
          <option value="gopay">GoPay</option>
          <option value="shopee">ShopeePay</option>
        </select>

        <label className="text-sm">Uang Dibayar</label>
        <input
          type="number"
          className="w-full p-2 border rounded"
          placeholder="Contoh: 50000"
          value={paid}
          onChange={(e) => setPaid(Number(e.target.value))}
        />

        <div className="flex justify-between mt-3 text-lg font-semibold">
          <span>Kembalian</span>
          <span
            className={change < 0 ? "text-red-500" : "text-green-600"}
          >
            Rp {change.toLocaleString()}
          </span>
        </div>
      </div>

      {/* BUTTON */}
      <button
        onClick={handleSubmit}
        className="fixed bottom-0 left-0 right-0 bg-black text-white py-4 text-lg font-semibold shadow-lg"
      >
        Selesai & Bayar
      </button>
    </div>
  );
}
