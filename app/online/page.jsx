"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";

export default function OnlineOrdersPage() {
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    fetch("/api/online")
      .then((r) => r.json())
      .then((data) => setOrders(data || []));
  };

  const color = {
    grabfood: "text-green-600",
    shopeefood: "text-orange-500",
    gofood: "text-green-800",
  };

  const label = {
    grabfood: "GrabFood",
    shopeefood: "ShopeeFood",
    gofood: "GoFood",
  };

  const borderColor = (status) =>
    status === "draft"
      ? "border-amber-400"
      : status === "cancel"
      ? "border-red-400"
      : "border-green-400";

  // HANDLE CANCEL
  async function handleCancel() {
    if (!confirmId) return;

    const res = await fetch("/api/online/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: confirmId }),
    });

    const out = await res.json();

    if (out.success) {
      showToast("Draft berhasil dibatalkan", "success");
      loadData();
    } else {
      showToast("Gagal membatalkan draft", "error");
    }

    setShowConfirm(false);
    setConfirmId(null);
  }

  return (
    <div className="p-4 max-w-4xl mx-auto relative pb-24">
      <h1 className="text-xl font-bold mb-4">Rekap Pesanan Online</h1>

      {orders.length === 0 ? (
        <div className="text-gray-500">Belum ada pesanan online.</div>
      ) : (
        <div className="rounded-lg bg-white divide-y shadow-sm">
          {orders.map((o) => (
            <div
              key={o.id}
              className={`p-4 flex justify-between items-start hover:bg-gray-50 border-l-4 cursor-pointer ${borderColor(
                o.status
              )}`}
              onClick={() => (window.location.href = `/online/${o.id}`)}
            >
              <div className="flex-1">
                <div className={`font-semibold uppercase ${color[o.source]}`}>
                  {label[o.source]}
                </div>

                <div className="text-sm text-gray-600">
                  {o.customer_name || "Customer"}
                </div>

                <div className="text-xs text-gray-500">
                  {o.items.length} item ·{" "}
                  {new Date(o.created_at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                <span
                  className={`text-xs mt-1 inline-block font-semibold ${
                    o.status === "draft"
                      ? "text-amber-600"
                      : o.status === "cancel"
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {o.status === "draft"
                    ? "(Draft)"
                    : o.status === "cancel"
                    ? "(Cancel)"
                    : "(Selesai)"}
                </span>
              </div>

              <div className="text-right">
                <div className="font-bold">
                  Rp {o.total_price.toLocaleString()}
                </div>

                {o.status === "draft" && (
                  <button
                    className="text-xs text-red-600 font-semibold mt-1 underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmId(o.id);
                      setShowConfirm(true);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FLOATING BUTTON */}
      <Link
        href="/online/new"
        className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-green-700 transition font-semibold text-sm"
      >
        + Tambah Pesanan
      </Link>

      {/* MODAL CONFIRM */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-red-600 mb-2">
              Batalkan Pesanan?
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Pesanan draft akan dibatalkan secara permanen.
            </p>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border rounded-lg"
                onClick={() => setShowConfirm(false)}
              >
                Tidak
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
                onClick={handleCancel}
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
