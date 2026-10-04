import type { CurrencyCode } from "../types/currency"
import type { Language } from "../types/locale"
import { LOCALE_BY_LANGUAGE } from "../locales/translations"

export function formatMoney(
  amount: number,
  currency: CurrencyCode,
  language: Language,
) {
  return new Intl.NumberFormat(LOCALE_BY_LANGUAGE[language], {
    style: "currency",
    currency,
    currencyDisplay: "symbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(
  isoDate: string,
  language: Language,
  includeYear = false,
) {
  return new Intl.DateTimeFormat(LOCALE_BY_LANGUAGE[language], {
    day: "numeric",
    month: "long",
    year: includeYear ? "numeric" : undefined,
  }).format(new Date(`${isoDate}T00:00:00`))
}

export function todayIsoDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
