import { useState, type FormEvent } from "react"
import { Plus, Trash2 } from "lucide-react"
import { CATEGORIES } from "../constants/categories"
import { CURRENCIES } from "../constants/currencies"
import { fieldClass } from "../constants/ui"
import { useAppSettings } from "../context/AppSettingsContext"
import { CATEGORY_KEYS } from "../locales/translations"
import type { CurrencyCode } from "../types/currency"
import type {
  CategoryId,
  CustomCategory,
  Transaction,
  TransactionType,
} from "../types/transaction"
import { todayIsoDate } from "../utils/format"

type TransactionFormProps = {
  customCategories: CustomCategory[]
  onAdd: (transaction: Omit<Transaction, "id">) => void
  onAddCategory: (category: Omit<CustomCategory, "id">) => CustomCategory
  onDeleteCategory: (id: CustomCategory["id"]) => boolean
}

export function TransactionForm({
  customCategories,
  onAdd,
  onAddCategory,
  onDeleteCategory,
}: TransactionFormProps) {
  const { t } = useAppSettings()
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState<CurrencyCode>("EUR")
  const [category, setCategory] = useState<CategoryId>("food")
  const [date, setDate] = useState(todayIsoDate())
  const [comment, setComment] = useState("")
  const [categoryCreatorOpen, setCategoryCreatorOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryIcon, setNewCategoryIcon] = useState("✨")
  const [newCategoryType, setNewCategoryType] = useState<TransactionType>("expense")

  const normalizedCategoryName = newCategoryName.trim().toLocaleLowerCase()
  const categoryNameTaken = customCategories.some(
    (item) => item.name.trim().toLocaleLowerCase() === normalizedCategoryName,
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedAmount = Number(amount.replace(",", "."))
    if (!parsedAmount || parsedAmount <= 0) {
      return
    }

    const selectedCustomCategory = customCategories.find((item) => item.id === category)
    onAdd({
      amount: parsedAmount,
      currency,
      category,
      type: selectedCustomCategory?.type ?? "expense",
      date,
      comment: comment.trim(),
    })

    setAmount("")
    setComment("")
    setDate(todayIsoDate())
    setCategory("food")
    setCurrency("EUR")
  }

  function handleCreateCategory() {
    const name = newCategoryName.trim()
    const icon = newCategoryIcon.trim()
    if (!name || !icon || categoryNameTaken) {
      return
    }

    const created = onAddCategory({ name, icon, type: newCategoryType })
    setCategory(created.id)
    setNewCategoryName("")
    setNewCategoryIcon("✨")
    setCategoryCreatorOpen(false)
  }

  return (
    <section className="min-w-0 rounded-3xl border border-slate-700/70 bg-[#1e293b] p-5 shadow-xl shadow-slate-950/40 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-50">{t("newTransaction")}</h2>
        <p className="mt-1 text-sm text-slate-400">{t("newTransactionHint")}</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-[minmax(0,1fr)_7.5rem]">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">{t("amount")}</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">{t("currency")}</span>
            <select
              value={currency}
              onChange={(event) => {
                const nextCurrency = CURRENCIES.find(
                  (item) => item.code === event.target.value,
                )
                if (nextCurrency) {
                  setCurrency(nextCurrency.code)
                }
              }}
              className={fieldClass}
            >
              {CURRENCIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code} {item.symbol}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="min-w-0">
          <legend className="mb-2 text-sm font-medium text-slate-300">
            {t("category")}
          </legend>
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
            {CATEGORIES.map((item) => {
              const Icon = item.icon
              const selected = category === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  aria-pressed={selected}
                  className={`flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-sm transition ${
                    selected
                      ? "border-teal-400/60 bg-teal-400/10 text-slate-50"
                      : "border-slate-700 bg-[#0f172a] text-slate-300 hover:border-slate-500"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.iconBg} ${item.accent}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 whitespace-normal break-words leading-tight">
                    {t(CATEGORY_KEYS[item.id])}
                  </span>
                  <span className="shrink-0 rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[0.5625rem] leading-tight text-rose-300">
                    {t("expense")}
                  </span>
                </button>
              )
            })}
            {customCategories.map((item) => {
              const selected = category === item.id
              return (
                <div
                  key={item.id}
                  className="flex min-w-0 items-stretch gap-1"
                >
                  <button
                    type="button"
                    onClick={() => setCategory(item.id)}
                    aria-pressed={selected}
                    className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-sm transition ${
                      selected
                        ? "border-teal-400/60 bg-teal-400/10 text-slate-50"
                        : "border-slate-700 bg-[#0f172a] text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-400/10 text-lg">
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1 whitespace-normal break-words leading-tight">
                      {item.name}
                    </span>
                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[0.5625rem] leading-tight ${item.type === "income" ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                      {t(item.type)}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={t("deleteCategoryNamed", { category: item.name })}
                    title={t("deleteCategory")}
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      if (onDeleteCategory(item.id) && selected) {
                        setCategory("other")
                      }
                    }}
                    className="rounded-lg px-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => setCategoryCreatorOpen((open) => !open)}
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-600 px-3 text-sm text-slate-200 transition hover:border-teal-400/70 hover:text-teal-200"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            {t("addCustomCategory")}
          </button>

          {categoryCreatorOpen && (
            <div className="mt-3 space-y-3 rounded-xl border border-slate-700 bg-[#0f172a] p-3">
              <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
                <label className="flex min-w-0 flex-col gap-1.5">
                  <span className="text-xs font-medium text-slate-300">{t("categoryName")}</span>
                  <input
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    maxLength={32}
                    placeholder={t("categoryNamePlaceholder")}
                    aria-invalid={categoryNameTaken}
                    className={fieldClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-slate-300">{t("categoryIcon")}</span>
                  <input
                    value={newCategoryIcon}
                    onChange={(event) => setNewCategoryIcon(event.target.value)}
                    maxLength={8}
                    aria-label={t("categoryIcon")}
                    className={`${fieldClass} px-2 text-center text-xl`}
                  />
                </label>
              </div>
              {categoryNameTaken && (
                <p className="text-xs text-rose-300">{t("categoryNameUsed")}</p>
              )}
              <div className="grid grid-cols-2 gap-2" role="group" aria-label={t("categoryType")}>
                {(["expense", "income"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={newCategoryType === type}
                    onClick={() => setNewCategoryType(type)}
                    className={`min-h-9 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                      newCategoryType === type
                        ? type === "income"
                          ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                          : "border-rose-400/50 bg-rose-500/15 text-rose-200"
                        : type === "income"
                          ? "border-emerald-500/20 text-emerald-300/70 hover:bg-emerald-500/10"
                          : "border-rose-500/20 text-rose-300/70 hover:bg-rose-500/10"
                    }`}
                  >
                    {t(type)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={!newCategoryName.trim() || !newCategoryIcon.trim() || categoryNameTaken}
                onClick={handleCreateCategory}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-teal-400 px-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                {t("createCategory")}
              </button>
            </div>
          )}
        </fieldset>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-300">{t("date")}</span>
          <input
            type="date"
            required
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-300">{t("comment")}</span>
          <textarea
            rows={3}
            placeholder={t("commentPlaceholder")}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="resize-none rounded-xl border border-slate-600/80 bg-[#0f172a] px-3 py-2.5 text-slate-100 outline-none placeholder:text-slate-500 focus:border-teal-400/70 focus:ring-2 focus:ring-teal-400/20"
          />
        </label>

        <button
          type="submit"
          className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-400 font-semibold text-slate-950 transition hover:bg-teal-300"
        >
          <Plus className="h-4 w-4" />
          {t("add")}
        </button>
      </form>
    </section>
  )
}
