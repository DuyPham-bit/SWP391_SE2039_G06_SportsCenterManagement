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
