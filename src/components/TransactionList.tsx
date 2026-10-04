import { useMemo, useState } from "react"
import { CalendarDays, Pencil, RotateCcw, Search, Trash2 } from "lucide-react"
import { CATEGORIES } from "../constants/categories"
import { BASE_CURRENCY, CURRENCY_MAP } from "../constants/currencies"
import { TransactionEditDialog } from "./TransactionEditDialog"
import { useAppSettings } from "../context/AppSettingsContext"
import {
  CATEGORY_KEYS,
  LOCALE_BY_LANGUAGE,
} from "../locales/translations"
import type {
  CategoryId,
  CustomCategory,
  Transaction,
  TransactionDateRange,
  TransactionPeriod,
} from "../types/transaction"
import { isWithinPeriod } from "../utils/period"

type TransactionListProps = {
  transactions: Transaction[]
  customCategories: CustomCategory[]
  period: TransactionPeriod
  onPeriodChange: (period: TransactionPeriod) => void
  dateRange: TransactionDateRange
  onDateRangeChange: (dateRange: TransactionDateRange) => void
  onDeleteTransaction: (id: string) => void
  onRestoreTransaction: (id: string) => void
  onEditTransaction: (transaction: Transaction) => void
  onSelectCategory: (categoryId: CategoryId) => void
  isTrash: boolean
  trashedCount: number
  onToggleTrash: () => void
}

function parsePeriodFilter(value: string): TransactionPeriod | null {
  switch (value) {
    case "all":
    case "month":
    case "prev_month":
    case "custom":
      return value
    default:
      return null
  }
}

