---
name: shadcn
description: Add, update, or compose shadcn/ui components; configure shadcn registries and presets.
user-invocable: false
allowed-tools: Bash(bunx --bun shadcn@latest *)
---

# shadcn/ui in BenchSift

Use this skill for shadcn component or configuration work. The presence of
`components.json` alone does not make it relevant to a task.

## Project context

Read the affected local component and `components.json` as needed. BenchSift
uses Radix primitives, Tailwind v4, Lucide icons, and the `@/` alias; local source
and configuration take precedence over reference examples. Use Bun for CLI
commands, for example `bunx --bun shadcn@latest info` when resolved project
configuration is needed. Do not run discovery commands automatically on load.

Reuse installed components and their variants. Add a component when the requested
UI needs it, not just to match an example. Preserve BenchSift's semantic tokens,
accessibility, and local customizations. Use the existing registry or built-in
`@shadcn` for ordinary additions unless the user specifies another; clarify only
when the choice materially affects the requested result.

## References by task

Read only the relevant reference or section:

- [cli.md](cli.md): registry search, installation, update previews, or preset changes.
- [customization.md](customization.md): shared tokens, variants, or theme changes.
- [rules/composition.md](rules/composition.md): component structure and overlays.
- [rules/forms.md](rules/forms.md): labelled controls and validation states.
- [rules/icons.md](rules/icons.md): icon placement and sizing.
- [rules/styling.md](rules/styling.md): layout and component style conventions.
- [rules/base-vs-radix.md](rules/base-vs-radix.md): primitive API differences when
  adapting examples from another base. BenchSift uses the Radix examples.
- [mcp.md](mcp.md): an available shadcn MCP connection or requested MCP setup.

For unresolved component API questions, use
`bunx --bun shadcn@latest docs <component>` and read the returned documentation.
A local copy or spacing edit does not require fetching the whole component guide.

## Updating components

Preview affected files with `add <component> --dry-run` or `--diff` before
replacing existing code. Merge upstream changes while retaining local behavior.
Use `--overwrite` only when replacement is authorized; an explicit request to
replace those files is sufficient. If a preset change leaves treatment of
customized components unclear, resolve that choice before overwriting them.
Pass preset codes directly to the CLI and preserve the current primitive base.

Complete the requested change and applicable repository validation. Inspect
added files for imports, dependencies, primitive compatibility, and accessibility;
fix issues introduced by the change before reporting the result.
