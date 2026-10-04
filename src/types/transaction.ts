import type { CurrencyCode } from "./currency"

export type BuiltInCategoryId =
  | "food"
  | "transport"
  | "housing"
  | "entertainment"
  | "shopping"
  | "health"
  | "other"

export type CategoryId = BuiltInCategoryId | `custom:${string}`
export type TransactionType = "expense" | "income"
export type TransactionPeriod = "all" | "month" | "prev_month" | "custom"
export type TransactionDateRange = { from: string; to: string }

export type CustomCategory = {
  id: `custom:${string}`
  name: string
  icon: string
  type: TransactionType
}

export type Transaction = {
  id: string
  amount: number
  currency: CurrencyCode
  category: CategoryId
  type?: TransactionType
  date: string
  comment: string
}
