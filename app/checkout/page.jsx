"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

export default function CheckoutPage() {
  const { showToast } = useToast();

  const [cart, setCart] = useState([]);
  const [paid, setPaid] = useState("");
  const [change, setChange] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) setCart(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const updateQty = (id, type) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = type === "inc" ? item.qty + 1 : item.qty - 1;
            return { ...item, qty: newQty < 1 ? 1 : newQty };
          }
          return item;
        })
        .filter((i) => i.qty > 0)
    );
  };

  const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  const handlePaidChange = (e) => {
    const value = e.target.value;
    setPaid(value);
    setChange(Number(value) - total);
  };

  const handleCheckout = async () => {
    // VALIDATION CASH
    if (paymentMethod === "cash") {
      if (!paid || Number(paid) < total) {
        showToast("Uang bayar kurang!", "error");
        return;
      }
    }

    setLoading(true);

    const payload = {
      items: cart,
      total: total,
      paid: paymentMethod === "cash" ? Number(paid) : total,
      change: paymentMethod === "cash" ? Number(paid) - total : 0,
      payment_method: paymentMethod,
    };

    const res = await fetch("/api/order", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      showToast("Gagal menyimpan transaksi!", "error");
      return;
    }

    showToast("Transaksi berhasil!", "success");

    localStorage.removeItem("cart");

    setTimeout(() => {
      window.location.href = "/";
    }, 800);
  };

  return (
    <div className="p-4 pb-24">
      <h1 className="font-bold text-xl mb-4">Checkout</h1>

      {/* Cart Items */}
      {cart.length === 0 ? (
        <p>Keranjang kosong</p>
      ) : (
        cart.map((item) => (
          <div
            key={item.id}
            className="border-b py-3 flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">{item.name}</div>
              <div className="text-sm text-gray-600">
                Rp {item.price.toLocaleString()} × {item.qty}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="border px-3 py-1 rounded"
                onClick={() => updateQty(item.id, "dec")}
              >
                -
              </button>
              <button
                className="border px-3 py-1 rounded"
                onClick={() => updateQty(item.id, "inc")}
              >
                +
              </button>
            </div>
          </div>
        ))
      )}

      {/* Total */}
      <div className="mt-6 text-lg font-bold">
        Total: Rp {total.toLocaleString()}
      </div>

      {/* Payment Method */}
      <div className="mt-6">
        <label className="font-semibold">Metode Pembayaran</label>

        <div className="flex flex-col gap-2 mt-2">

          {["cash", "qriss", "qrisp", "shopeepay", "gopay", "transfer"].map((pm) => (
            <label key={pm} className="flex items-center gap-2">
              <input
                type="radio"
                name="payment"
                value={pm}
                checked={paymentMethod === pm}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              {pm === "qriss"
                ? "QRIS S"
                : pm === "qrisp"
                ? "QRIS P"
                : pm === "shopeepay"
                ? "ShopeePay"
                : pm === "gopay"
                ? "GoPay"
                : pm === "ovo"
                ? "OVO"
                : pm === "transfer"
                ? "Transfer Bank"
                : "Cash"}
            </label>
          ))}
        </div>
      </div>

      {/* Cash Only: Input Bayar */}
      {paymentMethod === "cash" && (
        <>
          <div className="mt-4">
            <label className="text-sm text-gray-600">Uang Bayar</label>
            <input
              type="number"
              className="border w-full p-2 rounded mt-1"
              value={paid}
              onChange={handlePaidChange}
              placeholder="Masukkan nominal"
            />
          </div>

          <div className="mt-2 text-lg">
            Kembalian:{" "}
            <span className={change < 0 ? "text-red-500" : "text-green-600"}>
              Rp {change.toLocaleString()}
            </span>
          </div>
        </>
      )}

      {/* Checkout Button */}
      <button
        className="fixed bottom-0 left-0 right-0 bg-black text-white py-4 text-lg disabled:bg-gray-500"
        onClick={handleCheckout}
        disabled={loading}
      >
        {loading ? "Memproses..." : "Bayar Sekarang"}
      </button>
    </div>
  );
}
