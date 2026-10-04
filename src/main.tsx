import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import { AppSettingsProvider } from "./context/AppSettingsContext.tsx"
import { AuthProvider, useAuth, supabaseClient } from "./context/AuthContext.tsx"
import {
  StorageProvider,
  SupabaseStorageAdapter,
  type StorageAdapter,
} from "./context/StorageContext.tsx"
import "./index.css"
import { useEffect, useState } from "react"

function AuthenticatedApp() {
  const { ready, user, session } = useAuth()
  const userId = user?.id
  const sessionKey =
    userId && session ? `${userId}:${session.access_token}` : null
  const [cloudStorage, setCloudStorage] = useState<{
    sessionKey: string
    adapter: StorageAdapter
  } | null>(null)
  const [cloudInitError, setCloudInitError] = useState<{
    sessionKey: string
    message: string
  } | null>(null)

  useEffect(() => {
    if (!userId || !sessionKey || !supabaseClient) return

    let active = true
    const adapter = new SupabaseStorageAdapter(supabaseClient, userId, (message) =>
      setCloudInitError({ sessionKey, message }),
    )
    void adapter.initialize().then(() => {
      if (active) setCloudStorage({ sessionKey, adapter })
    })
    return () => {
      active = false
    }
  }, [userId, sessionKey])

  if (!ready || (sessionKey && cloudStorage?.sessionKey !== sessionKey)) {
    return (
      <main className="flex min-h-svh items-center justify-center text-sm text-slate-300">
        Loading your account…
      </main>
    )
  }

  return (
    <StorageProvider
      key={user?.id ?? "guest"}
      userId={user?.id ?? null}
      adapter={
        sessionKey && cloudStorage?.sessionKey === sessionKey
          ? cloudStorage.adapter
          : undefined
      }
      initialSyncError={
        cloudInitError && cloudInitError.sessionKey === sessionKey
          ? cloudInitError.message
          : null
      }
    >
      <AppSettingsProvider key={user?.id ?? "guest"}>
        <App />
      </AppSettingsProvider>
    </StorageProvider>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  </StrictMode>,
)
