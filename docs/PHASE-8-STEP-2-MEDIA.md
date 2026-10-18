# Phase 8 / Step 2 — Room-Labeled Property Media

## Delivered

- Eleven structured, localized photo categories: living room, bedroom, kitchen, bathroom, exterior, entrance, balcony, parking, floor plan, land/plot and other.
- Optional **100-character caption per image**, entered in the listing photo wizard, with localized privacy reminder. The first image remains the cover; owners can reorder the cover and remove images from the draft. Image limit remains 20.
- Metadata is embedded in the **moderated listing revision JSON** (not on the uploaded media row). A new owner edit does **not** change the public photo labels/captions until staff approve its revision. Moderators see the proposed category and caption alongside each photo in the review queue.
- Existing published and draft listings remain compatible: older revisions without photoDetails are interpreted as `room:other` and empty caption. **No SQL migration** is needed.
- Public property detail uses a localized, filtered gallery with room chips (only categories present), accessible thumbnail selection, cover indicator, counter, full-screen swipe viewer and optional captions. Listing cards show the total photo count.
- Submit validation rejects duplicated photo IDs, invalid category or oversized captions, metadata for absent photos, or uploaded photos outside the listing. Existing sanitization/re-encoding strips original EXIF from uploaded images, and owner-only authorization and reviewed/public photo restrictions still apply.
- Captions are untrusted seller content and must be checked by moderators for personal contact details, sensitive addresses or misleading room identification. Category names are descriptions, **not independently verified building measurements or safety certifications**.

## User journeys

1. Verified advertiser creates/edits an authorized listing → Photos → uploads images → picks a category and optional caption for each → selects cover → saves draft → submits.
2. Staff moderator sees photos, labels and captions → approves or rejects with reason.
3. Seeker opens a published property → selects room filters, thumbnails and full-screen viewer. Captions and room labels always come from the approved revision.
4. Owner revises photo metadata on a published listing → existing public gallery remains unchanged until separate review approval.

## Acceptance checks

- Verify photos from another owner's property cannot be referenced on submission.
- New listing with a single image and no metadata can still be published.
- Submitted changes and rejected changes never alter public metadata, room filters, image order or cover.
- Test 20-image limit, 100-character caption limit, optional captions, invalid room code and removal of metadata for detached images.
- Test RTL Dari/Pashto and LTR English, screen reader/TalkBack, large text, narrow Android screens, offline upload failure/retry, very tall/wide images, gallery swipes and dismissal.
- Test safe moderation of misleading labels and inadvertent personal information in captions.

## Developer commands

```powershell
git pull origin main
pnpm install
pnpm check
# If you have not yet migrated Phase 8 Step 1:
pnpm db:migrate
pnpm dev:api
pnpm dev:mobile
```

API target remains **4000**. Expo Go is sufficient to test Step 2 media labeling/gallery (native push in Step 1 still requires a development build).

Automated GitHub CI tests the contracts, moderation, API flows, TypeScript and Android bundle. **Human device/accessibility QA is still outstanding.**
