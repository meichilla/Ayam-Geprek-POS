"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function CheckoutPage() {
  const { id: tableId } = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [draft, setDraft] = useState(null);
  const [items, setItems] = useState([]);
  const [paid, setPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [tableInfo, setTableInfo] = useState(null);

  // ============================
  // TOTAL
  // ============================
  const total = items.reduce((s, it) => s + (it.subtotal ?? 0), 0);
  const change = paymentMethod === "cash" && paid ? paid - total : 0;

  const totalS = items
    .filter((it) => it.supplier_code === "S")
    .reduce((s, it) => s + (it.subtotal ?? 0), 0);

  const totalP = items
    .filter((it) => it.supplier_code === "P")
    .reduce((s, it) => s + (it.subtotal ?? 0), 0);

  // ============================
  // LOAD DATA
  // ============================
  useEffect(() => {
    loadDraft();
    loadTableInfo();
  }, []);

  async function loadTableInfo() {
    const tables = await fetch("/api/tables").then((r) => r.json());
    setTableInfo(tables.find((x) => x.id === tableId));
  }

  async function loadDraft() {
    const order = await fetch(
      `/api/orders/draft?table_id=${tableId}`
    ).then((r) => r.json());

    if (!order?.id) return;

    setDraft(order);

    const itemList = await fetch(
      `/api/orders/items?order_id=${order.id}`
    ).then((r) => r.json());

    setItems(itemList || []);
  }

  // ============================
  // SUBMIT CHECKOUT
  // ============================
  async function handleSubmit() {
    if (!draft) {
      showToast("Draft order tidak ditemukan", "error");
      return;
    }

    if (paymentMethod === "cash" && Number(paid) < total) {
      showToast("Uang tidak cukup!", "error");
      return;
    }

    const res = await fetch("/api/orders/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: draft.id,
        amount_paid: paymentMethod === "cash" ? paid : total,
        change_amount: paymentMethod === "cash" ? change : 0,
        total_price: total,
        payment_method: paymentMethod,
      }),
    });

    if (!res.ok) {
      showToast("Gagal checkout", "error");
      return;
    }

    showToast("Pembayaran berhasil!", "success");
    router.push("/tables");
  }

  if (!draft) return <div className="p-4">Memuat pesanan...</div>;

  // ============================
  // UI
  // ============================
  return (
    <div className="p-4 max-w-xl mx-auto pb-24">
      <h1 className="text-xl font-bold mb-4">
        Checkout • {tableInfo ? tableInfo.name : "Meja"}
      </h1>

      {/* ================= ITEMS ================= */}
      <div className="bg-white border rounded-lg shadow p-4 mb-4">
        <h2 className="font-semibold text-lg mb-3">Pesanan</h2>

        {items.map((it) => (
          <div
            key={it.menu_id}
            className="flex justify-between items-start border-b py-2"
          >
            <div>
              <div className="font-medium">{it.menu_name}</div>

              {/* PRICE + SUPPLIER INLINE */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>
                  {it.quantity} × Rp {it.unit_price.toLocaleString()}
                </span>

                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    it.supplier_code === "S"
                      ? "bg-black text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {it.supplier_code}
                </span>
              </div>
            </div>

            <div className="font-semibold">
              Rp {it.subtotal.toLocaleString()}
            </div>
          </div>
        ))}

        {/* SUPPLIER SUMMARY */}
        <div className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Total Supplier S</span>
            <span>Rp {totalS.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Supplier P</span>
            <span>Rp {totalP.toLocaleString()}</span>
          </div>
        </div>

        {/* GRAND TOTAL */}
        <div className="flex justify-between font-bold text-lg mt-4 pt-2 border-t">
          <span>Total</span>
          <span>Rp {total.toLocaleString()}</span>
        </div>
      </div>

      {/* ================= PAYMENT ================= */}
      <div className="bg-white border rounded-lg shadow p-4 mb-4">
        <h2 className="font-semibold mb-3">Pembayaran</h2>

        <label className="text-sm">Metode Pembayaran</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full p-2 border rounded mb-3"
        >
          <option value="cash">Cash</option>
          <option value="qriss">QRIS S</option>
          <option value="qrisp">QRIS P</option>
          <option value="transfer">Transfer Bank</option>
          <option value="gopay">GoPay</option>
          <option value="shopee">ShopeePay</option>
          <option value="ovo">OVO</option>
        </select>

        {/* CASH ONLY */}
        {paymentMethod === "cash" && (
          <>
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
          </>
        )}
      </div>

      {/* ================= BUTTON ================= */}
      <button
        onClick={handleSubmit}
        className="fixed bottom-0 left-0 right-0 bg-black text-white py-4 text-lg font-semibold shadow-lg"
      >
        Selesai & Bayar
      </button>
    </div>
  );
}
