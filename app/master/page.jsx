"use client";

import Link from "next/link";

export default function MasterPage() {
  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">Master Data</h1>

      <div className="grid gap-4">
        <Link
          href="/master/menu"
          className="p-4 border rounded-lg hover:bg-gray-50"
        >
          🍽️ Menu
        </Link>

        <Link
          href="/master/category"
          className="p-4 border rounded-lg hover:bg-gray-50"
        >
          🏷️ Category
        </Link>

        <Link
          href="/master/tables"
          className="p-4 border rounded-lg hover:bg-gray-50"
        >
          🪑 Meja
        </Link>
      </div>
    </div>
  );
}
