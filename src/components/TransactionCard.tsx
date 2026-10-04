import { CATEGORIES } from "../constants/categories"
import { BASE_CURRENCY } from "../constants/currencies"
import { useAppSettings } from "../context/AppSettingsContext"
import { CATEGORY_KEYS } from "../locales/translations"
import type { CustomCategory, Transaction } from "../types/transaction"
import { formatDate, formatMoney } from "../utils/format"

type TransactionCardProps = {
  transaction: Transaction
  customCategories?: CustomCategory[]
}

export function TransactionCard({
  transaction,
  customCategories = [],
}: TransactionCardProps) {
  const { language, t, convertToBase } = useAppSettings()
  const category = CATEGORIES.find((item) => item.id === transaction.category)
  const customCategory = customCategories.find(
    (item) => item.id === transaction.category,
  )
  const Icon = category?.icon
  const transactionType = transaction.type ?? customCategory?.type ?? "expense"
  const categoryName =
    customCategory?.name ??
    (category ? t(CATEGORY_KEYS[category.id]) : transaction.category)
  const original = formatMoney(transaction.amount, transaction.currency, language)
  const baseAmount = convertToBase(transaction.amount, transaction.currency)
  const showEquivalent = transaction.currency !== BASE_CURRENCY

  return (
    <article className="flex items-center gap-3 rounded-2xl border border-slate-700/60 bg-[#243044]/70 px-3.5 py-3">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${category?.iconBg ?? "bg-teal-400/10"} ${category?.accent ?? "text-teal-200"}`}
      >
        {customCategory ? (
          <span aria-hidden="true" className="text-lg">{customCategory.icon}</span>
        ) : Icon ? (
          <Icon aria-hidden="true" className="h-5 w-5" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-100">
          {categoryName}
        </p>
        <p className="truncate text-sm text-slate-400">
          {formatDate(transaction.date, language)}
          {transaction.comment ? ` · ${transaction.comment}` : ""}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className={`text-sm font-semibold ${transactionType === "income" ? "text-emerald-300" : "text-rose-300"}`}>
          {transactionType === "income" ? "+" : "−"}{original}
        </p>
        {showEquivalent ? (
          <p className="text-xs text-slate-400">
            {t("equivalentPrefix")} {formatMoney(baseAmount, BASE_CURRENCY, language)}
          </p>
        ) : null}
      </div>
    </article>
  )
}
