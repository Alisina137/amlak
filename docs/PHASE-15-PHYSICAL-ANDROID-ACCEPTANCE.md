# Step 15 — Physical Android Acceptance Testing

Status: **Not yet accepted**. This runbook prepares and records a real-device acceptance run. Documentation and CI cannot substitute for tests on physical Android hardware.

## Goal

Verify the Android app on a real device using a known build and API environment before any pilot or production go/no-go decision.

## Preconditions

- [ ] Step 14 is merged and local `main` is up to date.
- [ ] The exact commit SHA and Android build artifact are recorded.
- [ ] The device model, Android version, available storage, language, and screen size are recorded.
- [ ] A non-production test account and test data are available.
- [ ] API base URL is reachable over the intended HTTPS endpoint; do not use a production database for test data.
- [ ] Tester has permission to capture screenshots and redact personal information, tokens, phone numbers, and location data.
- [ ] No real user data or production credentials are included in the evidence.

## Test procedure

Run each applicable case on a physical device. Record Pass, Fail, Blocked, or Not Applicable and attach redacted evidence for failures and critical flows.

| ID | Scenario | Acceptance criteria | Result / evidence |
|---|---|---|---|
| AND-01 | Install / clean launch | Build installs and opens without crash; version and commit are identifiable. | |
| AND-02 | Registration / sign-in | Valid flow succeeds; invalid credentials show a safe, understandable error. | |
| AND-03 | Session persistence | Relaunch behavior is correct; logout clears authenticated access. | |
| AND-04 | Navigation | Primary tabs and back navigation work; no blank or inaccessible screens. | |
| AND-05 | Property discovery | Listing/search/filter/detail flows load expected test data and handle empty results. | |
| AND-06 | Property submission / edits | Validation works; successful changes persist after refresh/relaunch. | |
| AND-07 | Network interruption | Loading, timeout, offline and retry states are understandable; no app crash. | |
| AND-08 | Slow connection | Progress is visible and duplicate submissions are avoided. | |
| AND-09 | Permissions | Denied or revoked permissions are handled gracefully and can be retried where appropriate. | |
| AND-10 | RTL / language | Supported RTL language has correct text direction, layout, and readable labels. | |
| AND-11 | Small screen / keyboard | Inputs remain visible, keyboard does not obscure required controls, scrolling works. | |
| AND-12 | Accessibility / touch | Main controls have clear labels, sufficient touch area, and visible focus/state. | |
| AND-13 | Error handling | API errors do not expose stack traces, secrets, or internal infrastructure details. | |
| AND-14 | Media / images | Images load, failures have a fallback, and upload restrictions/errors are clear if supported. | |
| AND-15 | Repeated actions | Repeated taps do not create unintended duplicate records or requests. | |
| AND-16 | End-to-end core journey | Tester completes the agreed user journey from entry to its expected final state. | |
| AND-17 | API configuration | App talks only to the documented test API endpoint; no unexpected localhost endpoint. | |
| AND-18 | Regression smoke | Previously working critical flows still work on this build. | |

Only mark a case Not Applicable with a brief reason. A test that could not be run is Blocked, not Pass.

## Evidence requirements

For every failed or blocked case, record:
- test ID, date/time with timezone, device and OS version;
- app version, Git commit SHA, and build artifact identifier;
- exact reproduction steps and expected vs actual behavior;
- redacted screenshot or short screen recording where useful;
- relevant redacted client/API logs and request correlation ID, if available;
- severity, workaround, issue link, and retest result.

Do not attach access tokens, passwords, private keys, unredacted personal data, or production database contents.

## Exit criteria

- All critical journey cases pass.
- No unresolved blocker or critical/high-severity defect remains without explicit documented risk acceptance.
- Every failure has an issue and an owner; fixes are retested on device.
- Device/build/environment evidence is complete and reviewable.
- A named human reviewer records the go/no-go decision.

A completed checklist is evidence, not automatic production approval. Kabul pilot evidence, infrastructure/HTTPS verification, migration safety, backup-and-restore testing, security/privacy review, monitoring/incident response, and human sign-off remain separate gates.
