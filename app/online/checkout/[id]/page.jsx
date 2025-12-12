"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useToast } from "@/components/Toast"; // ⬅️ IMPORT TOAST

export default function OnlineCheckoutPage() {
  const { id } = useParams();
  const { showToast } = useToast(); // ⬅️ HOOK
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load order detail
  useEffect(() => {
    if (!id) return;

    async function loadOrder() {
      try {
        const res = await fetch(`/api/online/${id}`);
        if (!res.ok) {
          showToast("Gagal memuat pesanan", "error");
          return setData(null);
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Fetch error:", err);
        showToast("Terjadi error mengambil data", "error");
        setData(null);
      }
    }

    loadOrder();
  }, [id, showToast]);

  async function handleComplete() {
    if (!id) {
      showToast("Order ID tidak valid", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/online/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: id }),
      });

      const out = await res.json();
      setLoading(false);

      if (out.success) {
        showToast("Pesanan berhasil diselesaikan!", "success");

        setTimeout(() => {
          window.location.href = "/online";
        }, 1200);

      } else {
        showToast("Gagal menyelesaikan pesanan", "error");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      showToast("Terjadi error saat menyelesaikan", "error");
    }
  }

  if (!data) return <div className="p-4">Memuat...</div>;

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded shadow">
      <h1 className="text-lg font-bold mb-3">
        Checkout Pesanan {data.source?.toUpperCase()}
      </h1>

      {/* BASIC INFO */}
      <div className="mb-3 text-sm text-gray-700">
        <div><span className="font-semibold">External ID:</span> {data.external_id}</div>
        <div><span className="font-semibold">Customer:</span> {data.customer_name}</div>
        <div>
          <span className="font-semibold">Tanggal:</span>{" "}
          {new Date(data.created_at).toLocaleString("id-ID")}
        </div>
      </div>

      {/* ITEMS DETAIL */}
      <h2 className="font-semibold text-md mt-4 mb-2">Detail Pesanan</h2>

      <div className="space-y-2">
        {data.items.map((it) => (
          <div
            key={it.id}
            className="border p-3 rounded bg-gray-50 flex justify-between"
          >
            <div>
              <div className="font-semibold">{it.menu_name}</div>
              <div className="text-xs text-gray-600">
                {it.quantity} × Rp {it.unit_price.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">Tipe: {it.item_type}</div>
            </div>

            <div className="font-bold">
              Rp {(it.quantity * it.unit_price).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* TOTAL */}
      <div className="flex justify-between mt-4 p-3 border-t font-bold text-lg">
        <span>Total</span>
        <span>Rp {data.total_price.toLocaleString()}</span>
      </div>

      {/* BUTTON */}
      <button
        onClick={handleComplete}
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded font-semibold mt-4 disabled:bg-green-300"
      >
        {loading ? "Memproses..." : "Tandai Selesai"}
      </button>
    </div>
  );
}
