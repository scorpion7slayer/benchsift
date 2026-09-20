# Privacy and legal readiness — Belgium

This is implementation guidance, not a claim of legal compliance or immunity.
The publisher identified himself as Théo Darville and confirmed that BenchSift
is a free personal solo project in Belgium, without a company. The site runs on
an OVH VPS in Gravelines (GRA), France, and uses Rybbit analytics. The confirmed
public contact is support@contact.nxtaigen.com, linked from the legal and privacy
pages. The publisher confirmed Resend receiving is enabled for contact.nxtaigen.com;
no test email was sent. No postal address or hosting legal entity has been invented. The publisher also confirmed that Rybbit runs on this same VPS.
The publisher reports the default Rybbit configuration, plus 30-day retention
for technical logs and backups. Rybbit documents a default 30-day replay TTL;
this must not be extended to all analytics events. Visit-statistics retention
still needs verification. These configuration statements are publisher-provided,
not an inspection of the deployed tables or backup jobs.

Implemented: replacement of unconditional analytics loading with opt-in Rybbit;
removal of the duplicate analytics endpoint and obsolete notice banner; local fonts and logos; French/English privacy, legal and accessibility
pages; functional preference explanations; source/licence attribution; no-referrer,
nosniff, frame restrictions and camera/microphone/geolocation restrictions.

The pages deliberately disclose the remaining gaps. Before claiming compliance:

1. Determine applicable Belgian publisher identification/contact duties for this
   activity, and GDPR controller transparency/contact requirements. The publisher
   is named in the legal and privacy pages with the confirmed contact email.
   Postal identification requirements remain to be assessed; no postal address
   was provided. Free access and solo development are not treated as proof of
   exemption from all transparency duties.
2. Check the OVH contract for the actual hosting entity, subprocessors,
   processing terms and any international transfers. Dokploy is deployment software.
3. Confirm that proxy, container, OVH logs and backup expiry enforce the stated
   30-day periods. Review data categories, purpose, legal basis, access control,
   deletion and the rights-request procedure. The application cannot establish
   these infrastructure facts from source alone.
4. Verify permission to republish each upstream dataset under the relevant API
   terms. The repository MIT licence does not license third-party data/trademarks.
5. Determine whether Belgian/EU accessibility legislation applies to this service.
   WCAG 2.2 AA is the engineering target; there is no full conformance declaration.
6. Confirm the Rybbit processing terms, retention of statistics
   and replays, access permissions, deletion procedures and any transfers. Public
   settings checked on 15 September 2026 enable replay, web vitals, errors,
   outbound links, URL parameters, initial pageviews, SPA navigation, button
   clicks, copies and form interactions. The bilingual consent discloses this
   scope. Input values are explicitly masked in replays. This does not establish
   that every payload or URL is free of personal data. Consider disabling replay,
   URL parameters and unnecessary autocapture in Rybbit site settings to minimise
   collection. No remote settings were changed by this implementation.

The versioned choice cookie lasts 180 days for both refusal and acceptance.
Nothing contacts Rybbit in the browser before acceptance. A same-origin local
storage signal propagates changes across tabs; focus/pageshow/visibility checks
and a 30-second check also revalidate the cookie and its expiry. On withdrawal,
the application persists refusal and reloads to unload the SDK and its listeners;
removing a script element alone cannot do this. The old notice is never treated
as consent. A footer dialog provides withdrawal on every page. Browser opt-out
flags are respected. Analytics only load on the HTTPS production hostname, so
previews do not generate traffic. Retention of the choice is not retention of
analytics data. Collection changes require revising the disclosure and consent
cookie version.

Primary references checked for this work:
- https://www.cnil.fr/fr/cookies-et-autres-traceurs/que-dit-la-loi
- https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en
- https://www.autoriteprotectiondonnees.be/citoyen
- https://eur-lex.europa.eu/eli/reg/2016/679/oj (Articles 12–14 and 15–22)

Rybbit integration reference: https://rybbit.com/docs/script

Retention verification: Rybbit's self-hosting documentation describes a default
30-day TTL for session replay, configurable in ClickHouse. This is not proof of
this installation's effective retention and does not establish statistics or
backup retention. Check the deployed version and actual table definitions first:

```sql
SELECT name, create_table_query
FROM system.tables
WHERE database = 'analytics'
  AND name IN ('events', 'session_replay_events', 'session_replay_metadata');
```

This query is read-only and has not been executed against the VPS. After choosing
purpose-appropriate periods, apply and verify the TTLs and backup expiry through
the deployment administration; changes may delete historical data. Update the
public policy only once the effective periods are established. Reference:
https://rybbit.com/docs/managing-your-installation#edit-session-replay-retention-policy
