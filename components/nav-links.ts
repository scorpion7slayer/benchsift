import { Activity, Boxes, Gauge, RobotArm, Route, Shield, Terminal, type RuneIcon } from "@/components/icons";
import type { Translations } from "@/lib/i18n";

/** Benchmark pages, in the order the header menu and the mobile sheet list them. */
export const BENCHMARK_LINKS: ReadonlyArray<{ href: string; icon: RuneIcon; label: (t: Translations) => string }> = [
  { href: "/agents/coding", icon: Terminal, label: (t) => t.nav.codingAgents },
  { href: "/benchmarks/deepswe", icon: Activity, label: (t) => t.nav.deepSwe },
  { href: "/benchmarks/frontiercode", icon: Gauge, label: (t) => t.nav.frontierCode },
  { href: "/benchmarks/aa-3d", icon: Boxes, label: (t) => t.nav.aa3d },
  { href: "/benchmarks/decision-index", icon: Route, label: (t) => t.nav.decisionIndex },
  { href: "/benchmarks/cyber", icon: Shield, label: (t) => t.nav.cyber },
  { href: "/benchmarks/robotics", icon: RobotArm, label: (t) => t.nav.robotics },
];

export const DATA_SOURCE_LINKS: ReadonlyArray<{ href: string; label: (t: Translations) => string }> = [
  { href: "https://artificialanalysis.ai", label: (t) => t.nav.source },
  { href: "https://openrouter.ai", label: () => "OpenRouter" },
  { href: "https://models.dev/", label: () => "Models.dev" },
  { href: "https://huggingface.co", label: (t) => t.nav.huggingFace },
];
