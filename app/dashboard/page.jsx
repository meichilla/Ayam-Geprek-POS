"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Line, Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function DashboardPage() {
  const [transactions, setTransactions] = useState([]);
  const [detail, setDetail] = useState(null);

  // Filter state
  const [range, setRange] = useState("day");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, [range, startDate, endDate]);

  async function loadData() {
    let url = `/api/dashboard?range=${range}`;
    if (range === "custom" && startDate && endDate) {
      url = `/api/dashboard?range=custom&start=${startDate}&end=${endDate}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    setTransactions(data.transactions || []);
  }

  // ============================================================
  //  FILTERED TRANSACTIONS (MAIN FILTER)
  // ============================================================
  const filteredTransactions = transactions.filter((trx) => {
    if (sourceFilter === "all") return true;

    if (sourceFilter === "dine-in") return trx.source === "dine-in";
    if (sourceFilter === "takeaway") return trx.source === "takeaway";

    if (sourceFilter === "online")
      return ["grabfood", "shopeefood", "gofood"].includes(trx.source);

    return true;
  });

  // ============================================================
  //  SUMMARY BASED ON FILTER
  // ============================================================
  const filteredSummary = {
    total_trx: filteredTransactions.length,
    total_sales: filteredTransactions.reduce(
      (sum, trx) => sum + (trx.total_price ?? 0),
      0
    ),
  };

  // ============================================================
  //  PAYMENT METHOD SUMMARY (FILTERED)
  // ============================================================
  const filteredPaymentSummary = filteredTransactions.reduce((acc, trx) => {
    const key = trx.payment_method || "unknown";
    acc[key] = (acc[key] || 0) + (trx.total_price ?? 0);
    return acc;
  }, {});

  const paymentLabels = Object.keys(filteredPaymentSummary);
  const paymentValues = Object.values(filteredPaymentSummary);

  // ============================================================
  //  TOP ITEMS BASED ON FILTER
  // ============================================================
  const itemsMap = {};

  filteredTransactions.forEach((trx) => {
    trx.items?.forEach((it) => {
      if (!itemsMap[it.menu_name]) {
        itemsMap[it.menu_name] = { name: it.menu_name, qty: 0 };
      }
      itemsMap[it.menu_name].qty += it.quantity;
    });
  });

  const topItems = Object.values(itemsMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  // ============================================================
  //  HOURLY SALES + HOURLY COUNT (FILTERED)
  // ============================================================
  const hourly = {};

  filteredTransactions.forEach((trx) => {
    const h = new Date(trx.created_at).getHours();
    if (!hourly[h]) hourly[h] = { sales: 0, count: 0 };
    hourly[h].sales += trx.total_price ?? 0;
    hourly[h].count += 1;
  });

  const chartSales = [...Array(24).keys()].map((h) => hourly[h]?.sales || 0);
  const chartTrx = [...Array(24).keys()].map((h) => hourly[h]?.count || 0);

  // ============================================================
  //  HELPER: PLATFORM BADGE
  // ============================================================
  function platformIcon(source) {
    if (source === "grabfood") return "GrabFood";
    if (source === "shopeefood") return "ShopeeFood";
    if (source === "gofood") return "GoFood";
    return null;
  }

  function renderBadge(trx) {
    const s = trx.source;

    // ONLINE PLATFORM BADGES
    if (s === "shopeefood") {
      return (
        <div className="inline-flex items-center gap-2 max-w-fit">
          {/* ShopeeFood */}
          <span className="text-[10px] px-2 py-[2px] rounded-md bg-orange-200 text-orange-800 font-semibold">
            ShopeeFood
          </span>

          {/* ONLINE */}
          <span className="text-[10px] px-2 py-[2px] rounded-md bg-green-600 text-white font-semibold">
            ONLINE
          </span>
        </div>
      );
    }

    if (s === "grabfood") {
      return (
        <div className="inline-flex items-center gap-2 max-w-fit">
          {/* GrabFood */}
          <span className="text-[10px] px-2 py-[2px] rounded-md bg-green-200 text-green-800 font-semibold">
            GrabFood
          </span>

          <span className="text-[10px] px-2 py-[2px] rounded-md bg-green-600 text-white font-semibold">
            ONLINE
          </span>
        </div>
      );
    }

    if (s === "gofood") {
      return (
        <div className="inline-flex items-center gap-2 max-w-fit">
          {/* GoFood */}
          <span className="text-[10px] px-2 py-[2px] rounded-md bg-green-700 text-white font-semibold">
            GoFood
          </span>

          <span className="text-[10px] px-2 py-[2px] rounded-md bg-green-600 text-white font-semibold">
            ONLINE
          </span>
        </div>
      );
    }

    // DINE-IN
    if (s === "dine-in") {
      return (
        <span className="inline-block text-[10px] px-2 py-[2px] rounded-md bg-blue-100 text-blue-700 font-semibold max-w-[60px] truncate">
          DINE-IN
        </span>
      );
    }

    // TAKE AWAY
    if (s === "takeaway") {
      return (
        <span className="inline-block text-[10px] px-2 py-[2px] rounded-md bg-pink-100 text-pink-700 font-semibold max-w-[75px] truncate">
          TAKE AWAY
        </span>
      );
    }

    return null;
  }

  // ============================================================
  //  TRANSACTION DETAIL
  // ============================================================
  async function openDetail(id) {
    const res = await fetch(`/api/dashboard/detail?id=${id}`);
    const data = await res.json();
    setDetail(data);
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Dashboard</h1>

      {/* FILTER BAR */}
      <div className="bg-white p-4 border rounded shadow mb-6 flex justify-between items-center">
        {/* LEFT: RANGE */}
        <div className="flex gap-3 items-center flex-wrap">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="day">Harian</option>
            <option value="week">7 Hari</option>
            <option value="month">30 Hari</option>
            <option value="custom">Custom</option>
          </select>

          {range === "custom" && (
            <>
              <input
                type="date"
                className="border p-2 rounded"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span>sampai</span>
              <input
                type="date"
                className="border p-2 rounded"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </>
          )}
        </div>

        {/* RIGHT: SOURCE FILTER */}
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="border p-2 rounded text-sm"
        >
          <option value="all">Semua</option>
          <option value="dine-in">Dine-In</option>
          <option value="takeaway">Take Away</option>
          <option value="online">Online</option>
        </select>
      </div>

      {/* SUMMARY */}
      <div className="bg-white p-4 border rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">Ringkasan Penjualan</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 border rounded bg-gray-50">
            <div className="text-sm">Total Transaksi</div>
            <div className="text-xl font-bold">{filteredSummary.total_trx}</div>
          </div>

          <div className="p-3 border rounded bg-gray-50">
            <div className="text-sm">Total Pendapatan</div>
            <div className="text-xl font-bold text-green-600">
              Rp {filteredSummary.total_sales.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT METHOD PIE */}
      <div className="bg-white p-4 border rounded shadow mb-6">
        <h2 className="font-semibold mb-2">Metode Pembayaran</h2>

        {paymentLabels.length === 0 ? (
          <div className="text-gray-500 text-sm">Tidak ada transaksi</div>
        ) : (
          <Pie
            data={{
              labels: paymentLabels,
              datasets: [
                {
                  data: paymentValues,
                  backgroundColor: [
                    "#4ade80",
                    "#60a5fa",
                    "#facc15",
                    "#fb7185",
                    "#a78bfa",
                    "#f472b6",
                  ],
                },
              ],
            }}
          />
        )}
      </div>

      {/* TOP ITEMS */}
      <div className="bg-white p-4 border rounded shadow mb-6">
        <h2 className="font-semibold mb-2">Top 10 Menu Terlaris</h2>

        <Bar
          data={{
            labels: topItems.map((i) => i.name),
            datasets: [
              {
                label: "Jumlah Terjual",
                data: topItems.map((i) => i.qty),
                backgroundColor: "rgba(250, 204, 21, 0.7)",
              },
            ],
          }}
        />
      </div>

      {/* SALES PER HOUR */}
      <div className="bg-white p-4 border rounded shadow mb-6">
        <h2 className="font-semibold mb-2">Pendapatan per Jam</h2>
        <Line
          data={{
            labels: [...Array(24).keys()].map((h) => `${h}:00`),
            datasets: [
              {
                label: "Pendapatan (Rp)",
                data: chartSales,
                borderColor: "rgb(34,197,94)",
                backgroundColor: "rgba(34,197,94,0.3)",
              },
            ],
          }}
        />
      </div>

      {/* TRX PER HOUR */}
      <div className="bg-white p-4 border rounded shadow mb-8">
        <h2 className="font-semibold mb-2">Jumlah Transaksi per Jam</h2>
        <Bar
          data={{
            labels: [...Array(24).keys()].map((h) => `${h}:00`),
            datasets: [
              {
                label: "Jumlah Transaksi",
                data: chartTrx,
                backgroundColor: "rgba(59,130,246,0.6)",
              },
            ],
          }}
        />
      </div>

      {/* TRANSACTION LIST */}
      <h2 className="text-lg font-semibold mb-3">Transaksi</h2>

      <div className="border rounded overflow-hidden">
        {filteredTransactions.map((trx) => (
          <div
            key={trx.id}
            className="p-4 border-b flex justify-between items-center hover:bg-gray-50 cursor-pointer"
            onClick={() => openDetail(trx.id)}
          >
            <div className="flex flex-col gap-1">
              {renderBadge(trx)}

              {/* ONLINE INFO */}
              {["grabfood", "shopeefood", "gofood"].includes(trx.source) && (
                <div className="text-xs text-gray-500">
                  {trx.customer_name} · #{trx.external_id}
                </div>
              )}

              {/* DINE-IN TABLE */}
              {trx.source === "dine-in" && trx.table_name && (
                <div className="text-xs text-gray-500">
                  Meja: {trx.table_name}
                </div>
              )}

              {/* TIME + PAYMENT */}
              <div className="text-xs text-gray-500">
                {new Date(trx.created_at).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {trx.payment_method?.toUpperCase()}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="font-bold">
                Rp {trx.total_price.toLocaleString()}
              </div>

              <a
                href={`/receipt/${trx.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-blue-600 underline hover:text-blue-800"
              >
                Receipt
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {detail && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow max-w-md w-full">
            <h3 className="text-lg font-bold mb-3">Detail Transaksi</h3>

            <div className="text-sm mb-3">
              <div>Meja: {detail.table_name}</div>
              <div>
                Waktu: {new Date(detail.created_at).toLocaleString("id-ID")}
              </div>
              <div>Metode: {detail.payment_method?.toUpperCase()}</div>

              {["grabfood", "shopeefood", "gofood"].includes(detail.source) && (
                <div className="mt-2 text-green-600 font-semibold">
                  Online: {platformIcon(detail.source)}
                </div>
              )}

              {detail.customer_name && <div>Nama: {detail.customer_name}</div>}
              {detail.external_id && (
                <div>Order ID: {detail.external_id}</div>
              )}
            </div>

            <div className="border rounded divide-y mb-3">
              {detail.items?.map((it) => (
                <div key={it.menu_name} className="flex justify-between p-3">
                  <span>{it.menu_name}</span>
                  <span className="font-bold">{it.quantity}x</span>
                </div>
              ))}
            </div>

            <div className="text-right text-lg font-bold mb-4">
              Total: Rp {detail.total_price?.toLocaleString()}
            </div>

            <button
              className="w-full bg-black text-white py-2 rounded"
              onClick={() => setDetail(null)}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
