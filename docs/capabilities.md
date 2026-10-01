# Phạm vi foundation và tình huống mở rộng

Đây là base ứng dụng React SPA dùng chung. “Hoàn chỉnh” ở đây nghĩa là các khả năng đã liệt kê có implementation, ownership, mock/contract và kiểm thử phù hợp; không có template nào triển khai sẵn mọi nghiệp vụ hoặc mọi backend.

## Có implementation

| Nhóm                 | Tình huống đã xử lý                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth                 | Protected/deep-link routes, permission guards, login error, refresh single-flight, cancellation, identity/session races, logout/cache cleanup |
| HTTP                 | Base URL/timeout, credentials/XSRF config, bearer scope, response validation, normalized error, read retry/write policy                       |
| CRUD                 | Search/page, create/detail/edit/delete, version conflict, pending/empty/error/retry, invalidate caches                                        |
| Form                 | RHF/Zod, domain invariant, errors giữ input, dirty guard, beforeunload, double-submit protection                                              |
| Connectivity         | Offline banner, disabled save/delete, mutation precondition; không tự gửi queued writes                                                       |
| UX                   | Light/dark, vi/en, timezone/currency formatting, dialogs, notifications, title, focus, scroll, responsive browser UI                          |
| Operations           | Flags, allowlisted reporter + integration points, bootstrap failure and lazy-chunk recovery                                                   |
| Structure            | Feature/layer groups, ports/adapters/mappers, shared presentation groups, naming/core/import/cycle checks                                     |
| Developer experience | Generator dry run/no overwrite, ui generator, hooks/commitlint, TS aliases, pinned dependencies, format/lint                                  |
| Validation/release   | Unit/integration/contracts, Chromium responsive/axe E2E, production artifact smoke, env/bundle guards, CI templates, Nginx template           |

## Cần contract của sản phẩm

| Nhu cầu                    | Base cung cấp                             | Phần cần triển khai/xác minh khi adopt                                                  |
| -------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------- |
| Backend/auth thật          | DTO/ports/adapters + mock HTTP            | Cookies/CSRF/CORS, authorization server, refresh rotation/revocation, integration tests |
| Multiple tabs              | Generation protection trong từng instance | Cross-tab refresh coordination/logout synchronization theo session contract             |
| SSO/MFA/reset password     | Auth repository boundary                  | Provider SDK/redirect flow, callbacks, recovery/step-up contract                        |
| Tenant/organization switch | Query clear khi đổi identity              | Tenant authority/headers, scoped keys, server isolation, authorization                  |
| File upload/download       | Boundary/ownership recipe                 | Signed URL/multipart/progress/cancel, size/MIME/scan, retention/access rules            |
| Realtime                   | Adapter + cancellation conventions        | SSE/WebSocket reconnect, auth expiry, event versioning/cache policy                     |
| Offline editing            | UI connectivity/read cache                | Durable outbox, idempotency, conflict merge, encrypted/private data policy              |
| Telemetry service          | Sanitized reporter and sink               | Chọn provider, consent/PII policy, release mapping, alerts                              |
| Browser matrix             | Build targets + Chromium tests            | Firefox/WebKit/real devices theo product                                                |
| Hosting                    | dist + Nginx/example CI                   | Domain/TLS/upstream/CSP, health probes, container/image verification                    |
| Release                    | Quality gate + artifacts                  | Branch protection, promotion/rollback, keeping old chunks, release approvals            |
| SSR/SEO/PWA                | SPA router và extensible adapters         | Chọn renderer/framework/service-worker strategy, test riêng                             |

Các mục ở bảng thứ hai **chưa được coi là đã triển khai**. Không bật mock để thay bảo đảm backend hoặc gọi middleware frontend là server authorization.

## Khi thêm công nghệ

1. Xác định consumer và owner.
2. Đặt port tại application nếu use case cần capability.
3. Adapter ở infrastructure, UI binding ở presentation; compose tại app.
4. Viết contract/behavior tests trước khi đổi retry, persistence hoặc authorization.
5. Cập nhật architecture gate nếu có nhóm dependency mới, không nới rule để vượt gate.

Nguồn tham chiếu cho hành vi hiện có: [React Router blocker](https://reactrouter.com/7.18.4/api/hooks/useBlocker), [Radix alert dialog](https://www.radix-ui.com/primitives/docs/components/alert-dialog), [TanStack network mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode).
