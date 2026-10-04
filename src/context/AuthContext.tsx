import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseClient: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null

type AuthContextValue = {
  configured: boolean
  ready: boolean
  session: Session | null
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(supabaseClient === null)

  useEffect(() => {
    if (!supabaseClient) return

    let active = true
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession)
        setReady(true)
      }
    })

    void supabaseClient.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error
        if (active) {
          setSession(data.session)
          setReady(true)
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to restore Supabase session", error)
        if (active) setReady(true)
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabaseClient) throw new Error("Supabase is not configured.")
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabaseClient) throw new Error("Supabase is not configured.")
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data.session !== null
  }, [])

  const signOut = useCallback(async () => {
    if (!supabaseClient) return
    const { error } = await supabaseClient.auth.signOut()
    if (error) throw error
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({
      configured: supabaseClient !== null,
      ready,
      session,
      user: session?.user ?? null,
      signIn,
      signUp,
      signOut,
    }),
    [ready, session, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
