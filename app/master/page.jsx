"use client";

import Link from "next/link";

export default function MasterPage() {
  return (
    <div className="max-w-md mx-auto p-6">
      {/* HEADER */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Master Data</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola data utama sistem POS
        </p>
      </div>

      {/* MENU LIST */}
      <div className="grid gap-4">
        {/* MENU */}
        <Link
          href="/master/menu"
          className="flex items-center gap-4 p-5 bg-white border rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition"
        >
          <div className="text-2xl">🍽️</div>
          <div>
            <div className="font-semibold text-base">Menu</div>
            <div className="text-sm text-gray-500">
              Kelola daftar menu & harga
            </div>
          </div>
        </Link>

        {/* CATEGORY */}
        <Link
          href="/master/category"
          className="flex items-center gap-4 p-5 bg-white border rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition"
        >
          <div className="text-2xl">🏷️</div>
          <div>
            <div className="font-semibold text-base">Category</div>
            <div className="text-sm text-gray-500">
              Atur kategori menu
            </div>
          </div>
        </Link>

        {/* TABLE */}
        <Link
          href="/master/tables"
          className="flex items-center gap-4 p-5 bg-white border rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition"
        >
          <div className="text-2xl">🪑</div>
          <div>
            <div className="font-semibold text-base">Meja</div>
            <div className="text-sm text-gray-500">
              Konfigurasi meja dine-in
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
