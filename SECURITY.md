# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, **please do not open a public issue**.

Report it privately, in French or English, by email to [contact@nxtaigen.com](mailto:contact@nxtaigen.com) or through a [GitHub Security Advisory](https://github.com/scorpion7slayer/benchsift/security/advisories/new). An advisory keeps the report, discussion and fix in one private thread.

These contacts are also published in [`/.well-known/security.txt`](https://benchsift.nxtaigen.com/.well-known/security.txt).

We will acknowledge your report within 48 hours and aim to release a fix as soon as possible.

## Scope

This project is a read-only data aggregator — it fetches public LLM benchmark data and displays it. It does not handle user accounts, payments, or sensitive personal data.

Relevant areas for security review:

- Server-side API key exposure
- Dependency vulnerabilities
- XSS or injection in rendered model data

## Supported Versions

Only the latest version on `main` is actively maintained.
