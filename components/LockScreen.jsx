"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { verifyPin } from "@/lib/pin";

export default function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleUnlock = () => {
    if (!verifyPin(pin)) {
      setError("PIN salah");
      return;
    }
    onUnlock();
  };

  const handleLogout = async () => {
    localStorage.removeItem("pin");
    localStorage.removeItem("pin_enabled");

    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999]">
      <div className="bg-white rounded-xl p-6 w-80 text-center">
        <h2 className="font-bold text-lg mb-4">Aplikasi Terkunci</h2>

        <input
          type="password"
          inputMode="numeric"
          placeholder="Masukkan PIN"
          className="w-full border rounded px-3 py-2 text-center tracking-widest"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />

        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}

        <button
          onClick={handleUnlock}
          className="mt-4 w-full bg-black text-white py-2 rounded"
        >
          Unlock
        </button>

        {/* 👇 INI JAWABAN “LUPA PIN” */}
        <button
          onClick={handleLogout}
          className="mt-3 text-sm text-blue-600 underline"
        >
          Lupa PIN? Logout
        </button>
      </div>
    </div>
  );
}
