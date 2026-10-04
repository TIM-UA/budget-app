import { useEffect, useState } from "react"
import { fieldClass } from "../constants/ui"
import { useAppSettings } from "../context/AppSettingsContext"
import type { ExchangeRates } from "../types/currency"

type RateDraft = {
  usdPerEur: string
  uahPerEur: string
  uahPerUsd: string
}

function toRateDraft(rates: ExchangeRates): RateDraft {
  return {
    usdPerEur: String(rates.usdPerEur),
    uahPerEur: String(rates.uahPerEur),
    uahPerUsd: String(rates.uahPerEur / rates.usdPerEur),
  }
}

type RatesModalProps = {
  open: boolean
  onClose: () => void
}

export function RatesModal({ open, onClose }: RatesModalProps) {
  const { rates, setRates, t } = useAppSettings()
  const [draft, setDraft] = useState<RateDraft>(() => toRateDraft(rates))

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  if (!open) {
    return null
  }

  function handleSave() {
    const usdPerEur = Number(draft.usdPerEur.replace(",", "."))
    const uahPerEur = Number(draft.uahPerEur.replace(",", "."))
    if (
      Number.isFinite(usdPerEur) &&
      Number.isFinite(uahPerEur) &&
      usdPerEur > 0 &&
      uahPerEur > 0
    ) {
      setRates({ usdPerEur, uahPerEur })
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t("cancel")}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rates-title"
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-700/80 bg-[#1e293b] p-5 shadow-2xl shadow-slate-950/60 sm:p-6"
      >
        <h2 id="rates-title" className="text-lg font-semibold text-slate-50">
          {t("ratesTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{t("ratesHint")}</p>

        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">
              {t("rateUsdLabel")} USD ($)
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={draft.usdPerEur}
              onChange={(event) => {
                const value = event.target.value
                const usdPerEur = Number(value.replace(",", "."))
                setDraft((current) => ({
                  ...current,
                  usdPerEur: value,
                  uahPerUsd:
                    usdPerEur > 0 && Number.isFinite(usdPerEur)
                      ? String(Number(current.uahPerEur.replace(",", ".")) / usdPerEur)
                      : "",
                }))
              }}
              className={fieldClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">
              {t("rateUahLabel")} UAH (₴)
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={draft.uahPerEur}
              onChange={(event) => {
                const value = event.target.value
                const uahPerEur = Number(value.replace(",", "."))
                setDraft((current) => ({
                  ...current,
                  uahPerEur: value,
                  uahPerUsd:
                    uahPerEur > 0 &&
                    Number.isFinite(uahPerEur) &&
                    Number(current.usdPerEur.replace(",", ".")) > 0
                      ? String(
                          uahPerEur /
                            Number(current.usdPerEur.replace(",", ".")),
                        )
                      : "",
                }))
              }}
              className={fieldClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-300">
              {t("rateUsdUahLabel")} UAH (₴)
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={draft.uahPerUsd}
              onChange={(event) => {
                const value = event.target.value
                const uahPerUsd = Number(value.replace(",", "."))
                setDraft((current) => ({
                  ...current,
                  uahPerUsd: value,
                  uahPerEur:
                    Number(current.usdPerEur.replace(",", ".")) > 0 &&
                    Number.isFinite(uahPerUsd) &&
                    uahPerUsd > 0
                      ? String(Number(current.usdPerEur.replace(",", ".")) * uahPerUsd)
                      : current.uahPerEur,
                }))
              }}
              className={fieldClass}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl px-4 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={
              !Number.isFinite(Number(draft.usdPerEur.replace(",", "."))) ||
              !Number.isFinite(Number(draft.uahPerEur.replace(",", "."))) ||
              Number(draft.usdPerEur.replace(",", ".")) <= 0 ||
              Number(draft.uahPerEur.replace(",", ".")) <= 0
            }
            className="h-10 rounded-xl bg-teal-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  )
}
