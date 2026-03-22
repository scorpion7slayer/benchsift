# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, **please do not open a public issue**.

Instead, report it privately by opening a [GitHub Security Advisory](https://github.com/scorpion7slayer/nxtaicard/security/advisories/new).

We will acknowledge your report within 48 hours and aim to release a fix as soon as possible.

## Scope

This project is a read-only data aggregator — it fetches public LLM benchmark data and displays it. It does not handle user accounts, payments, or sensitive personal data.

Relevant areas for security review:
- Server-side API key exposure
- Dependency vulnerabilities
- XSS or injection in rendered model data

## Supported Versions

Only the latest version on `main` is actively maintained.
