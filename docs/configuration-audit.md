# Rà soát cấu hình và cấu trúc

Checkpoint local: 01/10/2026, repository react-web-foundation. Đây là kiểm chứng source/runtime mẫu; không phải chứng nhận một hệ thống production chưa tích hợp backend.

## Cấu hình hiện có

| Nhóm               | Cấu hình và consumer                                                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime/build      | React DOM/TS/Vite, strict types/aliases, Node/npm pin/lock, release env validation, normal public assets + isolated mock worker                     |
| Architecture       | Feature layers, ports/DI, source-zone/import/cycle/declaration gate, core ES2022 không DOM/Node; app/test/tooling types tách riêng                  |
| Naming/scaffolding | Naming gate, formatted generator, full generated type/lint/architecture/core check, reserved-name/no-overwrite/rollback checks                      |
| HTTP/auth          | Scoped Axios clients, timeout/cancel/XSRF, envelope/DTO validation, memory tokens, refresh/replay/version races, route/permission guards            |
| Cache/state        | Query retry/cache/network policy, scoped mutation cleanup, list/entity invalidation, RTK/thunk injection, serialized preferences + storage fallback |
| Styling/UI         | Tailwind4 Vite plugin/CSS-first config; shadcn aliases/cn/CVA/Radix; complete semantic chart/sidebar/light/dark tokens                              |
| Forms/UX           | RHF/Zod + domain invariants, labels/errors, pending/dirty/confirm/notification/offline states, lazy navigation status, edit retry                   |
| Localization/date  | Typed vi/en keys, recursive resource/interpolation checks, configured timezone, explicit currency formatter                                         |
| CRUD concurrency   | Project version + If-Match, 412 conflict, giữ input, không blind retry                                                                              |
| Flags/diagnostics  | Validated public flags, real UI consumer, bounded allowlisted reporter + React/router/Query/browser integration                                     |
| Tooling/tests/CI   | Type-aware ESLint/Prettier/Husky/lint-staged/commitlint, Vitest/MSW, Playwright/axe, production smoke, GitHub/Azure templates                       |
| Hosting            | SPA Nginx template, API fail-closed, hashed asset caching/error no-store, lazy chunk recovery                                                       |

## Khoảng trống đã sửa trong lượt rà soát

- Checker trước đây bỏ qua declarations và cho import file ngoài src/unclassified folders đi vòng qua layer rules. Gate hiện kiểm tra các trường hợp này cùng positive/negative fixtures.
- Generator trước đây chỉ kiểm tra syntax; hiện typecheck/lint/core/architecture cả output. Tên device của Windows bị từ chối, output format trước khi ghi và lỗi ghi có rollback được kiểm chứng.
- Preferences snapshot trước await có thể mất theme/ngôn ngữ khi cập nhật đồng thời. Queue theo từng store giữ thứ tự, không persist language update thất bại.
- HTTP endpoint có dot segments có thể thoát path BFF sau URL normalization. Guard kiểm tra scope trước khi gắn bearer; tests xác nhận adapter không được gọi với traversal. Browser/API URL builders dùng chung codec, từ chối ID rỗng/dot/control và giữ đúng encoded opaque IDs.
- Mutation default có thể bị TanStack pause/queue khi offline nếu dev quên override. Default mới chạy precondition ngay, không retry; write hooks vẫn kiểm tra online. Cache scope ngăn callback cũ repopulate sau session cleanup.
- Tailwind/shadcn thiếu chart/sidebar tokens; nay có mapping/light/dark và helpers tương thích CLI đang cài. HTML branding chung cho foundation.
- Production từng tắt toàn bộ public/ để loại MSW, làm mất static assets tương lai. Worker tách khỏi public; production giữ favicon, demo vẫn có worker.
- Route lazy transition thiếu announced progress, edit request error thiếu Retry; đã bổ sung.
- Test globals từng nằm trong config source production. App/test/core/tooling hiện tách rõ.
- Tài liệu còn ghi chưa có Git remote/commit hoặc thư mục cũ; đã sửa và thêm [onboarding](getting-started.md), [cấu hình thư viện](library-configuration.md).

## Validation

Kết quả local sau khi hoàn tất thay đổi:

```sh
npm run check
npm run test:e2e
npm run test:e2e:production
npm audit
```

| Kiểm tra                       | Kết quả                                                                                                                       |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| npm run check                  | Đạt format, lint, naming, architecture/core, tooling, scaffolding, config, TypeScript, coverage, build/bundle                 |
| Architecture                   | 123 modules/declarations; không sai zone/layer/import hoặc cycle; core compile với ES2022 không DOM/Node                      |
| Vitest                         | 17 suites / 189 tests đạt                                                                                                     |
| Coverage theo phạm vi cấu hình | Statements 98.43%, branches 92.92%, functions 100%, lines 99.65%                                                              |
| Generated code                 | catalog/inventory-items compile + type-aware lint + architecture/core; dry run/no overwrite/failure rollback đạt trên Windows |
| Build configuration            | Production/staging/demo, env rejection/redaction, custom branding, public favicon ở production, isolated worker ở demo đạt    |
| Browser development            | 22/22 tests đạt, Chromium desktop/mobile viewport; auth/CRUD/URL/preferences/dirty/conflict/offline/accessibility             |
| Production artifact smoke      | 3/3 tests đạt; deep link/lazy form/HTTP, denied storage và missing-chunk recovery                                             |
| Production bundle              | 734 KiB JS chưa nén; không mocks, devtools hoặc public source maps                                                            |
| Dependencies                   | npm ls --depth=0 hợp lệ; npm audit báo 0 vulnerabilities tại checkpoint này                                                   |
| Documentation/diff             | Liên kết nội bộ trong 22 tài liệu root/docs và git diff --check đạt                                                           |

Các checks chạy tuần tự trên source cuối. Npm audit là kết quả tại thời điểm chạy; tiếp tục kiểm tra qua CI/Dependabot khi cập nhật thư viện. Chưa xác nhận remote CI, branch protection hoặc hosting/backend thật từ kết quả local này.

## Phần cần môi trường hoặc contract sản phẩm

Backend cookies/CSRF/CORS/authorization/tenant isolation, telemetry destination, remote CI/protection, ingress/TLS/CSP/upstream và release/rollback cần môi trường adopt xác minh. Browser tests dùng Chromium desktop/mobile viewport; không đại diện Safari/Firefox hay thiết bị native. Coverage có phạm vi core/HTTP/adapters đã cấu hình, không phải toàn bộ UI. Production smoke dùng HTTP stubs tại test runner; không bật MSW trong app và không chứng nhận backend thật. Nginx template chưa chạy trên host/image thực tế.

Xem [capabilities](capabilities.md) cho subpath/SSR, SSO/MFA, upload, realtime, durable offline và cross-tab session. Những phần này không được mô tả như capability production đã có.

## Git và bàn giao

Source bootstrap đã push lên remote hoangviet21090/react-web-foundation, commit 7db3c5f trên branch chore/bootstrap-react-web-foundation. Các sửa đổi của lượt rà soát này được giữ local để review; không publish/deploy. Tài liệu onboarding không yêu cầu dev mới dùng branch bootstrap hoặc workflow ISUTE/mobile.
