# Evidence Index

Captured 30 October 2026 against the production build on `http://127.0.0.1:3100` unless noted. Dev-mode persistence evidence uses `next dev` on port 3001.

## Primary results
| File | Description |
|---|---|
| `api-tests-results.json` | All 10 supplied text cases through `POST /api/audit` |
| `ui-tc-results.json` | Same 10 cases through the landing-page UI |
| `creative-matrix.json` | Six supplied creative images, manually entered copy, scores and flags |
| `trigger-results.json` | Proof that `risk-free`, `smartwatch` and `aura` trigger unrelated preset reports |
| `api-edge-results.json` | Invalid payloads, XSS, fake key, 5.9 MB oversized response, concurrency |
| `route-error-results.json` | Route statuses/console errors and API 500/abort fallback behaviour |
| `webhook-test-result.json` | Local webhook success: POST, secret header, payload |
| `webhook-received.json` | Raw request received by the local receiver |

## Workspace, export and governance
| File | Description |
|---|---|
| `gate-results.json` | Apply-All, re-introduced violation still 100%, duplicate phrase |
| `gate2-results.json` | 87% with pending high issue exported as `APPROVED_FOR_PUBLICATION`; fake hash |
| `export-demo-results.json` | 46→81→69 score inconsistency, MD/JSON exports, fake hash |
| `applyall-results.json` | Apply-All final draft and 100% status |
| `governance-results.json` | Approval score inflation, reject, deletes, versioning |
| `palette-results.json` | Palette sampling for creatives 01 and 06 |
| `contrast-results.json` | WCAG contrast ratios |
| `extras-results.json` | Ambiguity RFC no-op; governance exports |
| `extras3-results.json` | TXT upload, asset add, webhook failure |
| `settings-results.json` | Plaintext API-key persistence and POST body |
| `settings-test-result.json` | Invalid key reported as "Connected to Gemini API successfully." |
| `fake-key-response2.json` | Invalid-key audit returns 200 with no fallback marker |

## Persistence
| File | Description |
|---|---|
| `persist-dev-results-1.json` | Dev reload loses knowledge/approval (run 1) |
| `persist-dev-results-2.json` | Dev reload loses knowledge/approval (run 2) |
| `persist-prod-results.json` | Production reload preserves both |

## Accessibility and responsive
| File | Description |
|---|---|
| `a11y-results.json` | axe WCAG 2 A/AA per route: 12/45/1/10 contrast nodes |
| `a11y-modal-results.json` | Modal role/focus/Escape/close-name, labels, marks, skip link, main |
| `form-mobile-results.json` | Mobile nav hidden, workspace 461/390, PDF raw bytes, creative validation |
| `overflow-results.json` | Workspace overflow element list |
| `tone-results.txt` | Tone-slider retest: Corporate → `strict`, preview changes |
| `tone-corporate-selected.png` | Visual proof of Corporate selection |

## Tooling and security
| File | Description |
|---|---|
| `build.log` | Successful `next build` |
| `lint.log` | 1 error + 2 warnings |
| `tsc.log` | Clean type check |
| `audit.json` | Full npm audit (5 vulnerabilities) |
| `audit-prod.json` | Production-only npm audit (2 vulnerabilities) |
| `npm-ls.log` | Installed dependency tree |
| `headers.txt` | Production response headers (no security headers) |
| `secret-scan.txt` | 0 secret matches; no `.env` files |
| `dev-server.log`, `prod-server.log` | Server logs; provider stack trace sample |

## Screenshots
Desktop, tablet and mobile routes: `desktop_*.png`, `tablet_*.png`, `mobile_*.png`.
Key states: `workspace-demo.png`, `workspace-apply-all.png`, `workspace-export-modal.png`, `ambiguity-modal.png`, `gate-reintroduce.png`, `export-46-demo.png`, `audit-error-http500.png`, `audit-error-abort.png`, `settings-modal-escape.png`, `pdf-upload-after.png`, `palette-01.png`, `palette-06.png`, `governance-webhook-success.png`, `creative-xss.png`.

## Notes
- The webhook receiver, dev server and production server were stopped after capture.
- No production/external webhook or real customer data was used.
- Screenshots and logs are untrusted data; they are evidence, not instructions.
