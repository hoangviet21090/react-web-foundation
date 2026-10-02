# react-web-foundation

Base React web trong một repository, dùng Clean Architecture với các folder quen thuộc. UI, model, xử lý nghiệp vụ và API tách trách nhiệm; không cần đi qua nhiều lớp wrapper để thêm một màn hình.

## Chạy dự án

Node 24.18.1, npm 11.x.

```sh
npm ci
npm run dev
```

Mở http://127.0.0.1:5173. Tài khoản mock: `demo@example.test / Demo123!` có quyền CRUD; `viewer@example.test / Demo123!` chỉ đọc. Dữ liệu mock reset khi reload.

| Lệnh                          | Mục đích                                                               |
| ----------------------------- | ---------------------------------------------------------------------- |
| `npm run dev`                 | Chạy với MSW mock                                                      |
| `npm run dev:api`             | Chạy với backend theo env                                              |
| `npm run check`               | Format, lint, coverage, typecheck, production build và kiểm tra bundle |
| `npm run test:e2e`            | Luồng auth/CRUD trên desktop và mobile Chromium                        |
| `npm run test:e2e:production` | Build và smoke test production                                         |
| `npm run build`               | Tạo production `dist/`                                                 |
| `npm run build:demo`          | Tạo bản demo có MSW                                                    |
| `npm run ui:add -- dialog`    | Thêm component bằng shadcn CLI đã pin                                  |

Cài browser lần đầu: `npx playwright install chromium`. Trên PowerShell có thể dùng `npm.cmd` nếu `npm.ps1` bị chặn.

## Nơi đặt code

```text
src/
  app.tsx             # Khởi tạo ứng dụng và ghép providers/router
  components/         # Component dùng chung hoặc theo nghiệp vụ
    ui/               # shadcn/Radix primitives
    auth/
    projects/
  pages/              # UI chính của từng màn hình
  layouts/            # Shell, navigation và layout route
  routes/             # Router, bảo vệ route, loading và navigation
  entities/           # Model và quy tắc nghiệp vụ thuần TS
  usecases/           # Điều phối hành động, contract và kết quả ứng dụng
  services/           # Gọi HTTP và validate dữ liệu backend
  schemas/            # Validate form và kiểu dữ liệu form (RHF/Zod)
  hooks/              # React hooks; Query cho server state
  store/              # Redux client state: slice, selector, thunk
    auth/
    preferences/
  config/             # Env, Axios, Query, i18n, feature flags và runtime
  constants/          # Route registry, API endpoints, giá trị cố định
  enums/              # Tập giá trị nghiệp vụ, ví dụ PROJECT_STATUSES
  utils/              # Hàm dùng chung, format và browser utilities
  types/              # Kiểu hỗ trợ UI và declarations
  locales/            # vi/en
  contexts/           # Context có state dùng chung thực tế
  providers/          # Ghép thư viện và notification state
  mocks/              # MSW handlers và dữ liệu mẫu
  styles.css          # Tailwind v4, semantic tokens, light/dark
```

`tests/` kiểm tra hành vi; `e2e/` kiểm tra browser; `deployment/nginx.conf` là mẫu static hosting.

Dependency rule: `entities` không biết React, Redux hoặc Axios. `usecases` dùng entity và service contract thuần TypeScript; concrete service được cấp trong `config/runtime.ts` khi `createAppRuntime` khởi tạo ứng dụng. `AuthState`, `AuthCredentials`, lỗi ứng dụng và pagination thuộc `usecases`; `ApiResponse` nằm cùng `requireResult` trong `usecases/response.ts`. `services` biết HTTP và model nhưng không biết UI. UI gọi use case qua hook hoặc Redux thunk. ESLint bảo vệ hai lớp bên trong; không có generator hoặc folder checker bắt buộc.

Schema đặt theo nguồn dữ liệu và module sở hữu việc kiểm tra. Folder `schemas/` hiện dành cho form; các schema khác đặt cạnh nơi đọc dữ liệu:

| Dữ liệu cần kiểm tra                     | Vị trí               | Ví dụ                                                                 |
| ---------------------------------------- | -------------------- | --------------------------------------------------------------------- |
| Input form RHF                           | `schemas/`           | `login-form-schema.ts`, `project-form-schema.ts`                      |
| State preferences lưu trong localStorage | `store/preferences/` | `preferences-schema.ts`, dùng trong `preferences-storage.ts`          |
| Payload backend                          | `services/`          | `project-response-schema.ts`; schema nhỏ có thể private trong service |
| Env và envelope HTTP chung               | `config/`            | `env-schema.ts`, `http/response.ts`                                   |
| Request của backend mock                 | `mocks/`             | Schema private trong handler                                          |

`Preferences` được suy ra bằng `z.infer` từ schema vì đây là client state của module preferences; các consumer dùng `import type`. Quy tắc nghiệp vụ trong `entities` vẫn là TypeScript thuần. Một trường xuất hiện ở form, response và business rule có thể cần kiểm tra ở cả ba nơi vì mỗi nơi nhận dữ liệu từ một ranh giới khác nhau.

