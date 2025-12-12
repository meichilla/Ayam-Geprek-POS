"use client";

import { useState } from "react";
import { verifyPin, setPin } from "@/lib/pin";

export default function ResetPin({ onClose }) {
  const [step, setStep] = useState(1);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleVerifyOld = () => {
    if (!verifyPin(oldPin)) {
      setError("PIN lama salah");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSetNew = () => {
    if (newPin.length < 4) {
      setError("PIN minimal 4 digit");
      return;
    }
    if (newPin !== confirmPin) {
      setError("Konfirmasi PIN tidak sama");
      return;
    }

    setPin(newPin);
    setSuccess(true);

    setTimeout(() => {
      onClose?.();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]">
      <div className="bg-white rounded-xl p-6 w-80 text-center">
        <h2 className="font-bold text-lg mb-4">
          Reset PIN Kasir
        </h2>

        {/* STEP 1: VERIFY OLD PIN */}
        {step === 1 && (
          <>
            <input
              type="password"
              inputMode="numeric"
              placeholder="Masukkan PIN lama"
              className="w-full border rounded px-3 py-2 text-center tracking-widest"
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value)}
            />

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            <button
              onClick={handleVerifyOld}
              className="mt-4 w-full bg-black text-white py-2 rounded"
            >
              Lanjut
            </button>
          </>
        )}

        {/* STEP 2: SET NEW PIN */}
        {step === 2 && (
          <>
            <input
              type="password"
              inputMode="numeric"
              placeholder="PIN baru"
              className="w-full border rounded px-3 py-2 text-center tracking-widest mb-2"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
            />

            <input
              type="password"
              inputMode="numeric"
              placeholder="Konfirmasi PIN baru"
              className="w-full border rounded px-3 py-2 text-center tracking-widest"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
            />

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {success && <p className="text-green-600 text-sm mt-2">PIN berhasil diganti</p>}

            <button
              onClick={handleSetNew}
              className="mt-4 w-full bg-black text-white py-2 rounded"
            >
              Simpan PIN
            </button>
          </>
        )}

        <button
          onClick={onClose}
          className="mt-4 text-sm text-gray-500 hover:underline"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
