# AmlakLink — Final Completion Step 6: Privacy-Safe Maps & Custom Search Areas

## Delivered in code

- **Custom-drawn map search areas:** mobile Map uses the existing `react-native-maps` integration to let a seeker tap 3–12 points and draw a closed Polygon overlay. User can undo, cancel, or apply the area to the same paginated **List** search. This does not require a paid geocoding API or PostGIS.
- **Actual server polygon filtering:** Search API validates polygon vertices inside Afghanistan (latitude 29–39, longitude 60–75), rejects degenerate, duplicate and self-crossing paths, caps complexity, and runs native PostgreSQL polygon containment **before pagination**. Polygon and rectangular viewport are mutually exclusive. Searching a polygon is not a client-only filter of the first 30 pins.
- **Map/list synchronization:** “Show properties in this map area” uses the visible rectangular bounds as an active List filter, while “Show properties in drawn area” uses the polygon. The Search tab shows a clear map-area indicator and a way to remove it; local SearchFilters are shared with the Map.
- **Privacy:** Only the approved, published, current, non-suspended properties with an advertiser-selected `location.precision="exact"` and shareable coordinates receive markers. Approximate locations never become fabricated neighborhood centroids. Custom-area searches intentionally exclude approximate listings. Contact numbers and street addresses are not returned through the map endpoint; property details continue to hide them until explicit contact action.
- **Honest limits:** Map fetches at most the latest 30 publishable pins and returns `hasMorePins` when there are more. The UI no longer falsely claims `unmappedListings=0`; it states that additional results are available in the paginated List.
- **Usability:** The Map stays open without matching pins so users can change the view/draw the next area. Stale asynchronous map responses are discarded after filter changes. The last selected marker is cleared when results change, and retry/return-to-list controls are always available.
- **Dari/Pashto/English:** Map drawing instructions, buttons, area states and privacy warnings are translated. The listing editor now validates dragged property pins against the same Afghanistan coordinate bounds as tapped/manual coordinates.
- **Saved searches:** A custom polygon can be saved in a search and will constrain alert matches. Rectangular viewport searches remain intentionally unsavable under the existing saved-search business rules; the app explains this instead of silently dropping the filter.
- **No new database migration.** Native PostgreSQL polygon support already exists in PostgreSQL 16 used in CI. No PostGIS or new native Expo dependency.

## Local commands

```powershell
git pull origin main
pnpm check
pnpm dev:api
# Separate terminal:
pnpm dev:mobile
```

Test scenarios: Map→Draw area→3 points→Apply→List results; Map→pan/zoom→Search this map area→List; List→Clear map filter; invalid/self-intersecting polygon; 12-vertex limit; zero pins; zoom outside Kabul; switch language; return to map from results; switch filters mid-request; save polygon with alerts; verify no approximate property gets a marker.

## External requirements still open

- **Tile map provider approval:** Android's map tiles may require a Google Maps SDK project, API key, billing arrangement and compliance with its distribution/attribution terms. This step **does not** provision Google Maps billing or guarantee tile rendering on users' phones. The List and textual filters are intended to remain usable without tiles. Review the actual provider costs and obtain legal/licensing approval before launch.
- **True physical Android QA:** polygon gestures, touch responsiveness, Android map lifecycle, accessibility focus and small phones require real Android/dev-client tests. CI's Android export is not a screenshot/device inspection.
- **Geometry caveats:** this planar polygon uses latitude/longitude for local search; for Afghanistan-scale very large polygons, it is an approximation rather than cadastral/land boundary verification. It must never certify property ownership or geospatial precision.
- **Performance:** DB queries currently operate on moderated JSON revision location coordinates. Monitor map/list response times, index plans, cache and concurrency during the Phase 7 Kabul pilot. PostGIS/spatial indexes are an optional future optimization, not required for the initial 3–12 point custom search.
- **Listing consent:** Exact public pin visibility remains advertiser opt-in; operational QA must show the consent choice clearly, avoid publishing street addresses and honor future changes to location precision.
- **No nearby GPS permissions:** This step does not request the user's live device location or track exact user coordinates.

Before the feature is considered production-ready, validate map provider licensing, drawn polygon/list parity and privacy behavior on real devices.
