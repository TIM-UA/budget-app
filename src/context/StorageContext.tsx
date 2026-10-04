import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { SupabaseClient } from "@supabase/supabase-js"

const APP_STORAGE_PREFIX = "budget-app-"

export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  clear(): void
  setErrorHandler?: (handler: (error: string) => void) => void
}

export class LocalStorageAdapter implements StorageAdapter {
  private readonly userId: string | null

  constructor(userId: string | null = null) {
    this.userId = userId
  }

  private storageKey(key: string): string {
    return this.userId
      ? `${APP_STORAGE_PREFIX}user:${encodeURIComponent(this.userId)}:${key}`
      : key
  }

  getItem(key: string): string | null {
    return localStorage.getItem(this.storageKey(key))
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(this.storageKey(key), value)
  }

  removeItem(key: string): void {
    localStorage.removeItem(this.storageKey(key))
  }

  clear(): void {
    const userPrefix = `${APP_STORAGE_PREFIX}user:`
    const prefix = this.userId
      ? `${userPrefix}${encodeURIComponent(this.userId)}:`
      : APP_STORAGE_PREFIX
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index)
      if (
        key?.startsWith(prefix) &&
        (this.userId !== null || !key.startsWith(userPrefix))
      ) {
        localStorage.removeItem(key)
      }
    }
  }
}

export const CLOUD_STORAGE_KEYS = [
  "budget-app-transactions",
  "budget-app-trashed-transactions",
  "budget-app-custom-categories",
  "budget-app-language",
  "budget-app-rates",
  "budget-app-font-size",
  "budget-app-profile-avatar",
] as const

type CloudDataRow = {
  key: string
  value: unknown
}

export class SupabaseStorageAdapter implements StorageAdapter {
  private readonly localAdapter: LocalStorageAdapter
  private readonly client: SupabaseClient
  private readonly userId: string
  private errorHandler: (error: string) => void = (message) =>
    console.error("Supabase storage sync failed:", message)
  private pendingWrites: Promise<void> = Promise.resolve()

  constructor(
    client: SupabaseClient,
    userId: string,
    onError?: (error: string) => void,
  ) {
    this.client = client
    this.userId = userId
    this.localAdapter = new LocalStorageAdapter(userId)
    if (onError) this.errorHandler = onError
  }

  setErrorHandler(handler: (error: string) => void): void {
    this.errorHandler = handler
  }

  private report(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error)
    this.errorHandler(message)
  }

  async initialize(): Promise<void> {
    try {
      const { data, error } = await this.client
        .from("app_user_data")
        .select("key,value")
        .eq("user_id", this.userId)
      if (error) throw error

      const rows = (data ?? []) as CloudDataRow[]
      if (rows.length > 0) {
        const remoteKeys = new Set(rows.map((row) => row.key))
        for (const key of CLOUD_STORAGE_KEYS) {
          if (!remoteKeys.has(key)) this.localAdapter.removeItem(key)
        }
        for (const row of rows) {
          this.localAdapter.setItem(row.key, JSON.stringify(row.value))
        }
        return
      }

      for (const key of CLOUD_STORAGE_KEYS) {
        const value = this.localAdapter.getItem(key)
        if (value !== null) this.scheduleUpsert(key, value)
      }
    } catch (error) {
      this.report(error)
    }
  }

  getItem(key: string): string | null {
    return this.localAdapter.getItem(key)
  }

  setItem(key: string, value: string): void {
    this.localAdapter.setItem(key, value)
    this.scheduleUpsert(key, value)
  }

  removeItem(key: string): void {
    this.localAdapter.removeItem(key)
    this.pendingWrites = this.pendingWrites
      .then(async () => {
        const { error } = await this.client
          .from("app_user_data")
          .delete()
          .eq("user_id", this.userId)
          .eq("key", key)
        if (error) throw error
      })
      .catch((error: unknown) => this.report(error))
  }

  clear(): void {
    this.localAdapter.clear()
    this.pendingWrites = this.pendingWrites
      .then(async () => {
        const { error } = await this.client
          .from("app_user_data")
          .delete()
          .eq("user_id", this.userId)
        if (error) throw error
      })
      .catch((error: unknown) => this.report(error))
  }

  private scheduleUpsert(key: string, value: string): void {
    this.pendingWrites = this.pendingWrites
      .then(async () => {
        let jsonValue: unknown
        try {
          jsonValue = JSON.parse(value)
        } catch {
          jsonValue = value
        }
        const { error } = await this.client.from("app_user_data").upsert(
          {
            user_id: this.userId,
            key,
            value: jsonValue,
          },
          { onConflict: "user_id,key" },
        )
        if (error) throw error
      })
      .catch((error: unknown) => this.report(error))
  }
}

type StorageContextValue = {
  adapter: StorageAdapter
  userId: string | null
  syncError: string | null
}

const StorageContext = createContext<StorageContextValue | null>(null)

type StorageProviderProps = {
  children: ReactNode
  userId?: string | null
  adapter?: StorageAdapter
  initialSyncError?: string | null
}

export function StorageProvider({
  children,
  userId = null,
  adapter,
  initialSyncError = null,
}: StorageProviderProps) {
  const [syncError, setSyncError] = useState<string | null>(initialSyncError)
  const activeAdapter: StorageAdapter = useMemo(
    () => adapter ?? new LocalStorageAdapter(userId),
    [adapter, userId],
  )
  const value = useMemo(
    () => ({
      adapter: activeAdapter,
      userId,
      syncError,
    }),
    [activeAdapter, userId, syncError],
  )

  useEffect(() => {
    activeAdapter.setErrorHandler?.(setSyncError)
  }, [activeAdapter])

  return (
    <StorageContext.Provider value={value}>{children}</StorageContext.Provider>
  )
}

export function useStorage() {
  const context = useContext(StorageContext)
  if (!context) {
    throw new Error("useStorage must be used within StorageProvider")
  }
  return context
}
