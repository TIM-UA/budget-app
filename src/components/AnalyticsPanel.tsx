import { useMemo } from "react"
import { CATEGORIES } from "../constants/categories"
import { BASE_CURRENCY } from "../constants/currencies"
import { useAppSettings } from "../context/AppSettingsContext"
import { CATEGORY_KEYS, LOCALE_BY_LANGUAGE } from "../locales/translations"
import type {
  CategoryId,
  CustomCategory,
  Transaction,
  TransactionDateRange,
  TransactionPeriod,
} from "../types/transaction"
import { formatMoney } from "../utils/format"
import { isWithinPeriod } from "../utils/period"

type AnalyticsPanelProps = {
  transactions: Transaction[]
  customCategories: CustomCategory[]
  period: TransactionPeriod
  dateRange: TransactionDateRange
  className?: string
  onSelectCategory: (categoryId: CategoryId) => void
}

export function AnalyticsPanel({
  transactions,
  customCategories,
  period,
  dateRange,
  className = "",
  onSelectCategory,
}: AnalyticsPanelProps) {
  const { convertToBase, language, t } = useAppSettings()

  const summary = useMemo(() => {
    let income = 0
    let expenses = 0
    const expensesByCategory = new Map<CategoryId, number>()

    for (const transaction of transactions) {
      if (!isWithinPeriod(transaction.date, period, dateRange)) {
        continue
      }

      const amount = convertToBase(transaction.amount, transaction.currency)
      const customCategory = customCategories.find(
        (category) => category.id === transaction.category,
      )
      const type = transaction.type ?? customCategory?.type ?? "expense"

      if (type === "income") {
        income += amount
      } else {
        expenses += amount
        expensesByCategory.set(
          transaction.category,
          (expensesByCategory.get(transaction.category) ?? 0) + amount,
        )
      }
    }

    const topSpending = [...expensesByCategory.entries()]
      .sort((first, second) => second[1] - first[1])
      .slice(0, 5)
      .map(([categoryId, amount]) => {
        const customCategory = customCategories.find(
          (category) => category.id === categoryId,
        )
        const builtInCategory = CATEGORIES.find(
          (category) => category.id === categoryId,
        )

        return {
          id: categoryId,
          amount,
          name:
            customCategory?.name ??
            (builtInCategory ? t(CATEGORY_KEYS[builtInCategory.id]) : categoryId),
          icon: customCategory?.icon,
          Icon: builtInCategory?.icon,
        }
      })

    return { income, expenses, balance: income - expenses, topSpending }
  }, [transactions, customCategories, period, dateRange, convertToBase, t])

  const periodLabel =
    period === "all"
      ? t("allTime")
      : period === "month"
        ? t("thisMonth")
        : period === "prev_month"
          ? t("previousMonth")
          : t("dateRangeSummary", {
              from: dateRange.from || t("anyDate"),
              to: dateRange.to || t("anyDate"),
            })
  const totalSpending = summary.expenses || 1

  return (
    <section
      className={`min-w-0 space-y-5 rounded-3xl border border-slate-700/70 bg-[#1e293b] p-5 shadow-xl shadow-slate-950/40 sm:p-6 ${className}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-50">{t("analyticsTitle")}</h2>
        <span className="text-sm text-slate-400">{periodLabel}</span>
      </div>

      <dl className="grid grid-cols-1 divide-y divide-slate-700 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="py-3 sm:py-1 sm:pr-5">
          <dt className="text-sm text-slate-400">{t("totalIncome")}</dt>
          <dd className="mt-1 text-xl font-semibold text-emerald-300">
            {formatMoney(summary.income, BASE_CURRENCY, language)}
          </dd>
        </div>
        <div className="py-3 sm:px-5 sm:py-1">
          <dt className="text-sm text-slate-400">{t("totalExpenses")}</dt>
          <dd className="mt-1 text-xl font-semibold text-rose-300">
            {formatMoney(summary.expenses, BASE_CURRENCY, language)}
          </dd>
        </div>
        <div className="py-3 sm:pl-5 sm:py-1">
          <dt className="text-sm text-slate-400">{t("totalBalance")}</dt>
          <dd
            className={`mt-1 text-xl font-semibold ${summary.balance < 0 ? "text-rose-300" : "text-teal-200"}`}
          >
            {formatMoney(summary.balance, BASE_CURRENCY, language)}
          </dd>
        </div>
      </dl>

      <div className="border-t border-slate-700 pt-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">
          {t("topSpendingCategories")}
        </h3>
        {summary.topSpending.length === 0 ? (
          <p className="py-2 text-sm text-slate-400">{t("noSpending")}</p>
        ) : (
          <ul className="space-y-3">
            {summary.topSpending.map((item) => {
              const Icon = item.Icon
              const percentage = (item.amount / totalSpending) * 100
              const formattedPercentage = percentage.toLocaleString(
                LOCALE_BY_LANGUAGE[language],
                { maximumFractionDigits: 1 },
              )
              return (
                <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center text-sm">
                      {item.icon ? (
                        <span aria-hidden="true">{item.icon}</span>
                      ) : Icon ? (
                        <Icon aria-hidden="true" className="h-4 w-4 text-slate-300" />
                      ) : null}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectCategory(item.id)}
                      aria-label={t("viewCategoryTransactions", { category: item.name })}
                      className="truncate text-left text-sm text-slate-300 hover:text-teal-200 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                    >
                      {item.name}
                    </button>
                  </div>
                  <span className="whitespace-nowrap text-right text-sm font-medium text-slate-200">
                    {formatMoney(item.amount, BASE_CURRENCY, language)}
                    <span className="ml-2 text-xs text-slate-400">
                      {formattedPercentage}%
                    </span>
                  </span>
                  <div
                    className="col-span-2 h-2 overflow-hidden rounded-full bg-slate-800"
                    role="progressbar"
                    aria-label={item.name}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(percentage)}
                  >
                    <div
                      className="h-full rounded-full bg-teal-400 transition-[width]"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
