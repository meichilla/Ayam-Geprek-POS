"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="p-6 max-w-4xl mx-auto">

      <h1 className="text-2xl font-bold mb-6 text-center">
        Ayam Geprek Pak Gondes — POS System
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* DINE IN */}
        <Link
          href="/tables"
          className="p-8 bg-white rounded-2xl shadow hover:shadow-lg border text-center transition"
        >
          <div className="text-3xl">🍽️</div>
          <div className="text-xl font-bold mt-2">Dine In</div>
          <div className="text-gray-500 text-sm mt-1">
            Pilih meja & mulai pesanan
          </div>
        </Link>

        {/* TAKE AWAY */}
        <Link
          href="/takeaway"
          className="p-8 bg-white rounded-2xl shadow hover:shadow-lg border text-center transition"
        >
          <div className="text-3xl">🥡</div>
          <div className="text-xl font-bold mt-2">Take Away</div>
          <div className="text-gray-500 text-sm mt-1">
            Pesanan tanpa meja
          </div>
        </Link>

        {/* MASTER MENU */}
        <Link
          href="/master"
          className="p-8 bg-white rounded-2xl shadow hover:shadow-lg border text-center transition"
        >
          <div className="text-3xl">📋</div>
          <div className="text-xl font-bold mt-2">Master</div>
          <div className="text-gray-500 text-sm mt-1">
            Kelola Data
          </div>
        </Link>

        {/* DASHBOARD */}
        <Link
          href="/dashboard"
          className="p-8 bg-white rounded-2xl shadow hover:shadow-lg border text-center transition"
        >
          <div className="text-3xl">📊</div>
          <div className="text-xl font-bold mt-2">Dashboard</div>
          <div className="text-gray-500 text-sm mt-1">
            Laporan & ringkasan transaksi
          </div>
        </Link>

      </div>
    </div>
  );
}
