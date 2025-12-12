"use client";

import "./globals.css";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/Toast";
import LockScreen from "@/components/LockScreen";
import useAutoLock from "@/lib/useAutoLock";
import {
  getIdleMinutes,
  isAutoLockEnabled,
  isPinEnabled,
} from "@/lib/settings";

export default function RootLayout({ children }) {
  const [locked, setLocked] = useState(false);
  const [idleMinutes, setIdleMinutesState] = useState(3);
  const [autoLockEnabled, setAutoLockEnabledState] = useState(true);
  const [pinEnabled, setPinEnabledState] = useState(false);

  /* ===============================
     LOAD SETTINGS (READ ONLY)
  =============================== */
  useEffect(() => {
    setIdleMinutesState(getIdleMinutes());
    setAutoLockEnabledState(isAutoLockEnabled());
    setPinEnabledState(isPinEnabled());
  }, []);

  /* ===============================
     AUTO LOCK
     hanya jika:
     - PIN enabled
     - Auto lock enabled
  =============================== */
  useAutoLock(() => {
    if (pinEnabled && autoLockEnabled) {
      setLocked(true);
    }
  }, idleMinutes * 60 * 1000);

  return (
    <html lang="en">
      <body className="bg-gray-50">
        <ToastProvider>

          <Navbar onLock={() => pinEnabled && setLocked(true)} />

          <main className="max-w-5xl mx-auto px-4 py-4 pb-40">
            {children}
          </main>

          {/* LOCK SCREEN */}
          {pinEnabled && locked && (
            <LockScreen onUnlock={() => setLocked(false)} />
          )}

        </ToastProvider>
      </body>
    </html>
  );
}
