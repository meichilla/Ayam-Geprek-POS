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

        {/* ONLINE ORDER */}
        <Link
          href="/online"
          className="p-8 bg-white rounded-2xl shadow hover:shadow-lg border text-center transition"
        >
          <div className="text-3xl">📱</div>
          <div className="text-xl font-bold mt-2">Online Order</div>
          <div className="text-gray-500 text-sm mt-1">
            GrabFood, ShopeeFood, GoFood
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
            Kelola data & menu
          </div>
        </Link>

        {/* REPORT */}
        <Link
          href="/dashboard"
          className="p-8 bg-white rounded-2xl shadow hover:shadow-lg border text-center transition"
        >
          <div className="text-3xl">📊</div>
          <div className="text-xl font-bold mt-2">Dashboard</div>
          <div className="text-gray-500 text-sm mt-1">
            Ringkasan & performa harian
          </div>
        </Link>

        {/* SETTING */}
        <Link
          href="/settings"
          className="p-8 bg-white rounded-2xl shadow hover:shadow-lg border text-center transition"
        >
          <div className="text-3xl">⚙️</div>
          <div className="text-xl font-bold mt-2">Setting</div>
          <div className="text-gray-500 text-sm mt-1">
            Konfigurasi sistem & keamanan
          </div>
        </Link>

        {/* DASHBOARD */}
        <Link
          href="/report"
          className="p-8 bg-white rounded-2xl shadow hover:shadow-lg border text-center transition sm:col-span-2"
        >
          <div className="text-3xl">🧾</div>
          <div className="text-xl font-bold mt-2">Report</div>
          <div className="text-gray-500 text-sm mt-1">
            Laporan penjualan & transaksi
          </div>
        </Link>
      </div>
    </div>
  );
}
