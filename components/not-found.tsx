import { Link } from "@tanstack/react-router";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

// Rendered when a route throws `notFound()` (e.g. an unknown model slug).
export function NotFound() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] gap-4 p-8 text-center">
      <Brain className="size-10 text-muted-foreground" />
      <div>
        <h2 className="text-lg font-semibold">404</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          {t.error.description}
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link to="/">{t.nav.back}</Link>
      </Button>
    </div>
  );
}