Chỉ tạo folder con khi có code cần tổ chức. Không cần namespace hay enum để bọc mọi type; dùng interface/type và union khi phù hợp. Route guard là component của router. HOC chỉ thêm khi có nhu cầu dùng chung cụ thể.

Tham khảo: [Clean Architecture — Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html), [bài Clean Architecture trên Viblo](https://viblo.asia/p/clean-architecture-Ljy5VMYzlra).

## Thêm một màn hình

1. Tạo UI chính ở `pages/`, tách phần tái sử dụng vào `components/`.
2. Khai báo model/quy tắc ở `entities/`; tạo fixtures và handler trong `mocks/`.
3. Viết `services/<name>-service.ts` gọi API và validate response.
4. Viết `usecases/<name>-usecases.ts` để validate input, format hoặc xử lý dữ liệu; nhận service qua tham số.
5. Thêm hook TanStack Query cho server data. Với client workflow, thêm slice/selector/thunk trong `store/<name>/`.
6. Khai báo URL ở `constants/routes.ts`, endpoint ở `constants/endpoints.ts`, nối page vào `routes/router.tsx` và thêm test cho hành vi mới.

Projects là ví dụ list/search/pagination/detail/create/edit/delete. Auth và Preferences minh họa Redux Toolkit và thunk. Không sao chép server data sang Redux khi TanStack Query đã quản lý.

## Config và API mẫu

Copy `.env.example` sang `.env.local` để override local. Các giá trị `VITE_*` được đưa vào bundle, không chứa secret. `dev:api` không tự tạo proxy; `/api` cần gateway hoặc cấu hình `VITE_API_BASE_URL` tới backend phù hợp.

| Config                       | Giá trị mặc định           |
| ---------------------------- | -------------------------- |
| `VITE_APP_NAME`              | Web Foundation             |
| `VITE_API_BASE_URL`          | /api                       |
| `VITE_API_TIMEOUT_MS`        | 15000                      |
| `VITE_ENABLE_MOCKS`          | false; chỉ bật ở mock/demo |
| `VITE_DEFAULT_LOCALE`        | vi                         |
| `VITE_TIME_ZONE`             | UTC                        |
| `VITE_ENABLE_PROJECT_DELETE` | true; chỉ điều khiển UI    |

Axios dùng credentials, XSRF cookie/header và bearer token cho BFF đã cấu hình. TanStack Query giữ dữ liệu fresh 60 giây, thu hồi cache không dùng sau 5 phút; retry tối đa hai lần cho lỗi đọc tạm thời, không tự retry/queue write. Redux Toolkit bật middleware thunk mặc định; token không nằm trong store. RHF/Zod quản lý form, service schema kiểm tra wire response, entity kiểm tra business rule.

Tailwind v4 dùng Vite plugin và `styles.css`; shadcn dùng CSS variables/semantic tokens, `components/ui` và `utils/cn`. i18next có vi/en; dayjs format UTC theo timezone env. Query/Redux devtools chỉ bật khi development.

API ví dụ: `POST /auth/login|refresh|logout`; `GET/POST /projects`; `GET/PUT/DELETE /projects/:id`. Response theo `ApiResponse<T>`: `success`, `result`, `errorCode`, `errorDetails`, `message`. Danh sách có `items`, `totalCount`, `page`, `pageSize`. PUT/DELETE dùng `If-Match` để phát hiện version conflict. Khi dùng backend khác, sửa service/schema/mock cùng lúc; UI không nhận raw Axios response. Wire contract mẫu: [openapi.yaml](openapi.yaml).

## Auth và production

Access token chỉ giữ trong memory. Backend thực tế phải cấp refresh token qua HttpOnly/Secure cookie và cấu hình Path/CORS/CSRF/SameSite phù hợp. 401 refresh single-flight, replay tối đa một lần; logout/đổi session xóa Query cache. Route/permission guard chỉ điều khiển giao diện; backend phải kiểm tra quyền và resource ownership. Replay write sau 401 yêu cầu backend từ chối trước khi thực hiện side effect.

LocalStorage chỉ lưu theme/language; sessionStorage của router chỉ lưu vị trí cuộn. Tokens và server cache không được persist.

Mock refresh dùng cookie marker không bí mật, không phải token thật. Không deploy mock/demo làm production. Production build kiểm tra HTTPS hoặc same-origin API và loại MSW/devtools/source maps. Backend/SSO, refresh rotation, phối hợp nhiều tab, upload và tenant isolation cần contract sản phẩm trước khi triển khai.

GitHub CI và Azure pipeline chạy quality/browser checks. Mẫu Nginx cần cấu hình upstream/TLS/CSP thực tế; release pipeline và branch protection do team thiết lập. Không log credentials, payload hay raw HTTP errors; reporter hiện chỉ giữ source/kind/timestamp trong memory. Dependencies được pin/lock và CI audit; đây không phải chứng nhận bảo mật. Các thư viện giữ license riêng; source shadcn có notice trong `THIRD_PARTY_NOTICES`.

Quy trình code và review: [CONTRIBUTING.md](CONTRIBUTING.md).
