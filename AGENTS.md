## graphify

Use Graphify automatically for repository code tasks; the user need not invoke it.

The CLI is installed with uv on Windows. In PowerShell, use
`& "$env:USERPROFILE/.local/bin/graphify.exe"` when `graphify` is absent from PATH.

- Before the first source search for a task, refresh the local index with
  `& "$env:USERPROFILE/.local/bin/graphify.exe" extract . --code-only --no-cluster --max-workers 2`.
  This uses cached AST extraction and no LLM/API calls. Run from the repository root.
- Then run `& "$env:USERPROFILE/.local/bin/graphify.exe" query "<focused question with relevant code identifiers>" --budget 1500`.
  Use `path` or `explain` for focused relationships. Read only relevant source ranges
  surfaced by the graph; use targeted `rg` if the graph is incomplete or unavailable.
- Refresh with the same extraction command after changing code, before finishing.
- Keep tool output and answers concise. Do not dump `graph.json`, read the full
  report, or rebuild the full semantic graph for routine tasks. Use the full
  Graphify skill when the user explicitly requests its pipeline or visualization.
- The index covers code only; consult relevant docs directly when needed. It does
  not establish runtime correctness, so verify affected behavior with suitable checks.

## Skill triggering (token-aware)

Default: small/clear tasks (one-file fix, rename, tweak, question) -> no skill, just do it.
Load a skill only when the task is big enough to pay for it:

- UI/layout/styling for a NEW screen or redesign -> `ui-ux-pro-max`. Small CSS fixes: skip.
- New feature/module or architecture change (multi-file) -> short plan (bullets) before coding; ask only if real trade-off.
- Bug not obvious after one read -> root cause first: reproduce, find cause, then fix. No blind retries.
- New business logic / API endpoint -> write or update tests with it when the project has a test setup.
- Multi-step / multi-session task -> keep `STATE.md` (see global token policy); no extra plan files.
- Before declaring done or committing -> always run relevant build/tests and report real output.
- Office files -> `docx` / `pdf` / `xlsx` / `pptx` skill matching the format.
