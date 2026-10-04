import type { CurrencyCode } from "../types/currency"

export type CurrencyMeta = {
  code: CurrencyCode
  symbol: string
}

export const BASE_CURRENCY: CurrencyCode = "EUR"

export const CURRENCIES: CurrencyMeta[] = [
  { code: "EUR", symbol: "€" },
  { code: "USD", symbol: "$" },
  { code: "UAH", symbol: "₴" },
]

export const CURRENCY_MAP = Object.fromEntries(
  CURRENCIES.map((item) => [item.code, item]),
) as Record<CurrencyCode, CurrencyMeta>
