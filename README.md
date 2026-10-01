# react-web-foundation

Base React web dùng chung, tổ chức theo **feature-first Clean Architecture**. Auth và Projects là hai vertical slices chạy được qua React → use cases → repository → HTTP → MSW. Không yêu cầu domain, thư viện UI hoặc quy trình Git của một tổ chức cụ thể.

Thư mục vật lý và package hiện cùng tên `react-web-foundation`. Việc đổi tên thư mục không làm thay đổi imports hoặc cấu hình build.

## Chạy ngay

Node 24.18.1, npm 11.x (lock được tạo bằng 11.16.0).

```sh
npm ci
npm run dev
```

Mở http://127.0.0.1:5173. Tài khoản mock: `demo@example.test / Demo123!` có quyền đọc/tạo/sửa/xóa; `viewer@example.test / Demo123!` chỉ đọc. Không dùng dữ liệu thật trong demo. Mock reset dữ liệu khi reload; cookie marker demo không phải refresh token thật.

## Những luồng đã có

- Login/restore/refresh/logout, memory access token, route/permission guards, single-flight refresh, xử lý race và cleanup cache.
- Projects: list/search/pagination trong URL, detail/create/edit/delete, lazy routes, request cancellation, pending/empty/error/retry states.
- Version concurrency: PUT/DELETE gửi If-Match; response 412 giữ input và yêu cầu xem bản mới nhất.
- Form RHF/Zod, domain validation độc lập, chặn submit lặp, cảnh báo điều hướng và đóng/reload tab khi chưa lưu.
- Shared offline hook/banner; writes không xếp hàng để tự gửi lúc có mạng trở lại.
- Confirm dialog dựa trên Radix, notification provider, theme/language persistence, route title/scroll/focus.
- Axios/error mapping, TanStack Query cache policy, Redux Toolkit/thunk cho client state.
- Feature flags được validate; permission phía server vẫn là điều kiện bắt buộc.
- Error reporting port + adapter có giới hạn dữ liệu, nối React/router/Query/browser errors; chưa gửi tới nhà cung cấp bên ngoài.
- Generator feature, architecture/core/naming/scaffolding gates, formatting/lint/Git hooks, unit/contract/browser tests.
- Env validation tại build/runtime, bundle checks, GitHub/Azure CI, Nginx static-host template.

Xem [ma trận khả năng và giới hạn](docs/capabilities.md). Base cung cấp các tình huống nền tảng; backend, SSO, upload, tenant isolation, realtime/offline sync cần contract sản phẩm trước khi triển khai.

## Cấu trúc chính

```text
src/
  app/                 # Compose dependencies, routes/layouts, preferences, config, observability
  features/
    auth/              # Identity/session example
    projects/          # Full CRUD example, version conflicts
      domain/
      application/ports/
      infrastructure/  # dto, services, mappers, repositories
      presentation/    # pages, components, hooks, contexts, providers, queries, schemas, types, constants, utils
  shared/
    domain/
    application/ports/
    infrastructure/    # config, http, i18n, observability, cache
    ui/                # DOM primitives
    components/        # Confirm, offline, request error, unsaved changes
    hooks/
    contexts/
    providers/
    types/             # Shared presentation types only
    lib/
  mocks/
tests/
e2e/
scripts/
docs/adr/
deployment/
```

Giữ nhóm folder có trách nhiệm rõ dù ít file để dev có mẫu mở rộng. Không gom type/use case/service mọi feature vào shared.

**Đọc trước khi code:** [nơi đặt code](docs/project-structure.md) → [kiến trúc](docs/architecture.md) → [naming](docs/naming.md) → [thêm feature](docs/adding-a-feature.md) → [quy trình](CONTRIBUTING.md).

## Lệnh

| Lệnh                                       | Công việc                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `npm run dev`                              | Local MSW                                                                                   |
| `npm run dev:api`                          | Backend thật theo env                                                                       |
| `npm run feature:new -- catalog --dry-run` | Xem danh sách file sẽ sinh                                                                  |
| `npm run feature:new -- catalog`           | Sinh read-only vertical slice; không ghi đè module                                          |
| `npm run ui:add -- dialog`                 | CLI shadcn đã pin; review generated code                                                    |
| `npm run check`                            | Format/lint/naming/architecture/core/tooling/scaffolding/config/types/coverage/build/bundle |
| `npm run test:e2e`                         | Auth, CRUD, accessibility, URL, offline, unsaved form trên browser                          |
| `npm run test:e2e:production`              | Build production + smoke không có MSW trong app                                             |
| `npm run build`                            | Release dist                                                                                |
| `npm run build:demo`                       | Demo có MSW, không dùng làm production                                                      |
| `npm run format`                           | Format code và Tailwind classes                                                             |

Cài Chromium lần đầu: `npx playwright install chromium`. PowerShell chặn npm.ps1 thì dùng npm.cmd.

## Khi dùng làm base dự án mới

1. Đổi package name/branding/storage namespace; cài bằng lockfile.
2. Chọn backend contract; thay adapter và mock cùng lúc. [API mẫu](docs/api-contract.md) không phải API bắt buộc cho mọi dự án.
3. Thay Projects bằng domain của sản phẩm hoặc dùng generator để thêm module mới.
4. Cấu hình env, identity, permissions và [deployment](docs/deployment.md).
5. Chạy gates; thiết lập remote, branch protection, CI và quy trình release của team.

Chưa commit/push/deploy. Remote và môi trường production chưa được cấu hình.
