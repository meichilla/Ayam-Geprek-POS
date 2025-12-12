"use client";

import { useState } from "react";
import { setPin } from "@/lib/pin";

export default function SetPin({ onSuccess }) {
  const [pin, setPinValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    if (pin.length < 4) {
      setError("PIN minimal 4 digit");
      return;
    }
    if (pin !== confirm) {
      setError("Konfirmasi PIN tidak sama");
      return;
    }

    setPin(pin);
    onSuccess?.();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]">
      <div className="bg-white rounded-xl p-6 w-80">
        <h2 className="font-bold text-lg mb-4 text-center">
          Set PIN
        </h2>

        <input
          type="password"
          inputMode="numeric"
          placeholder="PIN baru"
          className="w-full border rounded px-3 py-2 mb-2 text-center tracking-widest"
          value={pin}
          onChange={(e) => setPinValue(e.target.value)}
        />

        <input
          type="password"
          inputMode="numeric"
          placeholder="Konfirmasi PIN"
          className="w-full border rounded px-3 py-2 text-center tracking-widest"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        {error && (
          <p className="text-red-500 text-sm mt-2 text-center">
            {error}
          </p>
        )}

        <button
          onClick={handleSave}
          className="mt-4 w-full bg-black text-white py-2 rounded"
        >
          Simpan PIN
        </button>
      </div>
    </div>
  );
}
