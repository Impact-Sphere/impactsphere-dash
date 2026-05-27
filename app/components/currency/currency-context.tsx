"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  type CurrencyCode,
  formatCurrencySync,
  getCurrencySymbol,
  SUPPORTED_CURRENCIES,
} from "@/app/lib/currency";

interface CurrencyContextValue {
  currency: CurrencyCode;
  rates: Record<string, number>;
  loading: boolean;
  setCurrency: (c: CurrencyCode) => Promise<void>;
  format: (amountEur: number) => string;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("EUR");
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user's preference
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.preferredCurrency) {
          setCurrencyState(data.preferredCurrency as CurrencyCode);
        }
      })
      .catch(() => {});

    // Fetch rates
    fetch(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json",
    )
      .then((r) => r.json())
      .then((data) => {
        setRates(data.eur || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const setCurrency = async (c: CurrencyCode) => {
    setCurrencyState(c);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredCurrency: c }),
    });
  };

  const format = (amountEur: number) =>
    formatCurrencySync(amountEur, currency, rates);
  const symbol = getCurrencySymbol(currency);

  return (
    <CurrencyContext.Provider
      value={{ currency, rates, loading, setCurrency, format, symbol }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export { SUPPORTED_CURRENCIES, getCurrencySymbol };
export type { CurrencyCode };
