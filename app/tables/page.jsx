"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function TablesPage() {
  const { showToast } = useToast();
  const [tables, setTables] = useState([]);
  const [drafts, setDrafts] = useState([]);

  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
      }
    });
  }, [router]);

  useEffect(() => {
    loadData();
  }, []);


  async function loadData() {
    try {
      const t = await fetch("/api/tables").then((r) => r.json());
      const d = await fetch("/api/orders/draft").then((r) => r.json());

      setTables(t.filter((tbl) => tbl.is_active));
      setDrafts(d);
    } catch (err) {
      showToast("Gagal memuat data meja", "error");
    }
  }

  function getDraft(tableId) {
    return drafts.find((o) => o.table_id === tableId);
  }

  async function cancelDraft(orderId) {
    const ok = confirm("Yakin mau membatalkan pesanan di meja ini?");
    if (!ok) return;

    try {
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });

      if (!res.ok) {
        showToast("Gagal membatalkan pesanan", "error");
        return;
      }

      showToast("Pesanan draft dibatalkan", "success");
      await loadData();

    } catch (err) {
      showToast("Terjadi error saat membatalkan", "error");
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Dine In — Daftar Meja</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {tables.map((t) => {
          const draft = getDraft(t.id);

          return (
            <div
              key={t.id}
              className="p-4 pb-5 bg-white border rounded-lg shadow flex flex-col gap-3"
            >
              <div className="font-bold text-lg">Meja {t.table_number}</div>

              {draft ? (
                <>
                  <div className="text-sm text-yellow-600">
                    Ada pesanan draft
                  </div>

                  <div className="text-sm">
                    Total: Rp {draft.total_price?.toLocaleString()}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <a
                      href={`/tables/${t.id}`}
                      className="flex-1 bg-blue-600 text-white text-center p-1 rounded text-sm"
                    >
                      Proses
                    </a>

                    <button
                      onClick={() => cancelDraft(draft.id)}
                      className="flex-1 bg-red-500 text-white p-1 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-gray-500 text-sm">Belum ada pesanan</div>

                  <a
                    href={`/tables/${t.id}`}
                    className="block bg-black text-white text-center py-2 rounded text-sm mt-1"
                  >
                    Pesanan Baru
                  </a>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
