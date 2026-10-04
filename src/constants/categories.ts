import type { LucideIcon } from "lucide-react"
import {
  Clapperboard,
  HeartPulse,
  Home,
  ShoppingBag,
  TrainFront,
  UtensilsCrossed,
  Wallet,
} from "lucide-react"
import type { BuiltInCategoryId } from "../types/transaction"

export type CategoryMeta = {
  id: BuiltInCategoryId
  icon: LucideIcon
  accent: string
  iconBg: string
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "food",
    icon: UtensilsCrossed,
    accent: "text-amber-300",
    iconBg: "bg-amber-400/15",
  },
  {
    id: "transport",
    icon: TrainFront,
    accent: "text-sky-300",
    iconBg: "bg-sky-400/15",
  },
  {
    id: "housing",
    icon: Home,
    accent: "text-violet-300",
    iconBg: "bg-violet-400/15",
  },
  {
    id: "entertainment",
    icon: Clapperboard,
    accent: "text-fuchsia-300",
    iconBg: "bg-fuchsia-400/15",
  },
  {
    id: "shopping",
    icon: ShoppingBag,
    accent: "text-rose-300",
    iconBg: "bg-rose-400/15",
  },
  {
    id: "health",
    icon: HeartPulse,
    accent: "text-emerald-300",
    iconBg: "bg-emerald-400/15",
  },
  {
    id: "other",
    icon: Wallet,
    accent: "text-slate-300",
    iconBg: "bg-slate-400/15",
  },
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category]),
) as Record<BuiltInCategoryId, CategoryMeta>
