import { CATEGORIES } from "../constants/categories"
import { BASE_CURRENCY } from "../constants/currencies"
import { useAppSettings } from "../context/AppSettingsContext"
import { CATEGORY_KEYS } from "../locales/translations"
import type {
  CategoryId,
  CustomCategory,
  Transaction,
} from "../types/transaction"
import { formatDate, formatMoney } from "../utils/format"

type CategoryDetailDialogProps = {
  categoryId: CategoryId
  transactions: Transaction[]
  customCategories: CustomCategory[]
  onClose: () => void
}

export function CategoryDetailDialog({
  categoryId,
  transactions,
  customCategories,
  onClose,
}: CategoryDetailDialogProps) {
  const { convertToBase, language, t } = useAppSettings()
  const builtInCategory = CATEGORIES.find((item) => item.id === categoryId)
  const customCategory = customCategories.find((item) => item.id === categoryId)
  const categoryName =
    customCategory?.name ??
    (builtInCategory ? t(CATEGORY_KEYS[builtInCategory.id]) : categoryId)
  const Icon = builtInCategory?.icon
  const categoryTransactions = transactions
    .filter((transaction) => transaction.category === categoryId)
    .sort((first, second) => second.date.localeCompare(first.date))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4">
      <button
        type="button"
        aria-label={t("close")}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-detail-title"
        className="relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-700 bg-[#1e293b] p-4 shadow-2xl sm:p-6"
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xl text-teal-200">
            {customCategory ? (
              <span aria-hidden="true">{customCategory.icon}</span>
            ) : Icon ? (
              <Icon aria-hidden="true" className="h-5 w-5" />
            ) : null}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="category-detail-title" className="truncate text-lg font-semibold text-slate-50">
              {categoryName}
            </h2>
            <p className="text-sm text-slate-400">
              {t("categoryTransactionCount", { count: categoryTransactions.length })}
            </p>
          </div>
          <button
            type="button"
            aria-label={t("close")}
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
          >
            {t("close")}
          </button>
        </div>

        {categoryTransactions.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">{t("categoryNoTransactions")}</p>
        ) : (
          <ul className="max-h-[60dvh] divide-y divide-slate-700 overflow-y-auto">
            {categoryTransactions.map((transaction) => {
              const type = transaction.type ?? customCategory?.type ?? "expense"
              return (
                <li
                  key={transaction.id}
                  className="flex min-w-0 items-start justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-slate-300">
                      {formatDate(transaction.date, language, true)}
                    </p>
                    <p className="break-words text-sm text-slate-400">
                      {transaction.comment || t("noComment")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-semibold ${type === "income" ? "text-emerald-300" : "text-rose-300"}`}>
                      {type === "income" ? "+" : "−"}
                      {formatMoney(transaction.amount, transaction.currency, language)}
                    </p>
                    {transaction.currency !== "EUR" && (
                      <p className="text-xs text-slate-400">
                        {t("equivalentPrefix")} {formatMoney(
                          convertToBase(transaction.amount, transaction.currency),
                          BASE_CURRENCY,
                          language,
                        )}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
