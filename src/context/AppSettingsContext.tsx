import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { DEFAULT_EXCHANGE_RATES } from "../constants/rates"
import {
  translations,
  type TranslationKey,
} from "../locales/translations"
import type { CurrencyCode, ExchangeRates } from "../types/currency"
import type { FontSize, Language } from "../types/locale"
import { FONT_SIZES, LANGUAGES } from "../types/locale"
import { toBaseAmount } from "../utils/convert"
import { useStorage } from "./StorageContext"

const LANGUAGE_STORAGE_KEY = "budget-app-language"
const RATES_STORAGE_KEY = "budget-app-rates"
const FONT_SIZE_STORAGE_KEY = "budget-app-font-size"

type TranslateVars = Record<string, string | number>

type AppSettingsValue = {
  language: Language
  setLanguage: (language: Language) => void
  fontSize: FontSize
  setFontSize: (fontSize: FontSize) => void
  rates: ExchangeRates
  setRates: (rates: ExchangeRates) => void
  resetSettings: () => void
  t: (key: TranslationKey, vars?: TranslateVars) => string
  convertToBase: (amount: number, currency: CurrencyCode) => number
}

const AppSettingsContext = createContext<AppSettingsValue | null>(null)

function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value)
}

function isFontSize(value: string): value is FontSize {
  return (FONT_SIZES as readonly string[]).includes(value)
}

function readLanguage(storage: ReturnType<typeof useStorage>): Language {
  try {
    const stored = storage.adapter.getItem(LANGUAGE_STORAGE_KEY)
    if (stored && isLanguage(stored)) {
      return stored
    }
  } catch {
    /* ignore */
  }
  return "uk"
}

function readFontSize(storage: ReturnType<typeof useStorage>): FontSize {
  try {
    const stored = storage.adapter.getItem(FONT_SIZE_STORAGE_KEY)
    if (stored && isFontSize(stored)) {
      return stored
    }
  } catch {
    /* ignore */
  }
  return "medium"
}

function readRates(storage: ReturnType<typeof useStorage>): ExchangeRates {
  try {
    const stored = storage.adapter.getItem(RATES_STORAGE_KEY)
    if (!stored) {
      return DEFAULT_EXCHANGE_RATES
    }
    const parsed = JSON.parse(stored) as Partial<ExchangeRates>
    const usdPerEur = Number(parsed.usdPerEur)
    const uahPerEur = Number(parsed.uahPerEur)
    if (usdPerEur > 0 && uahPerEur > 0) {
      return { usdPerEur, uahPerEur }
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_EXCHANGE_RATES
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const storage = useStorage()
  const [language, setLanguageState] = useState<Language>(() => readLanguage(storage))
  const [fontSize, setFontSizeState] = useState<FontSize>(() => readFontSize(storage))
  const [rates, setRatesState] = useState<ExchangeRates>(() => readRates(storage))

  useEffect(() => {
    document.documentElement.lang = language
    try {
      storage.adapter.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch {
      /* Keep settings usable if persistence is unavailable. */
    }
  }, [language, storage.adapter])

  useEffect(() => {
    document.documentElement.dataset.fontSize = fontSize
    try {
      storage.adapter.setItem(FONT_SIZE_STORAGE_KEY, fontSize)
    } catch {
      /* ignore */
    }
  }, [fontSize, storage.adapter])

  useEffect(() => {
    try {
      storage.adapter.setItem(RATES_STORAGE_KEY, JSON.stringify(rates))
    } catch {
      /* Keep settings usable if persistence is unavailable. */
    }
  }, [rates, storage.adapter])

  const resetSettings = useCallback(() => {
    setLanguageState("uk")
    setFontSizeState("medium")
    setRatesState(DEFAULT_EXCHANGE_RATES)
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: TranslateVars) => {
      let value = translations[language][key]
      if (vars) {
        for (const [name, replacement] of Object.entries(vars)) {
          value = value.replaceAll(`{${name}}`, String(replacement))
        }
      }
      return value
    },
    [language],
  )

  const convertToBase = useCallback(
    (amount: number, currency: CurrencyCode) => toBaseAmount(amount, currency, rates),
    [rates],
  )

  const value = useMemo(
    () => ({
      language,
      setLanguage: setLanguageState,
      fontSize,
      setFontSize: setFontSizeState,
      rates,
      setRates: setRatesState,
      resetSettings,
      t,
      convertToBase,
    }),
    [language, fontSize, rates, t, convertToBase, resetSettings],
  )

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  )
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext)
  if (!context) {
    throw new Error("useAppSettings must be used within AppSettingsProvider")
  }
  return context
}
