# Amlak App v4 — Group B, Phases 5–10

**Scope:** Search, filter workflow, result sorting, privacy-preserving map discovery, and location selection. Reuses the existing API (no backend migration).

## Phase 5 — Search
- Clearer location header with editable province shortcut; app-native keyboard-friendly input.
- Suggestions are only actual provinces from the authoritative 34-province catalog. Selecting one clears the keyword and stale neighborhood/map filters.
- Existing Buy / Rent / Gharawi shortcuts and saved-search route remain intact.

## Phase 6 — Filters
- The advanced sheet groups property type, location, prices/area, amenities and advertiser.
- It displays a bounded initial province selection and searches the full province catalog by name, including Dari and Pashto.
- Active filters are visible as removable chips. Clearing all restores the preferred province and baseline sort.
- Sort is now exposed on Search instead of being buried in the filter sheet. Price sort visibly scopes to AFN or USD with no FX assumption.

## Phase 7 — Filter rules
- Positive/zero numeric ranges are parsed from Latin, Eastern Arabic and Persian digits and checked for valid finite numbers.
- Minimum cannot exceed maximum for price or area; bedroom/bathroom count must be an integer. Invalid values stay in the sheet with a localized message rather than triggering an API request.
- Changing province or city clears dependent location details; changing province also clears any stale viewport/polygon.

## Phase 8 — Results
- Localized count of currently loaded results (a plus indicates more pages), reliable filter-key stale-result protection, sponsored/organic separation, manual refresh, retries, and paginated load more.
- Existing offline discovery cache remains explicitly stale and never offers sponsored placements or precise map data.

## Phase 9 — Map
- Larger map presentation, better selected-property price preview, consistent skeleton/error states, and conservative Afghanistan coordinate sanity check.
- Map uses only the existing backend's consented exact pins and explicitly warns when pins are capped; approximate coordinates are never fabricated.
- Polygon and viewport searches, list fallback and reset remain operational. Automated clustering is not included.

## Phase 10 — Locations
- Searchable 34-province list, selected indicator, up to five device-local recently selected provinces, and consistent province changes in Search and Home.
- No unverified city/district dataset was introduced; existing free-text city, district and neighborhood inputs remain.

## Verification and limits
- Typecheck, existing integration tests, RTL source checks and Android export through GitHub CI.
- Additional Group B source contracts run as part of pnpm qa:ui.
- Real Android device QA for map gestures, RTL/LTR, slow connections, and back-navigation remains necessary.
- This release neither guarantees property availability nor implies verified ownership, enables payments, or changes server permissions.
