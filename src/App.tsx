import { useEffect, useState } from "react"
import { Header } from "./components/Header"
import { AnalyticsPanel } from "./components/AnalyticsPanel"
import { CategoryDetailDialog } from "./components/CategoryDetailDialog"
import { TransactionForm } from "./components/TransactionForm"
import { TransactionList } from "./components/TransactionList"
import { MOCK_TRANSACTIONS } from "./constants/mockTransactions"
import { useAppSettings } from "./context/AppSettingsContext"
import { useStorage } from "./context/StorageContext"
import { CATEGORIES } from "./constants/categories"
import { CATEGORY_KEYS, LOCALE_BY_LANGUAGE } from "./locales/translations"
import type {
  CustomCategory,
  CategoryId,
  Transaction,
  TransactionDateRange,
  TransactionPeriod,
  TransactionType,
} from "./types/transaction"
import { todayIsoDate } from "./utils/format"

const TRANSACTIONS_STORAGE_KEY = "budget-app-transactions"
const TRASH_STORAGE_KEY = "budget-app-trashed-transactions"
const CUSTOM_CATEGORIES_STORAGE_KEY = "budget-app-custom-categories"

function isTransactionType(value: unknown): value is TransactionType {
  return value === "expense" || value === "income"
}

function isCategoryId(value: unknown): value is CategoryId {
  return (
    value === "food" ||
    value === "transport" ||
    value === "housing" ||
    value === "entertainment" ||
    value === "shopping" ||
    value === "health" ||
    value === "other" ||
    (typeof value === "string" && value.startsWith("custom:") && value.length > 7)
  )
}

function isTransaction(value: unknown): value is Transaction {
  if (typeof value !== "object" || value === null) {
    return false
  }

  return (
    "id" in value &&
    typeof value.id === "string" &&
    "amount" in value &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount) &&
    value.amount > 0 &&
    "currency" in value &&
    (value.currency === "EUR" || value.currency === "USD" || value.currency === "UAH") &&
    "category" in value &&
    isCategoryId(value.category) &&
    (!("type" in value) || isTransactionType(value.type)) &&
    "date" in value &&
    typeof value.date === "string" &&
    "comment" in value &&
    typeof value.comment === "string"
  )
}

function readCustomCategories(storage: ReturnType<typeof useStorage>): CustomCategory[] {
  try {
    const stored = storage.adapter.getItem(CUSTOM_CATEGORIES_STORAGE_KEY)
    if (!stored) {
      return []
    }

    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isCustomCategory)
  } catch {
    return []
  }
}

function readTransactions(
  storage: ReturnType<typeof useStorage>,
): Transaction[] {
  const emptyState = storage.userId ? [] : MOCK_TRANSACTIONS
  try {
    const stored = storage.adapter.getItem(TRANSACTIONS_STORAGE_KEY)
    if (!stored) return emptyState
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return emptyState
    const validTransactions = parsed.filter(isTransaction)
    return validTransactions.length === parsed.length
      ? validTransactions
      : emptyState
  } catch {
    return emptyState
  }
}

function isCustomCategory(value: unknown): value is CustomCategory {
  if (typeof value !== "object" || value === null) return false
  return (
    "id" in value &&
    typeof value.id === "string" &&
    value.id.startsWith("custom:") &&
    value.id.length > 7 &&
    "name" in value &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    "icon" in value &&
    typeof value.icon === "string" &&
    value.icon.length > 0 &&
    value.icon.length <= 32 &&
    "type" in value &&
    isTransactionType(value.type)
  )
}

