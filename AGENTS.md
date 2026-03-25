# Repository Guidelines

## Project Structure & Module Organization
This repository is an HTTrack mirror of `https://xuangutong.com.cn/`, not a conventional application source tree. `index.html`, `backblue.gif`, and `fade.gif` are HTTrack landing assets at the root. The mirrored site lives under `xuangutong.com.cn/`, with content grouped by area: `stock/` for per-symbol pages such as `600519.html`, `theme/` for concept pages, `article/` for articles, and `ts/` and `zzd/` for report-style sections. `hts-cache/` and `hts-log.txt` are generated crawl artifacts and should be treated as metadata, not hand-maintained source.

## Build, Test, and Development Commands
- `python3 -m http.server 8000`
  Serve the mirror locally from the repository root and review it at `http://localhost:8000/`.
- `open index.html`
  Quick macOS spot check for the mirrored landing page.
- `httrack https://xuangutong.com.cn/ -O xuangutong/`
  Refresh the mirror from the parent directory. Review `hts-log.txt` after each run.

## Coding Style & Naming Conventions
Preserve the mirrored directory layout and exact filenames; local links depend on paths like `xuangutong.com.cn/stock/000001.html`. Avoid broad HTML reformatting because most mirrored pages are minified and diff noise makes reviews harder. Use UTF-8 text. For hand-written Markdown or helper files, prefer short sections, 2-space indentation, and descriptive kebab-case names.

## Testing Guidelines
There is no automated test suite in this snapshot. After any manual edit, preview the affected page locally and verify at least one inbound and one outbound link. After a crawl refresh, compare page counts with `find xuangutong.com.cn -name '*.html' | wc -l` and confirm `hts-log.txt` reports no errors.

## Commit & Pull Request Guidelines
No `.git` directory or project history is included in this workspace, so there is no repository-native commit convention to follow. Use short imperative messages with a scope prefix, for example `mirror: refresh stock pages` or `docs: add AGENTS guide`. Pull requests should state whether the change is a manual edit or a fresh crawl, list the touched paths, and include screenshots only when visible HTML output changed. Highlight changes to `hts-cache/` or `hts-log.txt`, because those files can expose crawl metadata.
