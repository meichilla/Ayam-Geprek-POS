"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isPinEnabled } from "@/lib/settings";

export default function Navbar({ onLock }) {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);

  // 🔒 flag untuk mencegah auth event balikan saat logout
  const isLoggingOut = useRef(false);

  const router = useRouter();
  const pathname = usePathname();

  /* ===============================
     BACK BUTTON RULES
  =============================== */
  const noBackPages = [
    "/",
    "/tables",
    "/takeaway",
    "/master",
    "/dashboard",
    "/online",
    "/login",
    "/settings",
  ];

  const showBack = !noBackPages.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  /* ===============================
     CLOSE MOBILE MENU ON ROUTE CHANGE
  =============================== */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* ===============================
     PIN STATE (LOCAL STORAGE)
  =============================== */
  useEffect(() => {
    const syncPin = () => setPinEnabled(isPinEnabled());
    syncPin();

    window.addEventListener("storage", syncPin);
    return () => window.removeEventListener("storage", syncPin);
  }, []);

  /* ===============================
     AUTH STATE (UI ONLY, GUARDED)
  =============================== */
  useEffect(() => {
    // initial check
    supabase.auth.getSession().then(({ data }) => {
      if (!isLoggingOut.current) {
        setLoggedIn(!!data.session);
      }
    });

    // listen auth change
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (isLoggingOut.current) return; // 🔥 block event saat logout
        setLoggedIn(!!session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  /* ===============================
     ACTIONS
  =============================== */
  const handleLogout = async () => {
    // 🔥 kunci state supaya navbar tidak muncul lagi
    isLoggingOut.current = true;
    setLoggedIn(false);

    // clear local security data
    localStorage.clear();

    try {
      // logout lokal saja (hindari session_not_found noise)
      await supabase.auth.signOut({ scope: "local" });
    } catch {}

    // 🔥 HARD REDIRECT (WAJIB)
    window.location.href = "/login";
  };

  const handleLock = () => {
    onLock?.();
  };

  const linkClass = (path) =>
    pathname === path ? "font-semibold underline" : "";

  /* ===============================
     HIDE NAVBAR RULES (FINAL)
  =============================== */

  // 🔥 NAVBAR TIDAK PERNAH BOLEH MUNCUL DI HALAMAN LOGIN
  if (pathname.startsWith("/login")) return null;

  // 🔐 HIDE JIKA BELUM LOGIN
  if (!loggedIn) return null;

  /* ===============================
     RENDER
  =============================== */
  return (
    <nav className="w-full bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* LEFT */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="text-xl font-bold hover:opacity-70"
            >
              ←
            </button>
          )}

          <Link href="/" className="font-bold text-base sm:text-lg">
            Ayam Geprek Pak Gondes
          </Link>
        </div>

        {/* DESKTOP MENU */}
        <div className="hidden sm:flex items-center gap-6 text-sm">
          <Link href="/tables" className={linkClass("/tables")}>Dine In</Link>
          <Link href="/takeaway" className={linkClass("/takeaway")}>Take Away</Link>
          <Link href="/online" className={linkClass("/online")}>Online Orders</Link>
          <Link href="/master" className={linkClass("/master")}>Master</Link>
          <Link href="/dashboard" className={linkClass("/dashboard")}>Dashboard</Link>
          <Link href="/settings" className={linkClass("/settings")}>Settings</Link>

          {pinEnabled && (
            <button
              onClick={handleLock}
              className="text-gray-600 hover:underline"
            >
              Lock
            </button>
          )}

          <button
            onClick={handleLogout}
            className="text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>

        {/* MOBILE TOGGLE */}
        <button
          className="sm:hidden text-2xl"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="sm:hidden bg-white border-t shadow-md">
          <div className="flex flex-col gap-3 p-4 text-sm">
            <Link href="/tables">Dine In</Link>
            <Link href="/takeaway">Take Away</Link>
            <Link href="/online">Online Orders</Link>
            <Link href="/master">Master</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/settings">Settings</Link>

            {pinEnabled && (
              <button
                onClick={handleLock}
                className="text-left text-gray-700 mt-2"
              >
                Lock
              </button>
            )}

            <button
              onClick={handleLogout}
              className="text-left text-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