function readTrashedTransactions(storage: ReturnType<typeof useStorage>): Transaction[] {
  try {
    const stored = storage.adapter.getItem(TRASH_STORAGE_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed.filter(isTransaction) : []
  } catch {
    return []
  }
}

function csvCell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`
}

function htmlCell(value: string | number): string {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }
    return entities[character]
  })
}

function reportHtml(
  title: string,
  rows: Array<Array<string | number>>,
): string {
  const [headers, ...bodyRows] = rows
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${htmlCell(title)}</title>
<style>
body{font-family:Arial,sans-serif;color:#172033;margin:32px}
h1{font-size:22px;margin:0 0 20px}
table{border-collapse:collapse;width:100%}
th,td{border:1px solid #cbd5e1;padding:8px 10px;text-align:left}
th{background:#e2e8f0;font-weight:700}
tr:nth-child(even){background:#f8fafc}
@media print{body{margin:12mm}thead{display:table-header-group}tr{break-inside:avoid}}
</style>
</head>
<body>
<h1>${htmlCell(title)}</h1>
<table><thead><tr>${headers.map((cell) => `<th>${htmlCell(cell)}</th>`).join("")}</tr></thead>
<tbody>${bodyRows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${htmlCell(cell)}</td>`).join("")}</tr>`,
    )
    .join("")}</tbody>
</table>
</body>
</html>`
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const downloadLink = document.createElement("a")
  downloadLink.href = url
  downloadLink.download = filename
  document.body.append(downloadLink)
  downloadLink.click()
  downloadLink.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function App() {
  const { language, t } = useAppSettings()
  const storage = useStorage()
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    readTransactions(storage),
  )
  const [trashedTransactions, setTrashedTransactions] =
    useState<Transaction[]>(() => readTrashedTransactions(storage))
  const [customCategories, setCustomCategories] =
    useState<CustomCategory[]>(() => readCustomCategories(storage))
  const [showTrash, setShowTrash] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<TransactionPeriod>("all")
  const [dateRange, setDateRange] = useState<TransactionDateRange>({ from: "", to: "" })
  const [selectedCategoryDetail, setSelectedCategoryDetail] =
    useState<CategoryId | null>(null)

  useEffect(() => {
    try {
      storage.adapter.setItem(TRASH_STORAGE_KEY, JSON.stringify(trashedTransactions))
    } catch {
      /* ignore unavailable or full storage */
    }
  }, [trashedTransactions, storage.adapter])

  useEffect(() => {
    try {
      storage.adapter.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions))
    } catch {
      /* ignore unavailable or full storage */
    }
  }, [transactions, storage.adapter])

  useEffect(() => {
    try {
      storage.adapter.setItem(
        CUSTOM_CATEGORIES_STORAGE_KEY,
        JSON.stringify(customCategories),
      )
    } catch {
      /* ignore unavailable or full storage */
    }
  }, [customCategories, storage.adapter])

  function handleAdd(transaction: Omit<Transaction, "id">) {
    const next: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
    }
    setTransactions((current) => [next, ...current])
  }

  function handleDelete(id: string) {
    const deleted = transactions.find((transaction) => transaction.id === id)
    if (!deleted) return
    setTransactions((current) => current.filter((transaction) => transaction.id !== id))
    setTrashedTransactions((current) => [deleted, ...current])
  }

  function handleRestore(id: string) {
    const restored = trashedTransactions.find((transaction) => transaction.id === id)
    if (!restored) return
    setTrashedTransactions((current) => current.filter((transaction) => transaction.id !== id))
    setTransactions((current) => [restored, ...current])
  }

  function handleDeletePermanently(id: string) {
    setTrashedTransactions((current) => current.filter((transaction) => transaction.id !== id))
  }

  function handleEdit(transaction: Transaction) {
    setTransactions((current) =>
      current.map((item) => (item.id === transaction.id ? transaction : item)),
    )
  }

  function handleAddCategory(
    category: Omit<CustomCategory, "id">,
  ): CustomCategory {
    const next: CustomCategory = {
      ...category,
      id: `custom:${crypto.randomUUID()}`,
    }
    setCustomCategories((current) => [...current, next])
    return next
  }

  function handleDeleteCategory(id: CustomCategory["id"]): boolean {
    const category = customCategories.find((item) => item.id === id)
    if (!category) {
      return false
    }

    const isUsed =
      transactions.some((transaction) => transaction.category === id) ||
      trashedTransactions.some((transaction) => transaction.category === id)
    const confirmation = isUsed
      ? t("deleteCategoryUsedConfirm", { category: category.name })
      : t("deleteCategoryConfirm", { category: category.name })
    if (!window.confirm(confirmation)) {
      return false
    }

    if (isUsed) {
      setTransactions((current) =>
        current.map((transaction) =>
          transaction.category === id
            ? { ...transaction, category: "other" }
            : transaction,
        ),
      )
      setTrashedTransactions((current) =>
        current.map((transaction) =>
          transaction.category === id
            ? { ...transaction, category: "other" }
            : transaction,
        ),
      )
    }
    setCustomCategories((current) => current.filter((item) => item.id !== id))
    return true
  }

  function handleResetStorage() {
    try {
      storage.adapter.clear()
    } catch {
      window.alert(t("storageResetFailed"))
      return false
    }
    setTransactions([])
    setTrashedTransactions([])
    setCustomCategories([])
    setSelectedPeriod("all")
    setDateRange({ from: "", to: "" })
    setSelectedCategoryDetail(null)
    setShowTrash(false)
    return true
  }

  function exportCsv(rows: Array<Array<string | number>>, filename: string) {
    const content = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`
    downloadBlob(
      `${filename}-${todayIsoDate()}.csv`,
      new Blob([content], { type: "text/csv;charset=utf-8" }),
    )
  }

  function exportHtml(
    rows: Array<Array<string | number>>,
    filename: string,
    title: string,
  ) {
    downloadBlob(
      `${filename}-${todayIsoDate()}.html`,
      new Blob([`\uFEFF${reportHtml(title, rows)}`], {
        type: "text/html;charset=utf-8",
      }),
    )
  }

  function exportExcel(
    rows: Array<Array<string | number>>,
    filename: string,
    title: string,
  ) {
    downloadBlob(
      `${filename}-${todayIsoDate()}.xls`,
      new Blob([`\uFEFF${reportHtml(title, rows)}`], {
        type: "application/vnd.ms-excel;charset=utf-8",
      }),
    )
  }

  function printReport(rows: Array<Array<string | number>>, title: string) {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      window.alert(t("printPopupBlocked"))
      return
    }
    printWindow.document.open()
    printWindow.document.write(reportHtml(title, rows))
    printWindow.document.close()
    window.setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.focus()
        printWindow.print()
      }
    }, 250)
  }

  function transactionReportRow(transaction: Transaction): Array<string | number> {
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
    const type = transaction.type ?? customCategory?.type ?? "expense"
    return [
      transaction.date,
      categoryName,
      t(type),
      transaction.amount.toFixed(2),
      transaction.currency,
      transaction.comment,
    ]
  }

  function chronologicalRows(): Array<Array<string | number>> {
    const sorted = [...transactions].sort((first, second) =>
      first.date.localeCompare(second.date) || first.id.localeCompare(second.id),
    )
    return [
        [
          t("date"),
          t("categoryGroupColumn"),
          t("type"),
          t("amount"),
          t("currency"),
          t("descriptionColumn"),
        ],
        ...sorted.map(transactionReportRow),
      ]
  }

  function groupedRows(): Array<Array<string | number>> {
    const groups = new Map<string, { label: string; rows: Array<Array<string | number>>; totals: Map<string, number> }>()
    for (const transaction of transactions) {
      const row = transactionReportRow(transaction)
      const categoryLabel = String(row[1])
      const key = `${categoryLabel.toLocaleLowerCase(language)}|${transaction.category}`
      let group = groups.get(key)
      if (!group) {
        group = { label: categoryLabel, rows: [], totals: new Map() }
        groups.set(key, group)
      }
      group.rows.push(row)
      const typeLabel = String(row[2])
      const totalKey = `${typeLabel}|${transaction.currency}`
      group.totals.set(totalKey, (group.totals.get(totalKey) ?? 0) + transaction.amount)
    }

    const rows: Array<Array<string | number>> = [
      [
        t("date"),
        t("categoryGroupColumn"),
        t("type"),
        t("amount"),
        t("currency"),
        t("descriptionColumn"),
      ],
    ]
    const sortedGroups = [...groups.values()].sort((first, second) =>
      first.label.localeCompare(second.label, LOCALE_BY_LANGUAGE[language]),
    )
    for (const group of sortedGroups) {
      group.rows.sort((first, second) => String(first[0]).localeCompare(String(second[0])))
      rows.push(...group.rows)
      for (const [key, total] of group.totals) {
        const [typeLabel, currency] = key.split("|")
        rows.push(["", `${group.label} — ${t("groupTotal")}`, typeLabel, total.toFixed(2), currency, ""])
      }
      rows.push(["", "", "", "", "", ""])
    }
    return rows
  }

  function handleExport(
    report: "chronological" | "grouped",
    format: "csv" | "html" | "excel" | "print",
  ) {
    const isChronological = report === "chronological"
    const rows = isChronological ? chronologicalRows() : groupedRows()
    const filename = isChronological
      ? "budget-chronological-report"
      : "budget-category-grouped-report"
    const title = isChronological
      ? t("exportChronological")
      : t("exportGrouped")
    if (format === "csv") exportCsv(rows, filename)
    if (format === "html") exportHtml(rows, filename, title)
    if (format === "excel") exportExcel(rows, filename, title)
    if (format === "print") printReport(rows, title)
  }

  return (
    <div className="min-h-svh">
      <Header
        onExport={handleExport}
        onResetStorage={handleResetStorage}
      />
      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
        <TransactionForm
          customCategories={customCategories}
          onAdd={handleAdd}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
        />
        <TransactionList
          customCategories={customCategories}
          transactions={showTrash ? trashedTransactions : transactions}
          isTrash={showTrash}
          trashedCount={trashedTransactions.length}
          onToggleTrash={() => setShowTrash((current) => !current)}
          period={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onDeleteTransaction={showTrash ? handleDeletePermanently : handleDelete}
          onRestoreTransaction={handleRestore}
          onEditTransaction={handleEdit}
          onSelectCategory={setSelectedCategoryDetail}
        />
        <AnalyticsPanel
          className="lg:col-span-2"
          customCategories={customCategories}
          period={selectedPeriod}
          dateRange={dateRange}
          transactions={transactions}
          onSelectCategory={setSelectedCategoryDetail}
        />
      </main>
      {selectedCategoryDetail && (
        <CategoryDetailDialog
          categoryId={selectedCategoryDetail}
          customCategories={customCategories}
          transactions={transactions}
          onClose={() => setSelectedCategoryDetail(null)}
        />
      )}
    </div>
  )
}
