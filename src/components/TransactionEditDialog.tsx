import { useState, type FormEvent } from "react"
import { Check, X } from "lucide-react"
import { CATEGORIES } from "../constants/categories"
import { fieldClass } from "../constants/ui"
import { useAppSettings } from "../context/AppSettingsContext"
import { CATEGORY_KEYS } from "../locales/translations"
import type {
  CategoryId,
  CustomCategory,
  Transaction,
} from "../types/transaction"

type TransactionEditDialogProps = {
  transaction: Transaction
  customCategories: CustomCategory[]
  onClose: () => void
  onSave: (transaction: Transaction) => void
}

export function TransactionEditDialog({
  transaction,
  customCategories,
  onClose,
  onSave,
}: TransactionEditDialogProps) {
  const { t } = useAppSettings()
  const [amount, setAmount] = useState(String(transaction.amount))
  const [date, setDate] = useState(transaction.date)
  const [comment, setComment] = useState(transaction.comment)
  const [category, setCategory] = useState<CategoryId>(transaction.category)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedAmount = Number(amount.replace(",", "."))
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !date) {
      return
    }

    const selectedCustomCategory = customCategories.find(
      (item) => item.id === category,
    )
    onSave({
      ...transaction,
      amount: parsedAmount,
      date,
      comment: comment.trim(),
      category,
      type: selectedCustomCategory?.type ?? "expense",
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4">
      <button
        type="button"
        aria-label={t("cancel")}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-transaction-title"
        className="relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-[#1e293b] p-4 shadow-2xl sm:p-6"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id="edit-transaction-title" className="text-lg font-semibold text-slate-50">
            {t("editTransaction")}
          </h2>
          <button
            type="button"
            aria-label={t("cancel")}
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">{t("amount")}</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">{t("category")}</span>
            <select
              value={category}
              onChange={(event) => {
                const nextCategory = [
                  ...CATEGORIES.map((item) => item.id),
                  ...customCategories.map((item) => item.id),
                ].find((id) => id === event.target.value)
                if (nextCategory) {
                  setCategory(nextCategory)
                }
              }}
              className={fieldClass}
            >
              {CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {t(CATEGORY_KEYS[item.id])}
                </option>
              ))}
              {customCategories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.icon} {item.name}
                </option>
              ))}
            </select>
          </label>

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
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="resize-y rounded-xl border border-slate-600/80 bg-[#0f172a] px-3 py-2.5 text-slate-100 outline-none focus:border-teal-400/70 focus:ring-2 focus:ring-teal-400/20"
            />
          </label>

          <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl px-4 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-teal-400 px-4 text-sm font-semibold text-slate-950 hover:bg-teal-300"
            >
              <Check aria-hidden="true" className="h-4 w-4" />
              {t("saveChanges")}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
