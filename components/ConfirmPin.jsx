"use client";

import { useState } from "react";
import { verifyPin } from "@/lib/pin";

export default function ConfirmPin({ onSuccess, onCancel }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!verifyPin(pin)) {
      setError("PIN salah");
      return;
    }
    onSuccess?.();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]">
      <div className="bg-white rounded-xl p-6 w-80 text-center">
        <h2 className="font-bold text-lg mb-4">
          Konfirmasi PIN
        </h2>

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

        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="w-1/2 border rounded py-2"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className="w-1/2 bg-black text-white rounded py-2"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
