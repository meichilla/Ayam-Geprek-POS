"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";

export default function OnlineOrdersPage() {
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  // FILTER STATE
  const [range, setRange] = useState("today"); // today | week | month | custom
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // =======================================================
  // LOAD DATA
  // =======================================================
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    fetch("/api/online")
      .then((r) => r.json())
      .then((data) => setOrders(data || []));
  };

  // =======================================================
  // FILTER LOGIC
  // =======================================================
  const filteredOrders = useMemo(() => {
    const now = new Date();

    return orders.filter((o) => {
      const created = new Date(o.created_at);

      if (range === "today") {
        return created.toDateString() === now.toDateString();
      }

      if (range === "week") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return created >= d;
      }

      if (range === "month") {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return created >= d;
      }

      if (range === "custom" && startDate && endDate) {
        const s = new Date(startDate);
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        return created >= s && created <= e;
      }

      return true;
    });
  }, [orders, range, startDate, endDate]);

  // =======================================================
  // PLATFORM + STATUS STYLE
  // =======================================================
  const platform = {
    grabfood: { label: "GrabFood", color: "text-green-600" },
    shopeefood: { label: "ShopeeFood", color: "text-orange-500" },
    gofood: { label: "GoFood", color: "text-green-800" },
  };

  const statusBadge = (status) => {
    if (status === "draft") return "bg-amber-100 text-amber-700";
    if (status === "cancel") return "bg-red-100 text-red-700";
    return "bg-green-100 text-green-700";
  };

  // =======================================================
  // CANCEL
  // =======================================================
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

  // =======================================================
  // RENDER
  // =======================================================
  return (
    <div className="p-4 pb-28 max-w-4xl mx-auto relative">

      {/* HEADER + FILTER (RESPONSIVE) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold">Pesanan Online</h1>

        {/* FILTER */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm bg-white w-full sm:w-auto"
          >
            <option value="today">Hari Ini</option>
            <option value="week">7 Hari</option>
            <option value="month">30 Hari</option>
            <option value="custom">Custom</option>
          </select>

          {range === "custom" && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="date"
                className="border rounded px-3 py-1.5 text-sm w-full sm:w-auto"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />

              <span className="hidden sm:inline text-sm text-gray-500">–</span>

              <input
                type="date"
                className="border rounded px-3 py-1.5 text-sm w-full sm:w-auto"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* LIST */}
      {filteredOrders.length === 0 ? (
        <div className="text-gray-500">Tidak ada pesanan.</div>
      ) : (
        <div className="rounded-lg bg-white divide-y shadow-sm">
          {filteredOrders.map((o) => (
            <div
              key={o.id}
              onClick={() => { o.status === "draft" ? (window.location.href = `/online/${o.id}`) : (window.location.href = `/receipt/${o.id}`)}}
              className="p-4 flex justify-between gap-4 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex-1">
                <div
                  className={`font-semibold uppercase ${
                    platform[o.source]?.color
                  }`}
                >
                  {platform[o.source]?.label}
                </div>

                <div className="text-sm text-gray-600">
                  {o.customer_name || "Customer"}
                </div>

                <div className="text-xs text-gray-500">
                  {o.items.length} item ·{" "}
                  {new Date(o.created_at).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                <span
                  className={`inline-block mt-1 px-2 py-[2px] rounded text-xs font-semibold ${statusBadge(
                    o.status
                  )}`}
                >
                  {o.status.toUpperCase()}
                </span>
              </div>

              <div className="text-right">
                <div className="font-bold">
                  Rp {o.total_price.toLocaleString()}
                </div>

                {o.status === "draft" && (
                  <button
                    className="text-xs text-red-600 font-semibold underline mt-1"
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
        className="fixed bottom-6 right-6 bg-black text-white px-5 py-3 rounded-full shadow-lg hover:bg-gray-800 transition font-semibold text-sm"
      >
        + Tambah Pesanan
      </Link>

      {/* CONFIRM MODAL */}
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
