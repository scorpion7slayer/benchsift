import { useI18n } from "@/lib/i18n";

export function CodingAgentsPageTitle() {
  const { t } = useI18n();
  return (
    <>
      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">{t.agents.title}</h1>
      <p className="text-sm text-muted-foreground max-w-2xl">{t.agents.description}</p>
    </>
  );
}
