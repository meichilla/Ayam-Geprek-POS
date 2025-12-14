"use client";

import { useEffect, useState } from "react";

export default function SettlementReportPage() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState("day");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const supplierPending = data?.supplierPending ?? {};

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
    return (
      <div className="p-4 text-sm text-gray-500">
        Memuat laporan settlement…
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  if (!data || !data.summary) {
    return (
      <div className="p-4 text-gray-500">
        Tidak ada data settlement
      </div>
    );
  }

  const { partner, supplier } = data.summary;

  const partnerIncoming = partner.cash_in_hand ?? 0;
  const totalPartnerRevenue = partner.revenue ?? 0;
  const totalSupplierRevenue = supplier.revenue ?? 0;
  const grossSales = totalPartnerRevenue + totalSupplierRevenue;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* HEADER */}
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

      {/* TOTAL PENDAPATAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="text-sm text-gray-600">
            Total Pendapatan Partner (P)
          </div>
          <div className="text-2xl font-bold text-blue-700">
            Rp {totalPartnerRevenue.toLocaleString()}
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-green-50">
          <div className="text-sm text-gray-600">
            Total Pendapatan Supplier (S)
          </div>
          <div className="text-2xl font-bold text-green-700">
            Rp {totalSupplierRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mb-8 text-sm text-gray-500">
        Gross Sales (P + S):{" "}
        <span className="font-semibold">
          Rp {grossSales.toLocaleString()}
        </span>
      </div>

      {/* SUMMARY */}
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
            label="Belum Diterima (Harus Dibayar P)"
            value={supplier.cash_pending}
            red
            highlight
          />
        </div>
      </div>

      {/* DETAIL SUPPLIER */}
      <div className="bg-white border rounded-lg shadow mb-6 overflow-hidden">
        <h2 className="font-semibold p-4 border-b">
          Rincian Utang Partner (P) ke Supplier (S)
        </h2>

        <div className="p-4 text-xs text-gray-600 bg-gray-50 border-b">
          Dana di bawah ini adalah <b>hak Supplier (S)</b> dari penjualan
          non-online atau pembayaran yang tidak langsung masuk ke Supplier,
          sehingga masih tertahan di Partner dan perlu ditransfer.
        </div>

        {Object.keys(supplierPending).length === 0 ? (
          <div className="p-4 text-sm text-gray-500">
            Tidak ada kewajiban pembayaran ke Supplier
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2">Kode Supplier</th>
                <th className="text-right p-2">Nominal yang Harus Dibayar</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(supplierPending)
                .filter(([code, amount]) => code === "S" && (amount ?? 0) > 0)
                .map(([code, amount]) => (
                  <tr key={code} className="border-t">
                    <td className="p-2">{code}</td>
                    <td className="p-2 text-right font-semibold text-red-600">
                      Rp {amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>

            <tfoot className="bg-gray-50 border-t">
              <tr>
                <td className="p-2 font-semibold">
                  Total Utang Partner (P) ke Supplier (S)
                </td>
                <td className="p-2 text-right font-bold text-red-700">
                  Rp {(supplier.cash_pending ?? 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

/* ===============================
   ROW COMPONENT
=============================== */
function Row({ label, value, green, red, highlight }) {
  return (
    <div
      className={`flex justify-between mb-2 px-1 py-1 rounded ${
        highlight ? "bg-red-50" : ""
      }`}
    >
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={`font-bold ${
          green ? "text-green-600" : red ? "text-red-600" : ""
        }`}
      >
        Rp {(value ?? 0).toLocaleString()}
      </span>
    </div>
  );
}
