"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function TakeawayCheckoutPage() {
  const { id: orderId } = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [paid, setPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // ================= TOTAL =================
  const total = items.reduce((s, it) => s + (it.subtotal ?? 0), 0);

  const change =
    paymentMethod === "cash" && paid
      ? paid - total
      : 0;

  // ================= PER SUPPLIER =================
  const totalS = items
    .filter((it) => it.supplier_code === "S")
    .reduce((s, it) => s + (it.subtotal ?? 0), 0);

  const totalP = items
    .filter((it) => it.supplier_code === "P")
    .reduce((s, it) => s + (it.subtotal ?? 0), 0);

  // ================= LOAD ORDER =================
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/orders/detail?id=${orderId}`);
        const data = await res.json();
        setOrder(data.order);
        setItems(data.items || []);
      } catch {
        showToast("Gagal memuat data pesanan", "error");
      }
    }
    load();
  }, [orderId, showToast]);

  // ================= AUTO PAID =================
  useEffect(() => {
    if (paymentMethod !== "cash") {
      setPaid(total);
    } else {
      setPaid("");
    }
  }, [paymentMethod, total]);

  // ================= PAY =================
  async function handlePay() {
    if (paymentMethod === "cash" && Number(paid) < total) {
      showToast("Nominal pembayaran kurang!", "error");
      return;
    }

    const body = {
      order_id: orderId,
      amount_paid: paymentMethod === "cash" ? paid : total,
      change_amount: paymentMethod === "cash" ? change : 0,
      total_price: total,
      payment_method: paymentMethod,
    };

    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        showToast("Checkout gagal", "error");
        return;
      }

      showToast("Pembayaran berhasil!", "success");
      setTimeout(() => {
        router.push(`/receipt/${orderId}`);
      }, 600);
    } catch {
      showToast("Terjadi error saat checkout", "error");
    }
  }

  if (!order) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 max-w-xl mx-auto pb-24">
      <h1 className="text-xl font-bold mb-4">
        Checkout • Take Away <br />
        {order.customer_name ?? `#${orderId.slice(0, 6)}`}
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

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>
                  {it.quantity} × Rp {it.unit_price.toLocaleString()}
                </span>

                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${
                    it.supplier_code === "S"
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-400"
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
              <span className={change < 0 ? "text-red-500" : "text-green-600"}>
                Rp {change.toLocaleString()}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ================= BUTTON ================= */}
      <button
        onClick={handlePay}
        className="fixed bottom-0 left-0 right-0 bg-black text-white py-4 text-lg font-semibold shadow-lg"
      >
        Selesai & Bayar
      </button>
    </div>
  );
}
