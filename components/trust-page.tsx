import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useI18n } from "@/lib/i18n";

const CONTACT_EMAIL = "support@contact.nxtaigen.com";

export function TrustPage({
  kind,
}: {
  kind: "privacy" | "legal" | "accessibility";
}) {
  const { t } = useI18n();
  const copy = t.trust;
  const sections = copy[`${kind}Sections`];
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16"
      >
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {copy[kind]}
          </h1>
          <p className="text-muted-foreground">{copy[`${kind}Lead`]}</p>
        </header>
        {sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {section.body}
            </p>
          </section>
        ))}
        {kind !== "accessibility" && (
          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">{copy.contact}</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {kind === "privacy" ? copy.privacyContact : copy.legalContact}
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex min-h-11 w-fit max-w-full items-center break-all text-sm underline underline-offset-4"
            >
              {CONTACT_EMAIL}
            </a>
          </section>
        )}
        <div className="flex flex-wrap gap-4 text-sm">
          {kind === "privacy" && (
            <a
              href="https://www.autoriteprotectiondonnees.be/citoyen"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              {copy.regulator}
            </a>
          )}
          {kind === "legal" && (
            <a
              href="/licenses/NOTICE.txt"
              className="underline underline-offset-4"
            >
              {copy.licenses}
            </a>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
