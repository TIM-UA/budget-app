import { todayIsoDate } from "./format"
import type {
  TransactionDateRange,
  TransactionPeriod,
} from "../types/transaction"

export function isWithinPeriod(
  date: string,
  period: TransactionPeriod,
  dateRange: TransactionDateRange = { from: "", to: "" },
): boolean {
  if (period === "all") {
    return true
  }

  if (period === "custom") {
    if (dateRange.from && dateRange.to && dateRange.from > dateRange.to) {
      return false
    }
    return (!dateRange.from || date >= dateRange.from) &&
      (!dateRange.to || date <= dateRange.to)
  }

  const today = new Date(`${todayIsoDate()}T12:00:00`)
  const transactionDate = new Date(`${date}T12:00:00`)
  const targetMonth =
    period === "month"
      ? today
      : new Date(today.getFullYear(), today.getMonth() - 1, 1)

  return (
    transactionDate.getMonth() === targetMonth.getMonth() &&
    transactionDate.getFullYear() === targetMonth.getFullYear()
  )
}