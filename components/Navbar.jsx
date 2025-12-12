"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isPinEnabled } from "@/lib/settings";

export default function Navbar({ onLock }) {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

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

  const showBack = !noBackPages.includes(pathname);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    setPinEnabled(isPinEnabled());

    const onStorage = () => {
      setPinEnabled(isPinEnabled());
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);


  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("pin");
    localStorage.removeItem("pin_enabled");
    localStorage.removeItem("auto_lock");


    await supabase.auth.signOut();
    router.replace("/login");
  };

  const handleLock = () => {
    onLock?.();
  };

  const linkClass = (path) =>
    pathname === path ? "font-semibold underline" : "";

  if (!loggedIn) return null;

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
