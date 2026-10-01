# Configuration audit — generic foundation

## Implemented

| Nhóm               | Cấu hình                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------- |
| Runtime/build      | React/TS/Vite, strict TS, aliases, Node/npm pin/lock, release mode validation                 |
| Architecture       | Feature layers, DI, AST import/cycle checker, core ES2022 không DOM/Node                      |
| Naming/scaffolding | Naming gate, validated feature generator, positive/negative checks                            |
| HTTP/auth          | Axios instances, timeout/cancel/XSRF, envelope/DTO validation, session/replay/races           |
| Cache/state        | Query policy, entity/list invalidation, Redux/thunk injection, preference storage fallback    |
| Forms/UX           | RHF/Zod/invariants, pending/error/dirty guard, confirm/notifications/offline                  |
| Localization       | vi/en parity, typed keys, app branding, route titles, configured timezone, currency formatter |
| CRUD concurrency   | Project version, If-Match, 412 conflict; không blind retry                                    |
| Flags/diagnostics  | Validated public flag, runtime UI consumer, allowlisted bounded reporter, event integrations  |
| Tooling            | ESLint/Prettier/Husky/lint-staged/Conventional Commits                                        |
| Tests/CI           | Vitest/MSW, Playwright/axe, production artifact smoke, GitHub/Azure templates                 |
| Hosting            | SPA Nginx config, API fail-closed, successful hashed-asset cache, errors no-store             |

## Không tự động được xác nhận bởi source

Backend cookies/CSRF/authorization/tenant isolation, real telemetry destination, remote CI/protection, ingress/TLS/CSP/upstream và release/rollback phải được môi trường adopt xác minh. Browser tests hiện Chromium desktop/mobile viewport. Nginx config chưa chạy trên host/image thật.

Xem [capabilities](capabilities.md) cho SSO/upload/realtime/offline persistence/cross-tab sessions và nơi mở rộng. Không coi phần chưa triển khai là mock production capability.

## Validation

Các lệnh dùng để xác minh:

```sh
npm run check
npm run test:e2e
npm run test:e2e:production
```

Checkpoint local ngày 01/10/2026 sau khi chuyển thành generic foundation:

| Kiểm tra                          | Kết quả                                                                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                   | Đạt toàn bộ format, lint, naming, architecture/core, tooling, scaffolding, env/config, TypeScript, coverage và build |
| Architecture                      | 120 modules, không phát hiện import sai chiều hoặc cycle; core compile không DOM/Node                                |
| Vitest                            | 12 suites / 159 tests đạt                                                                                            |
| Coverage theo phạm vi đã cấu hình | Statements 98.68%, branches 93.17%, functions/lines 100%; không phải coverage toàn bộ UI                             |
| Browser development               | 22/22 tests đạt trên Chromium desktop và mobile viewport                                                             |
| Production artifact smoke         | 3/3 tests đạt: deep link/form/HTTP, storage bị chặn, phục hồi lazy chunk                                             |
| Production bundle                 | 733 KiB JavaScript chưa nén; không MSW, devtools hoặc sourcemap                                                      |
| Feature generator                 | Dry run `catalog` liệt kê đúng 14 file, không ghi source; gate kiểm tra tên hợp lệ, nhóm kiến trúc và cú pháp        |
| Documentation                     | Các liên kết nội bộ trong 20 tài liệu root/docs đã được kiểm tra                                                     |

Browser regression đã xác minh form tạo mới reset đúng trạng thái sau khi lưu, không cảnh báo mất dữ liệu khi quay lại; form đang sửa vẫn chặn điều hướng khi có thay đổi chưa lưu. Test storage cho phép riêng bản đồ vị trí cuộn dạng số của router trong sessionStorage.

Các kết quả trên là kiểm chứng local của checkpoint này. Production smoke dùng HTTP stubs tại test runner; không chứng nhận backend, cookie/CSRF hoặc hosting thật. Dependency audit trong CI chưa được chạy lại ở checkpoint này; không tuyên bố trạng thái lỗ hổng hiện tại từ kết quả build.

Git local vẫn ở `feature/US-AXIS-TBD-bootstrap-web`, chưa có commit hoặc remote. Các file starter chưa được commit; không thực hiện push, publish hay deploy.
