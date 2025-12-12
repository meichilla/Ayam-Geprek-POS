"use client";

import { useState, useEffect } from "react";
import ResetPin from "@/components/ResetPin";
import SetPin from "@/components/SetPin";
import ConfirmPin from "@/components/ConfirmPin";
import {
  getIdleMinutes,
  setIdleMinutes,
  isAutoLockEnabled,
  setAutoLockEnabled,
  isPinEnabled,
  setPinEnabled,
  hasPin,
} from "@/lib/settings";

export default function SettingsPage() {
  const [idle, setIdle] = useState(3);
  const [autoLock, setAutoLock] = useState(true);
  const [pinEnabled, setPinEnabledState] = useState(false);

  const [showSetPin, setShowSetPin] = useState(false);
  const [showResetPin, setShowResetPin] = useState(false);
  const [showConfirmDisable, setShowConfirmDisable] = useState(false);

  /* ===============================
     LOAD SETTINGS
  =============================== */
  useEffect(() => {
    setIdle(getIdleMinutes());
    setAutoLock(isAutoLockEnabled());
    setPinEnabledState(isPinEnabled());
  }, []);

  /* ===============================
     TOGGLE PIN
  =============================== */
  const togglePin = () => {
    if (!pinEnabled) {
      // NYALAKAN PIN
      if (!hasPin()) {
        setShowSetPin(true);
        return;
      }

      setPinEnabled(true);
      setPinEnabledState(true);
      setAutoLockEnabled(true);
      setAutoLock(true);
    } else {
      setShowConfirmDisable(true);
    }
  };

  /* ===============================
     AUTO LOCK
  =============================== */
  const toggleAutoLock = () => {
    const next = !autoLock;
    setAutoLock(next);
    setAutoLockEnabled(next);
  };

  const handleIdleChange = (v) => {
    setIdle(v);
    setIdleMinutes(v);
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">Settings</h1>

      {/* ================= PIN ================= */}
      <div className="border rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold">PIN Lock</p>
            <p className="text-sm text-gray-500">
              Kunci aplikasi dengan PIN
            </p>
          </div>

          <button
            onClick={togglePin}
            className={`px-3 py-1 rounded text-sm ${
              pinEnabled
                ? "bg-green-600 text-white"
                : "bg-gray-300 text-gray-700"
            }`}
          >
            {pinEnabled ? "ON" : "OFF"}
          </button>
        </div>

        {pinEnabled && (
          <button
            onClick={() => setShowResetPin(true)}
            className="mt-3 text-blue-600 text-sm hover:underline"
          >
            Reset PIN
          </button>
        )}
      </div>

      {/* ================= AUTO LOCK ================= */}
      {pinEnabled && (
        <div className="border rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="font-semibold">Auto Lock</p>
              <p className="text-sm text-gray-500">
                Kunci otomatis jika idle
              </p>
            </div>

            <button
              onClick={toggleAutoLock}
              className={`px-3 py-1 rounded text-sm ${
                autoLock
                  ? "bg-green-600 text-white"
                  : "bg-gray-300 text-gray-700"
              }`}
            >
              {autoLock ? "ON" : "OFF"}
            </button>
          </div>

          {autoLock && (
            <select
              value={idle}
              onChange={(e) =>
                handleIdleChange(Number(e.target.value))
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value={1}>1 menit</option>
              <option value={3}>3 menit</option>
              <option value={5}>5 menit</option>
              <option value={10}>10 menit</option>
            </select>
          )}
        </div>
      )}

      {/* ================= SET PIN (PERTAMA KALI) ================= */}
      {showSetPin && (
        <SetPin
          onSuccess={() => {
            setShowSetPin(false);
            setPinEnabled(true);
            setPinEnabledState(true);
            setAutoLockEnabled(true);
            setAutoLock(true);
          }}
        />
      )}

      {/* ================= RESET PIN ================= */}
      {showResetPin && (
        <ResetPin onClose={() => setShowResetPin(false)} />
      )}

      {/* ================= CONFIRM DISABLE PIN ================= */}
      {showConfirmDisable && (
        <ConfirmPin
          onCancel={() => setShowConfirmDisable(false)}
          onSuccess={() => {
            setShowConfirmDisable(false);
            setPinEnabled(false);
            setPinEnabledState(false);
            setAutoLockEnabled(false);
            setAutoLock(false);
          }}
        />
      )}
    </div>
  );
}
