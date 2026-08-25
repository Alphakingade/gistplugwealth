import {
  BookOpen,
  GraduationCap,
  HandCoins,
  LineChart,
  PiggyBank,
  ShoppingBag,
  Smartphone,
  Sparkles,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  PiggyBank,
  HandCoins,
  GraduationCap,
  Smartphone,
  ShoppingBag,
  TrendingUp,
  Wallet,
  LineChart,
  Sparkles,
  BookOpen,
};

export function CategoryIcon({
  name,
  className = "h-5 w-5",
}: {
  name?: string | null;
  className?: string;
}) {
  const Icon = (name && ICONS[name]) || BookOpen;
  return <Icon className={className} aria-hidden="true" />;
}
