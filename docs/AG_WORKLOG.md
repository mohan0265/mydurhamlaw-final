# Antigravity Worklog (AG_WORKLOG.md)

## 2026-01-30 - Repository Migration & Cleanup

### Changes

- **Repository Rename**: Local repository folder renamed to `Caseway-Final`.
- **Path Cleanup**:
  - Fixed hard-coded absolute paths in `commit_fixes.py` and `AUTOFIX.py` to use relative/portable paths.
  - Updated `README.md` quick start instructions to reflect the new folder name.
  - Updated `ARCHITECTURE_OVERVIEW.md` to use relative markdown links instead of absolute `file:///` URIs.

### 🛡️ Brand Lock

- **Primary Brand**: **Caseway**
- **Legacy Brand**: MyDurhamLaw
- **Rule**: Never mass-replace "Caseway" with "MyDurhamLaw". "Caseway" is the active brand for the university deployment.

### 🚧 Known Blockers

- **Lecture AI Processing**: AI processing for lectures frequently hangs on Netlify due to the 10s/26s serverless function timeout.
- **Fix Required**: Migrate processing to **Netlify Background Functions** and implement frontend polling with a proper stop condition.
