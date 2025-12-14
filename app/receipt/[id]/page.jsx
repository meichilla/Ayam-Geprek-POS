"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ReceiptPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/dashboard/detail?id=${id}`)
      .then((r) => r.json())
      .then((d) => setData(d));
  }, [id]);

  if (!data) return <div className="p-4">Memuat struk...</div>;

  return (
    <>
      {/* PRINT-ONLY STYLES */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #receipt-print-area,
          #receipt-print-area * {
            visibility: visible !important;
          }
          #receipt-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 16;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* RECEIPT CONTENT */}
      <div
        id="receipt-print-area"
        className="p-4 max-w-md mx-auto bg-white shadow-lg rounded-md border"
      >
        {/* HEADER */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-extrabold">Ayam Geprek Pak Gondes</h1>
          <p className="text-xs text-gray-500 mt-1">
            Struk Pembayaran • #{id.slice(0, 6)}
          </p>
        </div>

        {/* INFO */}
        <div className="mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Meja</span>
            <span className="font-medium">{data.table_name}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Metode</span>
            <span className="font-medium">{data.payment_method?.toUpperCase()}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Waktu</span>
            <span className="font-medium">
              {new Date(data.created_at).toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <hr className="my-3 border-gray-300" />

        {/* ITEMS */}
        <div className="text-sm">
          {data.items?.map((it) => (
            <div key={it.menu_name} className="flex justify-between gap-3 py-0.5">
              <div className="min-w-0 flex-1">
                <div className="font-medium line-clamp-2 leading-snug">
                  {it.menu_name}
                </div>
                <div className="text-gray-500 text-xs">
                  {it.quantity}x
                </div>
              </div>
              <div className="shrink-0 whitespace-nowrap font-semibold text-right">
                Rp {it.subtotal?.toLocaleString()} • {it.supplier_code}
              </div>
            </div>
          ))}
        </div>

        <hr className="my-3 border-gray-400" />

        {/* TOTAL */}
        <div className="text-right mb-4">
          <span className="text-lg font-bold">
            Total: Rp {data.total_price.toLocaleString()}
          </span>
        </div>

        {/* BUTTONS (HIDE ON PRINT) */}
        <div className="mt-6 flex gap-3 no-print">
          <a
            href="/dashboard"
            className="flex-1 bg-gray-200 py-2 rounded-md text-center font-semibold hover:bg-gray-300 transition"
          >
            Kembali
          </a>

          <button
            className="flex-1 bg-black text-white py-2 rounded-md font-semibold hover:bg-gray-800 transition"
            onClick={() => window.print()}
          >
            Print
          </button>
        </div>
      </div>
    </>
  );
}
