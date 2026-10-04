export const LANGUAGES = ["uk", "en", "de", "ru"] as const
export const FONT_SIZES = ["small", "medium", "large"] as const

export type Language = (typeof LANGUAGES)[number]
export type FontSize = (typeof FONT_SIZES)[number]
