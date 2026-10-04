import type { CurrencyCode, ExchangeRates } from "../types/currency"

export function toBaseAmount(
  amount: number,
  currency: CurrencyCode,
  rates: ExchangeRates,
): number {
  const usdRate = Math.max(rates.usdPerEur, 0.0001)
  const uahRate = Math.max(rates.uahPerEur, 0.0001)

  if (currency === "EUR") {
    return amount
  }
  if (currency === "USD") {
    return amount / usdRate
  }
  return amount / uahRate
}
