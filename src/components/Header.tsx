import { useEffect, useRef, useState } from "react"
import {
  Banknote,
  FileSpreadsheet,
  FileText,
  Printer,
  Settings,
  Upload,
  UserRound,
  Wallet,
} from "lucide-react"
import { LANGUAGE_LABELS } from "../locales/translations"
import { useAppSettings } from "../context/AppSettingsContext"
import { useStorage } from "../context/StorageContext"
import { useAuth } from "../context/AuthContext"
import { LANGUAGES } from "../types/locale"
import { AuthModal } from "./AuthModal"
import { RatesModal } from "./RatesModal"

type HeaderProps = {
  onExport: (
    report: "chronological" | "grouped",
    format: "csv" | "html" | "excel" | "print",
  ) => void
  onResetStorage: () => boolean
}

const PROFILE_AVATAR_STORAGE_KEY = "budget-app-profile-avatar"
const PROFILE_EMOJIS = ["👤", "😀", "🐱", "🐼", "🦊", "🐸", "🌟", "💰", "🌿", "🚀"]

function readProfileAvatar(storage: ReturnType<typeof useStorage>): string {
  try {
    return storage.adapter.getItem(PROFILE_AVATAR_STORAGE_KEY) ?? ""
  } catch {
    return ""
  }
}