export function TransactionList({
  transactions,
  customCategories,
  period,
  onPeriodChange,
  dateRange,
  onDateRangeChange,
  onDeleteTransaction,
  onRestoreTransaction,
  onEditTransaction,
  onSelectCategory,
  isTrash,
  trashedCount,
  onToggleTrash,
}: TransactionListProps) {
  const { convertToBase, language, t } = useAppSettings()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const filteredTransactions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase(language)

    return transactions
      .filter((transaction) => {
        const customCategory = customCategories.find(
          (item) => item.id === transaction.category,
        )
        const builtInCategory = CATEGORIES.find(
          (item) => item.id === transaction.category,
        )
        const categoryName =
          customCategory?.name ??
          (builtInCategory
            ? t(CATEGORY_KEYS[builtInCategory.id])
            : transaction.category)
        const matchesSearch =
          transaction.comment.toLocaleLowerCase(language).includes(normalizedQuery) ||
          categoryName.toLocaleLowerCase(language).includes(normalizedQuery)
        const matchesCategory =
          isTrash ||
          selectedCategory === "all" ||
          transaction.category === selectedCategory
        return (
          matchesSearch &&
          matchesCategory &&
          (isTrash || isWithinPeriod(transaction.date, period, dateRange))
        )
      })
      .sort(
        (first, second) =>
          new Date(`${second.date}T12:00:00`).getTime() -
          new Date(`${first.date}T12:00:00`).getTime(),
      )
  }, [
    transactions,
    customCategories,
    searchQuery,
    selectedCategory,
    period,
    dateRange,
    language,
    t,
    isTrash,
  ])

  const dateRangeInvalid =
    Boolean(dateRange.from && dateRange.to) && dateRange.from > dateRange.to

  return (
    <section className="min-w-0 space-y-5 rounded-3xl border border-slate-700/70 bg-[#1e293b] p-5 shadow-xl shadow-slate-950/40 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-50">
          {isTrash ? t("trash") : t("recentOperations")}
        </h2>
        <button
          type="button"
          onClick={onToggleTrash}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 transition hover:border-teal-400/70 hover:text-teal-100"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          {isTrash ? t("recentOperations") : `${t("trash")} (${trashedCount})`}
        </button>
      </div>

      <div className={`grid grid-cols-1 gap-3 ${isTrash ? "" : "md:grid-cols-3"}`}>
        <label className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            aria-label={t("searchTransactions")}
            placeholder={t("searchTransactions")}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-600/80 bg-[#0f172a] pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-teal-400/70 focus:ring-2 focus:ring-teal-400/20"
          />
        </label>

        {!isTrash && (
          <>
            <select
              value={selectedCategory}
              aria-label={t("filterCategory")}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="h-11 rounded-xl border border-slate-600/80 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none focus:border-teal-400/70 focus:ring-2 focus:ring-teal-400/20"
            >
              <option value="all">{t("allCategories")}</option>
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {t(CATEGORY_KEYS[category.id])}
                </option>
              ))}
              {customCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>

            <select
              value={period}
              aria-label={t("filterPeriod")}
              onChange={(event) => {
                const nextPeriod = parsePeriodFilter(event.target.value)
                if (nextPeriod) {
                  onPeriodChange(nextPeriod)
                  setDatePickerOpen(nextPeriod === "custom")
                }
              }}
              className="h-11 rounded-xl border border-slate-600/80 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none focus:border-teal-400/70 focus:ring-2 focus:ring-teal-400/20"
            >
              <option value="all">{t("allTime")}</option>
              <option value="month">{t("thisMonth")}</option>
              <option value="prev_month">{t("previousMonth")}</option>
              <option value="custom">{t("customDateRange")}</option>
            </select>
          </>
        )}
      </div>

      <div className="max-h-[450px] space-y-3 overflow-y-auto pr-1">
        {filteredTransactions.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            {isTrash ? t("trashEmpty") : t("emptyList")}
          </div>
        ) : (
          filteredTransactions.map((transaction) => {
            const category = CATEGORIES.find((item) => item.id === transaction.category)
            const customCategory = customCategories.find(
              (item) => item.id === transaction.category,
            )
            const Icon = category?.icon
            const categoryName =
              customCategory?.name ??
              (category ? t(CATEGORY_KEYS[category.id]) : transaction.category)
            const transactionType =
              transaction.type ?? customCategory?.type ?? "expense"
            const currency = CURRENCY_MAP[transaction.currency]
            const baseAmount = convertToBase(transaction.amount, transaction.currency)
            const formattedAmount = transaction.amount.toLocaleString(
              LOCALE_BY_LANGUAGE[language],
              { minimumFractionDigits: 2, maximumFractionDigits: 2 },
            )

            return (
              <div
                key={transaction.id}
                className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition-colors hover:border-slate-700"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-800 ${category?.accent ?? "text-slate-300"}`}>
                    {customCategory ? (
                      <span aria-hidden="true" className="text-lg">{customCategory.icon}</span>
                    ) : Icon ? (
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">
                      <button
                        type="button"
                        onClick={() => onSelectCategory(transaction.category)}
                        className="max-w-full truncate text-left hover:text-teal-200 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                      >
                        {categoryName}
                      </button>
                    </div>
                    {transaction.comment && (
                      <div className="truncate text-xs text-slate-400">{transaction.comment}</div>
                    )}
                    <div className="text-[0.625rem] text-slate-500">
                      {new Date(`${transaction.date}T12:00:00`).toLocaleDateString(
                        LOCALE_BY_LANGUAGE[language],
                      )}
                    </div>
                  </div>
                </div>

                <div className="ml-3 flex shrink-0 items-center gap-2 sm:gap-4">
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${transactionType === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                      {transactionType === "income" ? "+" : "−"}{formattedAmount} {currency.symbol}
                    </div>
                    {transaction.currency !== BASE_CURRENCY && (
                      <div className="text-[0.625rem] text-slate-400">
                        {t("equivalentPrefix")} {baseAmount.toLocaleString(
                          LOCALE_BY_LANGUAGE[language],
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                        )} €
                      </div>
                    )}
                  </div>

                  {!isTrash && <div className="flex items-center">
                    <button
                      type="button"
                      aria-label={t("editTransaction")}
                      title={t("editTransaction")}
                      onClick={() => setEditingTransaction(transaction)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-teal-500/10 hover:text-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Pencil aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={t("deleteTransaction")}
                      title={t("deleteTransaction")}
                      onClick={() => setPendingDelete(transaction)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>}
                  {isTrash && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={t("restore")}
                        title={t("restore")}
                        onClick={() => onRestoreTransaction(transaction.id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-teal-500/10 hover:text-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                      >
                        <RotateCcw aria-hidden="true" className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={t("deletePermanently")}
                        title={t("deletePermanently")}
                        onClick={() => {
                          if (window.confirm(t("permanentDeleteConfirm"))) {
                            onDeleteTransaction(transaction.id)
                          }
                        }}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {datePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t("cancel")}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={() => setDatePickerOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="date-range-title"
            className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-[#1e293b] p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="h-5 w-5 text-teal-300" />
              <h2 id="date-range-title" className="text-lg font-semibold text-slate-50">
                {t("dateRangeTitle")}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-300">{t("fromDate")}</span>
                <input
                  type="date"
                  value={dateRange.from}
                  max={dateRange.to || undefined}
                  onChange={(event) =>
                    onDateRangeChange({ ...dateRange, from: event.target.value })
                  }
                  className="h-11 w-full rounded-xl border border-slate-600/80 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none focus:border-teal-400/70 focus:ring-2 focus:ring-teal-400/20"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-300">{t("toDate")}</span>
                <input
                  type="date"
                  value={dateRange.to}
                  min={dateRange.from || undefined}
                  onChange={(event) =>
                    onDateRangeChange({ ...dateRange, to: event.target.value })
                  }
                  className="h-11 w-full rounded-xl border border-slate-600/80 bg-[#0f172a] px-3 text-sm text-slate-100 outline-none focus:border-teal-400/70 focus:ring-2 focus:ring-teal-400/20"
                />
              </label>
            </div>
            {dateRangeInvalid && (
              <p className="mt-3 text-sm text-rose-300">{t("invalidDateRange")}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDatePickerOpen(false)}
                className="h-10 rounded-lg px-3 text-sm text-slate-300 hover:bg-slate-700"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={() => setDatePickerOpen(false)}
                disabled={dateRangeInvalid}
                className="h-10 rounded-lg bg-teal-400 px-3 text-sm font-semibold text-slate-950 hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("save")}
              </button>
            </div>
          </section>
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t("cancel")}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={() => setPendingDelete(null)}
          />
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-transaction-title"
            className="relative w-full max-w-sm rounded-2xl border border-slate-700 bg-[#1e293b] p-5 shadow-2xl"
          >
            <h2 id="delete-transaction-title" className="text-base font-semibold text-slate-50">
              {t("deleteTransaction")}
            </h2>
            <p className="mt-2 text-sm text-slate-300">{t("deleteConfirm")}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="h-10 rounded-lg px-3 text-sm text-slate-300 hover:bg-slate-700"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTransaction(pendingDelete.id)
                  setPendingDelete(null)
                }}
                className="h-10 rounded-lg bg-rose-500 px-3 text-sm font-semibold text-white hover:bg-rose-400"
              >
                {t("deleteTransaction")}
              </button>
            </div>
          </section>
        </div>
      )}

      {editingTransaction && (
        <TransactionEditDialog
          key={editingTransaction.id}
          transaction={editingTransaction}
          customCategories={customCategories}
          onClose={() => setEditingTransaction(null)}
          onSave={(transaction) => {
            onEditTransaction(transaction)
            setEditingTransaction(null)
          }}
        />
      )}
    </section>
  )
}