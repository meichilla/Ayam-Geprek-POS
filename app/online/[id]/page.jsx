"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function OnlineOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const res = await fetch(`/api/online/${id}`);
        if (!res.ok) return setOrder(null);

        const json = await res.json();
        setOrder(json);
      } catch (e) {
        console.error(e);
        setOrder(null);
      }
    }

    load();
  }, [id]);

  if (!order) return <div className="p-4">Memuat...</div>;

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded shadow">
      <h1 className="text-lg font-bold mb-4">
        Detail Pesanan {order.source?.toUpperCase()}
      </h1>

      <div className="text-sm text-gray-700 mb-4">
        <div>External ID: {order.external_id || "-"}</div>
        <div>Customer: {order.customer_name}</div>
        <div>Total: Rp {order.total_price.toLocaleString()}</div>
      </div>

      <h2 className="font-semibold mb-2">Item</h2>
      <div className="space-y-2">
        {(order.items || []).map((it) => (
          <div
            key={it.id}
            className="flex justify-between border-b pb-2 text-sm"
          >
            <div>
              <div className="font-semibold">{it.menu_name}</div>
              <div className="text-gray-500">
                {it.quantity} × Rp {it.unit_price.toLocaleString()}
              </div>
            </div>

            <div className="font-semibold">
              Rp {(it.unit_price * it.quantity).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <a
        href={`/online/checkout/${order.id}`}
        className="block mt-6 bg-green-600 text-white py-3 rounded font-semibold text-center"
      >
        Checkout
      </a>
    </div>
  );
}