export function Header({
  onExport,
  onResetStorage,
}: HeaderProps) {
  const { fontSize, language, setFontSize, setLanguage, rates, resetSettings, t } = useAppSettings()
  const storage = useStorage()
  const { user, signOut } = useAuth()
  const [ratesOpen, setRatesOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [exportFormatsOpen, setExportFormatsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [avatar, setAvatar] = useState(() => readProfileAvatar(storage))
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const accountAvatar =
    typeof user?.user_metadata.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : ""

  useEffect(() => {
    try {
      if (avatar) {
        storage.adapter.setItem(PROFILE_AVATAR_STORAGE_KEY, avatar)
      } else {
        storage.adapter.removeItem(PROFILE_AVATAR_STORAGE_KEY)
      }
    } catch {
      window.alert(t("avatarStorageError"))
    }
  }, [avatar, t, storage.adapter])

  function handleAvatarFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      window.alert(t("avatarFileError"))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result)
      }
    }
    reader.onerror = () => window.alert(t("avatarFileError"))
    reader.readAsDataURL(file)
  }

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-800/80 bg-[#0f172a]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {storage.syncError && (
            <p
              role="alert"
              className="order-last w-full rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
            >
              {t("cloudSyncError", { error: storage.syncError })}
            </p>
          )}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-400/15 text-teal-300 ring-1 ring-teal-300/20">
              <Wallet className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-medium tracking-wide text-slate-400">
                {t("appTagline")}
              </p>
              <h1 className="text-lg font-semibold tracking-tight text-slate-50">
                {t("appTitle")}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex rounded-xl border border-slate-700/80 bg-[#1e293b] p-0.5"
              role="group"
              aria-label={t("language")}
            >
              {LANGUAGES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLanguage(code)}
                  className={`rounded-lg px-2 py-1.5 text-xs font-semibold tracking-wide transition ${
                    language === code
                      ? "bg-teal-400 text-slate-950"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {LANGUAGE_LABELS[code]}
                </button>
              ))}
            </div>

            <label className="sr-only" htmlFor="font-size-setting">
              {t("fontSize")}
            </label>
            <select
              id="font-size-setting"
              aria-label={t("fontSize")}
              value={fontSize}
              onChange={(event) => {
                const value = event.target.value
                if (value === "small" || value === "medium" || value === "large") {
                  setFontSize(value)
                }
              }}
              className="h-10 max-w-28 rounded-xl border border-slate-700/80 bg-[#1e293b] px-2 text-xs text-slate-200 outline-none focus:border-teal-400/70"
            >
              <option value="small">{t("smallFont")}</option>
              <option value="medium">{t("mediumFont")}</option>
              <option value="large">{t("largeFont")}</option>
            </select>

            <button
              type="button"
              onClick={() => setRatesOpen(true)}
              aria-label={t("ratesButton")}
              title={t("ratesButton")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-[#1e293b] px-2.5 py-1.5 text-left transition hover:border-slate-600 hover:bg-[#243044]"
            >
              <Banknote className="h-4 w-4 text-teal-300" />
              <span className="hidden sm:block">
                <span className="block text-xs font-semibold text-slate-100">
                  {t("ratesButton")}
                </span>
                <span className="block text-[0.6875rem] text-slate-400">
                  1 € = {rates.usdPerEur} $ · {rates.uahPerEur} ₴
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => onExport("chronological", "csv")}
              aria-label={t("exportChronological")}
              title={t("exportChronological")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-[#1e293b] px-2.5 text-sm text-slate-200 transition hover:border-teal-400/60 hover:text-teal-100 sm:px-3"
            >
              <FileSpreadsheet aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">{t("exportChronological")}</span>
            </button>

            <button
              type="button"
              onClick={() => onExport("grouped", "csv")}
              aria-label={t("exportGrouped")}
              title={t("exportGrouped")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-[#1e293b] px-2.5 text-sm text-slate-200 transition hover:border-teal-400/60 hover:text-teal-100 sm:px-3"
            >
              <FileSpreadsheet aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">{t("exportGrouped")}</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setExportFormatsOpen((open) => !open)}
                aria-label={t("moreExportFormats")}
                aria-expanded={exportFormatsOpen}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-[#1e293b] px-2.5 text-sm text-slate-200 transition hover:border-teal-400/60 hover:text-teal-100 sm:px-3"
              >
                <FileText aria-hidden="true" className="h-4 w-4" />
                <span className="hidden sm:inline">{t("moreExportFormats")}</span>
              </button>
              {exportFormatsOpen && (
                <div className="absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] space-y-4 rounded-2xl border border-slate-700 bg-[#1e293b] p-4 shadow-2xl">
                  {([
                    ["chronological", t("exportChronological")],
                    ["grouped", t("exportGrouped")],
                  ] as const).map(([report, label]) => (
                    <section key={report}>
                      <h2 className="mb-2 text-sm font-semibold text-slate-100">
                        {label}
                      </h2>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setExportFormatsOpen(false)
                            onExport(report, "html")
                          }}
                          className="rounded-lg border border-slate-600 px-2 py-2 text-xs text-slate-200 hover:border-teal-400/70"
                        >
                          HTML
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setExportFormatsOpen(false)
                            onExport(report, "excel")
                          }}
                          className="rounded-lg border border-slate-600 px-2 py-2 text-xs text-slate-200 hover:border-teal-400/70"
                        >
                          Excel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setExportFormatsOpen(false)
                            onExport(report, "print")
                          }}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-600 px-2 py-2 text-xs text-slate-200 hover:border-teal-400/70"
                        >
                          <Printer aria-hidden="true" className="h-3 w-3" />
                          {t("printPdf")}
                        </button>
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label={t("settings")}
              title={t("settings")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-[#1e293b] px-2.5 text-sm text-slate-200 transition hover:border-teal-400/60 hover:text-teal-100 sm:px-3"
            >
              <Settings aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">{t("settings")}</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-label={t("profile")}
                aria-expanded={profileOpen}
                title={t("profile")}
                className="flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-[#1e293b] px-2 py-1.5 pr-3 text-left"
              >
                <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-slate-700/70 text-slate-200">
                  {accountAvatar || avatar.startsWith("data:image/") ? (
                    <img src={accountAvatar || avatar} alt="" className="h-full w-full object-cover" />
                  ) : avatar ? (
                    <span className="text-xl" aria-hidden="true">{avatar}</span>
                  ) : (
                    <UserRound className="h-4 w-4" />
                  )}
                </span>
                <span className="hidden sm:block">
                  <span className="block max-w-48 truncate text-sm font-medium text-slate-100">
                    {user?.email ?? t("guest")}
                  </span>
                  <span className="block text-xs text-slate-400">{t("profile")}</span>
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-slate-700 bg-[#1e293b] p-4 shadow-2xl">
                  {!user && (
                    <>
                      <p className="mb-3 text-sm font-semibold text-slate-100">{t("profileAvatar")}</p>
                      <div className="grid grid-cols-5 gap-2">
                        {PROFILE_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            aria-label={`${t("profileAvatar")} ${emoji}`}
                            onClick={() => {
                              setAvatar(emoji)
                              setProfileOpen(false)
                            }}
                            className={`rounded-lg p-1.5 text-xl hover:bg-slate-700 ${avatar === emoji ? "bg-teal-400/20 ring-1 ring-teal-300" : ""}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          handleAvatarFile(event.currentTarget.files?.[0])
                          event.currentTarget.value = ""
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:border-teal-400/70"
                      >
                        <Upload aria-hidden="true" className="h-4 w-4" />
                        {t("chooseAvatar")}
                      </button>
                    </>
                  )}
                  {user ? (
                    <button
                      type="button"
                      onClick={() => {
                        void signOut().catch((error: unknown) => {
                          window.alert(
                            error instanceof Error
                              ? error.message
                              : t("authRequestFailed"),
                          )
                        })
                        setProfileOpen(false)
                      }}
                      className="mt-3 h-10 w-full rounded-lg border border-slate-600 px-3 text-sm text-slate-200 hover:border-rose-400/70 hover:text-rose-200"
                    >
                      {t("logout")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false)
                        setAuthOpen(true)
                      }}
                      className="mt-3 h-10 w-full rounded-lg bg-teal-400 px-3 text-sm font-semibold text-slate-950 hover:bg-teal-300"
                    >
                      {t("login")} / {t("signup")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {ratesOpen && (
        <RatesModal open={ratesOpen} onClose={() => setRatesOpen(false)} />
      )}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t("close")}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={() => setSettingsOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-[#1e293b] p-5 shadow-2xl"
          >
            <h2 id="settings-title" className="text-lg font-semibold text-slate-50">
              {t("settings")}
            </h2>
            <p className="mt-2 text-sm text-slate-400">{t("resetDataHint")}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="h-10 rounded-lg px-3 text-sm text-slate-300 hover:bg-slate-700"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={() => setResetConfirmOpen(true)}
                className="h-10 rounded-lg bg-rose-500 px-3 text-sm font-semibold text-white hover:bg-rose-400"
              >
                {t("resetStorage")}
              </button>
            </div>
          </section>
        </div>
      )}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label={t("cancel")}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setResetConfirmOpen(false)}
          />
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reset-storage-title"
            className="relative w-full max-w-sm rounded-2xl border border-rose-400/30 bg-[#1e293b] p-5 shadow-2xl"
          >
            <h2 id="reset-storage-title" className="text-lg font-semibold text-slate-50">
              {t("resetStorage")}
            </h2>
            <p className="mt-2 text-sm text-slate-300">{t("resetDataConfirm")}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="h-10 rounded-lg px-3 text-sm text-slate-300 hover:bg-slate-700"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onResetStorage()) {
                    resetSettings()
                    setAvatar("")
                    setResetConfirmOpen(false)
                    setSettingsOpen(false)
                  }
                }}
                className="h-10 rounded-lg bg-rose-500 px-3 text-sm font-semibold text-white hover:bg-rose-400"
              >
                {t("resetStorage")}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
