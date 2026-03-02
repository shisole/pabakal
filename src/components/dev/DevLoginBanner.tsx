"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

const DEV_ACCOUNTS = {
  admin: [
    { email: "admin@pabakal.com", password: "password123", label: "Stephen (PH Admin)" },
    { email: "aunt@pabakal.com", password: "password123", label: "Tita Beth (US Aunt)" },
  ],
  customer: [
    { email: "customer1@example.com", password: "password123", label: "Maria Santos" },
    { email: "customer2@example.com", password: "password123", label: "Juan dela Cruz" },
    { email: "customer3@example.com", password: "password123", label: "Ana Reyes" },
    { email: "customer4@example.com", password: "password123", label: "Carlo Mendoza" },
    { email: "customer5@example.com", password: "password123", label: "Jasmine Villanueva" },
  ],
} as const;

export default function DevLoginBanner() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user?.email ?? null);
    });
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    setLoading(email);
    const supabase = createClient();

    // Sign out first if already logged in
    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("Dev login failed:", error.message);
      setLoading(null);
      return;
    }

    setCurrentUser(email);
    setLoading(null);
    globalThis.location.href = "/";
  }, []);

  const handleLogout = useCallback(async () => {
    setLoading("logout");
    const supabase = createClient();
    await supabase.auth.signOut();
    setCurrentUser(null);
    setLoading(null);
    globalThis.location.href = "/";
  }, []);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed top-2 right-2 z-[9999] rounded bg-gray-900 px-2 py-1 text-xs text-gray-400 opacity-50 hover:opacity-100 transition-opacity"
      >
        Dev
      </button>
    );
  }

  return (
    <div className="relative z-[9999] w-full bg-gray-900 text-white text-xs">
      <div className="mx-auto flex max-w-screen-xl items-center gap-3 px-4 py-2">
        <span className="shrink-0 font-semibold text-yellow-400">DEV</span>

        {currentUser && (
          <span className="shrink-0 text-gray-400">
            Logged in as <span className="text-green-400">{currentUser}</span>
          </span>
        )}

        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          <span className="text-gray-500">Admin:</span>
          {DEV_ACCOUNTS.admin.map((acc) => (
            <button
              key={acc.email}
              onClick={() => handleLogin(acc.email, acc.password)}
              disabled={loading !== null}
              className={`rounded px-2 py-0.5 transition-colors ${
                currentUser === acc.email
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              } disabled:opacity-50`}
            >
              {loading === acc.email ? "..." : acc.label}
            </button>
          ))}

          <span className="ml-2 text-gray-500">Customer:</span>
          {DEV_ACCOUNTS.customer.map((acc) => (
            <button
              key={acc.email}
              onClick={() => handleLogin(acc.email, acc.password)}
              disabled={loading !== null}
              className={`rounded px-2 py-0.5 transition-colors ${
                currentUser === acc.email
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              } disabled:opacity-50`}
            >
              {loading === acc.email ? "..." : acc.label}
            </button>
          ))}

          {currentUser && (
            <button
              onClick={handleLogout}
              disabled={loading !== null}
              className="ml-2 rounded bg-red-800 px-2 py-0.5 text-red-200 hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading === "logout" ? "..." : "Logout"}
            </button>
          )}
        </div>

        <button
          onClick={() => setCollapsed(true)}
          className="shrink-0 text-gray-500 hover:text-gray-300"
          title="Collapse"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
