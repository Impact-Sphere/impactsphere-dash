// Free currency API: https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json
// Rates are EUR-based: 1 EUR = X currency

export const SUPPORTED_CURRENCIES = [
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "CN¥", name: "Chinese Yuan" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "ILS", symbol: "₪", name: "Israeli Shekel" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

let ratesCache: Record<string, number> | null = null;
let ratesFetchedAt = 0;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

async function fetchRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (ratesCache && now - ratesFetchedAt < CACHE_TTL_MS) {
    return ratesCache;
  }

  try {
    const res = await fetch(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json",
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) throw new Error("Failed to fetch rates");
    const data = await res.json();
    ratesCache = data.eur as Record<string, number>;
    ratesFetchedAt = now;
    return ratesCache;
  } catch {
    // Fallback to last known rates if available, otherwise 1:1
    if (ratesCache) return ratesCache;
    return {
      eur: 1,
      usd: 1.16343548,
      gbp: 0.86267936,
      jpy: 184.92157758,
      cny: 7.89449673,
      cad: 1.60653265,
      aud: 1.62305103,
      chf: 0.91112667,
      sek: 10.82183985,
      nok: 10.76392358,
      dkk: 7.47161198,
      nzd: 1.98735225,
      sgd: 1.48595103,
      hkd: 9.11555772,
      krw: 1753.75756712,
      inr: 110.96884539,
      brl: 5.83212465,
      mxn: 20.10517592,
      zar: 19.00289597,
      rub: 83.30624451,
      try: 53.40347473,
      pln: 4.23189025,
      thb: 37.91901914,
      idr: 20693.41178946,
      myr: 4.61287514,
      php: 71.67012442,
      aed: 4.27271681,
      sar: 4.36288306,
      ils: 3.35363696,
      czk: 24.25994441,
      huf: 356.87120557,
    };
  }
}

export async function convertEurTo(
  amountEur: number,
  targetCurrency: string,
): Promise<number> {
  const rates = await fetchRates();
  const rate = rates[targetCurrency.toLowerCase()] ?? 1;
  return Math.round(amountEur * rate);
}

export async function convertEurToFloat(
  amountEur: number,
  targetCurrency: string,
): Promise<number> {
  const rates = await fetchRates();
  const rate = rates[targetCurrency.toLowerCase()] ?? 1;
  return amountEur * rate;
}

export function getCurrencySymbol(currencyCode: string): string {
  const c = SUPPORTED_CURRENCIES.find((x) => x.code === currencyCode);
  return c?.symbol ?? "€";
}

export async function formatCurrency(
  amountEur: number,
  currencyCode = "EUR",
): Promise<string> {
  const converted = await convertEurToFloat(amountEur, currencyCode);
  const symbol = getCurrencySymbol(currencyCode);

  if (converted >= 1_000_000) {
    return `${symbol}${(converted / 1_000_000).toFixed(1)}M`;
  }
  if (converted >= 1_000) {
    return `${symbol}${(converted / 1_000).toFixed(converted >= 10_000 ? 0 : 1)}k`;
  }
  return `${symbol}${converted.toFixed(2)}`;
}

// Synchronous version for client-side (pass pre-fetched rates)
export function formatCurrencySync(
  amountEur: number,
  currencyCode = "EUR",
  rates?: Record<string, number>,
): string {
  const rate = rates?.[currencyCode.toLowerCase()] ?? 1;
  const converted = amountEur * rate;
  const symbol = getCurrencySymbol(currencyCode);

  if (converted >= 1_000_000) {
    return `${symbol}${(converted / 1_000_000).toFixed(1)}M`;
  }
  if (converted >= 1_000) {
    return `${symbol}${(converted / 1_000).toFixed(converted >= 10_000 ? 0 : 1)}k`;
  }
  return `${symbol}${converted.toFixed(2)}`;
}
