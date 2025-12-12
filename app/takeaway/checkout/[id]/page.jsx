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

  const total = items.reduce((s, it) => s + (it.subtotal ?? 0), 0);
  const change = paid ? paid - total : 0;

  // LOAD ORDER + ITEMS
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/orders/detail?id=${orderId}`);
        const data = await res.json();
        setOrder(data.order);
        setItems(data.items || []);
      } catch (err) {
        showToast("Gagal memuat data pesanan", "error");
      }
    }
    load();
  }, [orderId]);

  async function handlePay() {
    if (Number(paid) < total) {
      showToast("Nominal pembayaran kurang!", "error");
      return;
    }

    const body = {
      order_id: orderId,
      amount_paid: paid,
      change_amount: change,
      total_price: total,
      payment_method: paymentMethod,
    };

    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
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

    } catch (err) {
      showToast("Terjadi error saat checkout", "error");
    }
  }

  if (!order) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 max-w-xl mx-auto pb-24">
      <h1 className="text-xl font-bold mb-4">
        Checkout • Take Away #{orderId.slice(0, 6)}
      </h1>

      {/* ITEMS */}
      <div className="bg-white border rounded-lg shadow p-4 mb-4">
        <h2 className="font-semibold text-lg mb-3">Pesanan</h2>

        {items.map((it) => (
          <div key={it.menu_id} className="flex justify-between border-b py-2">
            <div>
              <div className="font-medium">{it.menu_name}</div>
              <div className="text-sm text-gray-500">
                {it.quantity} × Rp {it.unit_price.toLocaleString()}
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
          <span className={change < 0 ? "text-red-500" : "text-green-600"}>
            Rp {change.toLocaleString()}
          </span>
        </div>
      </div>

      {/* BUTTON */}
      <button
        onClick={handlePay}
        className="fixed bottom-0 left-0 right-0 bg-black text-white py-4 text-lg font-semibold shadow-lg"
      >
        Selesai & Bayar
      </button>
    </div>
  );
}
