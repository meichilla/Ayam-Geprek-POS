"use client";

import { useEffect, useState } from "react";

export default function SettlementReportPage() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState("day");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPartnerItems, setShowPartnerItems] = useState(false);
  const [showSupplierItems, setShowSupplierItems] = useState(false);

  const supplierPending = data?.supplierPending ?? {};
  const detailItems = data?.detail_items ?? [];

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, startDate, endDate]);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      let url = `/api/report?mode=settlement&range=${range}`;

      if (range === "custom") {
        if (!startDate || !endDate) {
          setLoading(false);
          return;
        }
        url += `&start=${startDate}&end=${endDate}`;
      }

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load settlement report", err);
      setError("Gagal memuat settlement report");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-4 text-sm text-gray-500">Memuat laporan settlement…</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (!data || !data.summary) {
    return <div className="p-4 text-gray-500">Tidak ada data settlement</div>;
  }

  const { partner, supplier } = data.summary;

  const partnerIncoming = partner.cash_in_hand ?? 0;
  const totalPartnerRevenue = partner.revenue ?? 0;
  const totalSupplierRevenue = supplier.revenue ?? 0;
  const grossSales = totalPartnerRevenue + totalSupplierRevenue;

  const partnerItems = detailItems.filter((i) => i.supplier_code === "P");
  const supplierItems = detailItems.filter((i) => i.supplier_code === "S");

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-1">Settlement Report</h1>
      <p className="text-sm text-gray-500 mb-4">
        Laporan pembagian pendapatan (P) & (S)
      </p>

      {/* BIG HIGHLIGHT */}
      <div className="mb-6 border-2 border-orange-400 rounded-xl p-5 bg-orange-50">
        <div className="text-sm text-orange-700 font-medium">
          Pemasukan Masuk ke Partner (P)
        </div>
        <div className="text-3xl font-extrabold text-orange-800">
          Rp {partnerIncoming.toLocaleString()}
        </div>
        <div className="text-xs text-orange-600 mt-1">
          Termasuk dana Supplier (S) yang belum ditransfer
        </div>
      </div>

      {/* FILTER */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="border p-2 rounded text-sm"
        >
          <option value="day">Hari Ini</option>
          <option value="week">7 Hari Terakhir</option>
          <option value="month">Bulan Ini</option>
          <option value="custom">Custom</option>
        </select>

        {range === "custom" && (
          <>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border p-2 rounded text-sm"
            />
            <span className="text-sm text-gray-500">sampai</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border p-2 rounded text-sm"
            />
          </>
        )}
      </div>

      {/* TOTAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <SummaryBox label="Total Hak Partner (P)" value={totalPartnerRevenue} color="blue" />
        <SummaryBox label="Total Hak Supplier (S)" value={totalSupplierRevenue} color="green" />
      </div>

      <div className="mb-4 text-sm text-gray-500">
        Gross Sales: <b>Rp {grossSales.toLocaleString()}</b>
      </div>

      {/* ===== DETAIL HAK MASING-MASING (INI YANG HILANG) ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="font-semibold mb-3">Partner (P)</h2>
          <Row label="Hak Partner" value={partner.revenue} />
          <Row label="Cash di Tangan" value={partner.cash_in_hand} />
        </div>

        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="font-semibold mb-3">Supplier (S)</h2>
          <Row label="Total Hak Supplier" value={supplier.revenue} />
          <Row label="Sudah Diterima" value={supplier.cash_received} green />
          <Row
            label="Belum Diterima (Utang Partner)"
            value={supplier.cash_pending}
            red
            highlight
          />
        </div>
      </div>

      {/* SUPPLIER PENDING */}
      <SupplierPendingTable supplier={supplier} supplierPending={supplierPending} />

      {/* DETAIL ITEM PARTNER */}
      <div
        className="flex items-center justify-between cursor-pointer select-none mb-2"
        onClick={() => setShowPartnerItems((v) => !v)}
      >
        <h2 className="font-semibold text-sm text-blue-700">
          Detail Item Partner (P)
        </h2>

        <span className="text-xs text-gray-500">
          {showPartnerItems ? "▲" : "▼"}
        </span>
      </div>

      {showPartnerItems && (
        <ItemTable title={null} items={partnerItems} />
      )}

      {/* DETAIL ITEM SUPPLIER */}
      <div
        className="flex items-center justify-between cursor-pointer select-none mb-2 mt-4"
        onClick={() => setShowSupplierItems((v) => !v)}
      >
        <h2 className="font-semibold text-sm text-green-700">
          Detail Item Supplier (S)
        </h2>

        <span className="text-xs text-gray-500">
          {showSupplierItems ? "▲" : "▼"}
        </span>
      </div>

      {showSupplierItems && (
        <ItemTable title={null} items={supplierItems} />
      )}
    </div>
  );
}

