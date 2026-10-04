import type { Transaction } from "../types/transaction"

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-1",
    amount: 18.5,
    currency: "EUR",
    category: "food",
    date: "2026-09-30",
    comment: "Обід у кафе",
  },
  {
    id: "tx-2",
    amount: 86,
    currency: "UAH",
    category: "transport",
    date: "2026-09-29",
    comment: "Метро, дві поїздки",
  },
  {
    id: "tx-3",
    amount: 64,
    currency: "USD",
    category: "shopping",
    date: "2026-09-28",
    comment: "Кросівки",
  },
  {
    id: "tx-4",
    amount: 12,
    currency: "EUR",
    category: "entertainment",
    date: "2026-09-27",
    comment: "Кіно з друзями",
  },
  {
    id: "tx-5",
    amount: 420,
    currency: "EUR",
    category: "housing",
    date: "2026-09-25",
    comment: "Оренда",
  },
  {
    id: "tx-6",
    amount: 850,
    currency: "UAH",
    category: "health",
    date: "2026-09-24",
    comment: "Аптека",
  },
]
