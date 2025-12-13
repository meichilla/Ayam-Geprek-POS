"use client";

import { useEffect, useState } from "react";

export default function TakeAwayPage() {
  const [orders, setOrders] = useState([]);

  // FILTER STATES
  const [filterType, setFilterType] = useState("today");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const data = await fetch("/api/orders/all?order_type=takeaway").then((r) =>
      r.json()
    );

    const takeaway = data.filter((o) => o.order_type === "takeaway");
    const todayKey = new Date().toISOString().split("T")[0];
    const filteredToday = takeaway.filter((o) =>
      o.created_at.startsWith(todayKey)
    );

    setOrders(takeaway.length ? filteredToday : []);
  }

  async function cancelTakeAway(orderId) {
    if (!confirm("Batalkan pesanan ini?")) return;

    await fetch("/api/orders/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId }),
    });

    loadOrders();
  }

  const borderColor = (status) =>
    status === "draft"
      ? "border-l-4 border-amber-400"
      : status === "cancel"
      ? "border-l-4 border-red-400"
      : "border-l-4 border-green-500";

  // ===========================================================
  // GROUPING
  // ===========================================================
  const grouped = {};

  orders.forEach((o) => {
    const key = o.created_at.split("T")[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(o);
  });

  const sortedDates = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  // ===========================================================
  // FILTER PROCESSING
  // ===========================================================
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .split("T")[0];

  let filteredDates = sortedDates;

  if (filterType === "today") filteredDates = [today];
  if (filterType === "yesterday") filteredDates = [yesterday];

  if (filterType === "range" && rangeStart && rangeEnd) {
    filteredDates = sortedDates.filter(
      (d) => d >= rangeStart && d <= rangeEnd
    );
  }

  return (
    <div className="p-4 pb-24 relative max-w-4xl mx-auto">

      {/* HEADER + FILTER (RESPONSIVE) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-lg font-semibold">Take Away</h1>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm bg-white w-full sm:w-auto"
          >
            <option value="all">Semua</option>
            <option value="today">Hari Ini</option>
            <option value="yesterday">Kemarin</option>
            <option value="range">Range</option>
          </select>

          {filterType === "range" && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="date"
                className="border rounded px-3 py-1.5 text-sm w-full sm:w-auto"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
              />

              <span className="hidden sm:inline text-sm text-gray-500">–</span>

              <input
                type="date"
                className="border rounded px-3 py-1.5 text-sm w-full sm:w-auto"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* LIST PER TANGGAL */}
      {filteredDates.length === 0 ? (
        <div className="text-gray-500 text-sm mt-4">Tidak ada data.</div>
      ) : (
        filteredDates.map((dateKey) => {
          const dateLabel = new Date(dateKey).toLocaleDateString("id-ID", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          });

          return (
            <div key={dateKey} className="mb-5">
              <div className="font-semibold text-gray-700 mb-2">
                {dateLabel}
              </div>

              <div className="space-y-2">
                {grouped[dateKey]?.map((o) => {
                  const timeString = new Date(o.created_at).toLocaleString(
                    "id-ID",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );

                  return (
                    <div
                      key={o.id}
                      onClick={() =>
                        (window.location.href = `/takeaway/${o.id}`)
                      }
                      className={`bg-white border rounded p-3 shadow-sm text-sm flex justify-between items-center cursor-pointer hover:bg-gray-50 transition ${borderColor(
                        o.status
                      )}`}
                    >
                      <div className="flex flex-col">
                        <div className="font-medium">
                          Take Away{" "}
                          <span>
                            {o.customer_name
                              ? o.customer_name
                              : `#${o.id.slice(0, 6)}`}
                          </span>
                        </div>

                        <div className="text-xs text-gray-500 mt-1">
                          {timeString}
                        </div>

                        <div className="font-semibold text-black mt-1">
                          Rp {o.total_price.toLocaleString()}
                        </div>
                      </div>

                      {o.status !== "paid" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelTakeAway(o.id);
                          }}
                          className="text-red-500 text-xs px-2 py-1 border border-red-400 rounded"
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* FLOATING BUTTON */}
      <a
        href="/takeaway/new"
        className="fixed bottom-6 right-6 bg-black text-white px-5 py-3 rounded-full shadow-lg hover:bg-gray-900 transition font-semibold text-sm"
      >
        + Transaksi Baru
      </a>
    </div>
  );
}