/* ===============================
   COMPONENTS
=============================== */
function SummaryBox({ label, value, color }) {
  return (
    <div className={`border rounded-lg p-4 bg-${color}-50`}>
      <div className="text-sm text-gray-600">{label}</div>
      <div className={`text-2xl font-bold text-${color}-700`}>
        Rp {value.toLocaleString()}
      </div>
    </div>
  );
}

function Row({ label, value, green, red, highlight }) {
  const colorClass = green
    ? "text-green-600"
    : red
    ? "text-red-600"
    : "text-gray-600";

  return (
    <div
      className={`flex justify-between mb-2 px-1 py-1 rounded ${
        highlight ? "bg-red-50" : ""
      }`}
    >
      <span className={`text-sm font-medium ${colorClass}`}>
        {label}
      </span>
      <span className={`font-bold ${colorClass}`}>
        Rp {(value ?? 0).toLocaleString()}
      </span>
    </div>
  );
}

function ItemTable({ title, items }) {
  const sourceLabelMap = {
    grabfood: {
      label: "GrabFood",
      cls: "bg-green-100 text-green-700",
    },
    shopeefood: {
      label: "ShopeeFood",
      cls: "bg-orange-100 text-orange-700",
    },
    gofood: {
      label: "GoFood",
      cls: "bg-emerald-100 text-emerald-700",
    },
  };

  const total = items.reduce(
    (sum, it) => sum + (it.subtotal ?? 0),
    0
  );

  return (
    <div className="bg-white border rounded-lg shadow mb-6 overflow-hidden">
      {title && (
        <h2 className="font-semibold p-4 border-b">{title}</h2>
      )}

      {items.length === 0 ? (
        <div className="p-4 text-sm text-gray-500">
          Tidak ada item
        </div>
      ) : (
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[58%]" />
            <col className="w-[15%]" />
            <col className="w-[27%]" />
          </colgroup>

          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">Item</th>
              <th className="text-center p-2">Qty</th>
              <th className="text-right p-2">Subtotal</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it, idx) => {
              const sourceInfo = sourceLabelMap[it.source];

              return (
                <tr key={idx} className="border-t align-top">
                  {/* ITEM NAME + BADGE */}
                  <td className="p-2">
                    <div className="font-semibold leading-tight line-clamp-3">
                      {it.menu_name}
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-[11px]">
                      {sourceInfo ? (
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold ${sourceInfo.cls}`}
                        >
                          {sourceInfo.label}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
                          Offline
                        </span>
                      )}
                    </div>
                  </td>

                  {/* QTY */}
                  <td className="p-2 text-center align-middle">
                    {it.quantity}
                  </td>

                  {/* SUBTOTAL */}
                  <td className="p-2 text-right align-middle font-semibold whitespace-nowrap">
                    Rp {it.subtotal.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* TOTAL */}
          <tfoot className="bg-gray-50 border-t">
            <tr>
              <td className="p-3 font-semibold">
                Total
              </td>
              <td
                colSpan={2}
                className="p-3 text-right font-bold whitespace-nowrap"
              >
                Rp {total.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}

function SupplierPendingTable({ supplier, supplierPending }) {
  return (
    <div className="bg-white border rounded-lg shadow mb-6 overflow-hidden">
      <h2 className="font-semibold p-4 border-b">
        Rincian Utang Partner (P) ke Supplier (S)
      </h2>

      {/* PENJELASAN SINGKAT */}
      <div className="p-3 text-sm text-gray-600 bg-gray-50 border-b">
        Dana Supplier yang <b>masih tertahan di Partner</b> dan belum ditransfer.
      </div>

      {Object.keys(supplierPending).length === 0 ? (
        <div className="p-4 text-sm text-gray-500">
          Tidak ada kewajiban pembayaran ke Supplier.
        </div>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            <tr className="bg-gray-50 border-t">
              <td className="p-3 font-semibold">
                Total Utang Partner ke Supplier
              </td>
              <td className="p-3 text-right font-bold text-red-700">
                Rp {(supplier.cash_pending ?? 0).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {supplier.cash_pending > 0 && (
        <div className="p-3 text-xs text-red-600 bg-red-50 border-t">
          ⚠️ Perlu ditransfer ke Supplier (S).
        </div>
      )}
    </div>
  );
}

