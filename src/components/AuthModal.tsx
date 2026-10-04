import { useState, type FormEvent } from "react"
import { useAuth } from "../context/AuthContext"
import { useAppSettings } from "../context/AppSettingsContext"

type AuthMode = "login" | "signup"

type AuthModalProps = {
  open: boolean
  onClose: () => void
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { configured, signIn, signUp } = useAuth()
  const { t } = useAppSettings()
  const [mode, setMode] = useState<AuthMode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState("")

  if (!open) return null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setFeedback("")
    try {
      if (mode === "login") {
        await signIn(email.trim(), password)
        onClose()
      } else {
        const hasSession = await signUp(email.trim(), password)
        setFeedback(hasSession ? t("signupComplete") : t("signupCheckEmail"))
        if (hasSession) onClose()
      }
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : t("authRequestFailed"),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t("close")}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="relative w-full max-w-md rounded-3xl border border-slate-700 bg-[#1e293b] p-5 shadow-2xl sm:p-6"
      >
        <h2 id="auth-title" className="text-xl font-semibold text-slate-50">
          {t("account")}
        </h2>
        <div className="mt-4 grid grid-cols-2 rounded-xl border border-slate-700 bg-slate-900/60 p-1">
          {(["login", "signup"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={mode === tab}
              onClick={() => {
                setMode(tab)
                setFeedback("")
              }}
              className={`h-9 rounded-lg text-sm font-medium ${
                mode === tab
                  ? "bg-teal-400 text-slate-950"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {t(tab)}
            </button>
          ))}
        </div>

        {!configured ? (
          <p role="status" className="mt-4 rounded-xl bg-amber-400/10 p-3 text-sm text-amber-200">
            {t("supabaseNotConfigured")}
          </p>
        ) : (
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-300">{t("email")}</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-600/80 bg-[#0f172a] px-3 text-slate-100 outline-none focus:border-teal-400/70"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-300">{t("password")}</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-600/80 bg-[#0f172a] px-3 text-slate-100 outline-none focus:border-teal-400/70"
              />
            </label>
            {feedback && (
              <p role="status" className="break-words text-sm text-amber-200">
                {feedback}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="h-11 w-full rounded-xl bg-teal-400 px-4 text-sm font-semibold text-slate-950 hover:bg-teal-300 disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? t("pleaseWait") : t(mode)}
            </button>
          </form>
        )}

        <div className="mt-5 border-t border-slate-700 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-full rounded-xl border border-slate-600 px-4 text-sm text-slate-200 hover:border-teal-400/70 hover:text-teal-100"
          >
            {t("continueAsGuest")}
          </button>
        </div>
      </section>
    </div>
  )
}
