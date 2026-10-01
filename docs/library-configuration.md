# Cấu hình thư viện và quy tắc sử dụng

Các thư viện đã được nối vào runtime và có consumer mẫu. Bảng dưới là điểm vào để mở rộng; [configuration audit](configuration-audit.md) ghi kiểm chứng, [capabilities](capabilities.md) ghi phần cần contract sản phẩm.

| Nhóm                      | Owner cấu hình                                                               | Quy tắc cho dev                                                                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| React/Vite/TypeScript     | vite.config.ts, tsconfig.*.json, src/app/bootstrap.tsx                       | React DOM SPA, StrictMode, alias @, lazy routes, release env validation; app/test/core/tooling có cấu hình type riêng                             |
| Routing                   | app/routing/routes.ts, router.tsx, navigation.ts, route-adapters/            | Dùng registry và URL builders; guard quyền ở app, BE vẫn authorize; query string chứa filter/page; RootLayout quản lý scroll/title/pending status |
| Redux Toolkit/thunk       | app/store/store.ts, app/preferences/                                         | Client state; typed bindings; RTK đã có thunk, inject extraArgument một lần; không lưu server cache/token vào Redux                               |
| TanStack Query            | shared/infrastructure/query-client.ts, feature/presentation/queries và hooks | Query keys theo feature; retry đọc có giới hạn; ghi không retry/queue offline; invalidate/update cache theo mutation, cancel qua signal           |
| Axios                     | shared/infrastructure/http/, feature/infrastructure/services/                | Chỉ gọi qua service/repository; validate DTO/envelope; token/refresh/version guard trong adapter; không lộ raw errors                             |
| RHF/Zod                   | feature/presentation/components và schemas; infrastructure/dto               | Schema form phục vụ UX; domain vẫn kiểm tra invariant; wire schema riêng; giữ input khi lỗi, pending/dirty guard                                  |
| Tailwind CSS 4            | @tailwindcss/vite trong vite.config.ts; app/styles.css                       | CSS-first config, semantic light/dark tokens; không cần tailwind.config.js/PostCSS config trùng lặp                                               |
| shadcn/Radix              | components.json, shared/ui/, scripts/add-ui.mjs                              | DOM primitives trong source, cn/CVA cho variants; generated source cần review; chart/sidebar token đã có nhưng component chỉ thêm khi dùng        |
| i18next                   | shared/infrastructure/i18n/, app/preferences/                                | Instance được inject; vi/en, typed keys, resource/interpolation parity gate; strings UI qua locale                                                |
| dayjs/Intl                | shared/lib/format-date-time.ts, format-money.ts                              | UTC backend → timezone đã validate; formatter truyền locale/currency, không thay đổi giá trị tiền của domain                                      |
| lucide-react              | UI consumer                                                                  | Import icon trực tiếp; decorative aria-hidden, control chỉ icon cần accessible name                                                               |
| MSW                       | mocks/, scripts/vite-plugins/mock-worker.ts                                  | Chỉ mock/demo; worker đọc từ package đã pin, không đặt trong public; cùng endpoint/envelope/DTO với adapter thật                                  |
| Vitest/Playwright         | vitest.config.ts, playwright*.config.ts, tests/, e2e/                        | Invariants/contracts/races + user flows; production smoke chạy dist không MSW, HTTP stubs chỉ ở runner                                            |
| ESLint/Prettier/Git hooks | eslint.config.mjs, prettier.config.mjs, .husky/, package.json                | Type-aware lint, naming/architecture checks, Tailwind sorting, lint-staged, Conventional Commits; CI kiểm tra độc lập                             |

## Cache và state

Query mặc định staleTime 60 giây, gcTime 5 phút, refetch khi focus. Retry tối đa hai lần chỉ khi AppError đánh dấu retryable; validation/auth/contract/conflict không tự retry. Mutations mặc định retry=false và networkMode=always để chạy precondition ngay; network write cần requireOnline hoặc chính sách tương đương. Không bật offline persistence/outbox trước khi có idempotency/conflict/retention contract. TanStack defaults khác vẫn giữ nguyên nếu repository không có lý do thay đổi; xem [query defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults).

Feature sở hữu key factory, query/mutation hooks và invalidation. Query function chuyển AbortSignal qua cancellation bridge → application port; không đưa AbortSignal vào domain. Auth session thay đổi sẽ cancel và clear cache. Mutation hooks dùng captureQueryScope tại onMutate và kiểm tra scope trước/sau các await trong onSuccess; clear cache vô hiệu callbacks cũ để chúng không đưa dữ liệu của phiên trước vào cache hoặc báo thành công sau logout. Dùng createQueryClient của app khi tích hợp các hooks này. Không chia sẻ QueryClient singleton giữa nhiều app instance hoặc người dùng.

Redux giữ preferences; updatePreferences tuần tự theo từng store để thay đổi ngôn ngữ bất đồng bộ không ghi đè theme hoặc một yêu cầu ngôn ngữ mới hơn. Side effects ở thunk, reducer thuần. Khi thêm client workflow, định nghĩa owner tại feature/presentation/state hoặc nhóm app phù hợp; không mirror query data.

## HTTP và errors

Auth client riêng với protected client để refresh 401 không tự gọi refresh lặp. Protected requests chỉ dùng endpoint tương đối với BFF và phải ở trong origin/path prefix cấu hình; URL tuyệt đối, traversal hoặc override base bị từ chối trước khi gắn token. Access token trong memory, refresh cookie do BE cấp. Axios withCredentials và XSRF cookie/header được cấu hình; cross-origin CSRF/CORS/SameSite vẫn phải chốt với backend, không tự coi cookie name là đủ bảo vệ.

URL builders và API endpoints dùng shared/infrastructure/encode-path-segment.ts để encode opaque IDs và từ chối ID rỗng/dot/control không thể biểu diễn an toàn trong URL; không nối ID trực tiếp vào path. Service nhận unknown rồi parse envelope/DTO; repository trả domain qua application port. 400/422 → validation; 401/403 → unauthorized/forbidden; 409/412 → conflict; 429 → rate-limit; timeout/network/5xx có phân loại riêng. Không đưa payload/config/token/raw cause vào Redux/UI/reporter. Danh sách và success=false theo [API mẫu](api-contract.md); khi adopt backend khác sửa adapter và mock đồng bộ.

## Styling và UI

Tailwind v4 quét class trong source; dùng chuỗi class hoàn chỉnh hoặc map variants, không nối bg- + màu + -500. Thư viện ngoài source hoặc class sinh động cần @source phù hợp theo [Tailwind class detection](https://tailwindcss.com/docs/detecting-classes-in-source-files). Theme mapping có background/foreground/card/popover/primary/secondary/muted/accent/destructive/border/input/ring, chart-1..5, sidebar và radius. Dark mode do preferences DOM sync điều khiển. shadcn/tailwind.css cung cấp helper variants/animations của CLI đang cài.

components.json dùng new-york, rsc=false, tsx=true; tailwind.config để trống có chủ ý cho v4. Aliases trỏ ui/components/hooks/lib/cn về shared. Thêm primitive bằng ui:add rồi review dependencies, class tokens, keyboard/focus, labels/error association và reduced motion. [shadcn configuration](https://ui.shadcn.com/docs/components-json) và [theming](https://ui.shadcn.com/docs/theming) là tham chiếu; CLI pin không đóng băng registry từ xa.

RHF dùng resolver Zod và defaultValues/reset có chủ ý; dữ liệu sửa giữ version tại thời điểm mở form. Domain validation vẫn chạy khi gọi use case ngoài UI. Không tự reset form khi refetch làm mất input. Shared dialog/notification/offline/dirty hooks có consumer thật để dev dùng làm mẫu.

## Build, assets và kiểm tra

public/ chứa favicon và các asset cần URL cố định; Vite sao chép chúng trong mọi build. Asset có owner và cần hashing nên import từ feature/presentation/assets hoặc shared/assets. MSW worker được plugin phát riêng khi VITE_ENABLE_MOCKS=true trong mock/demo; production không copy worker, mock code hay devtools. Build guard kiểm tra các sentinel này và ngân sách JS. Không đặt secrets hoặc worker vào public/.

Typecheck app chỉ có vite/client; test config chứa Vitest/testing-library/Node types, core chỉ ES2022 không DOM/Node/thư viện ngoài. Kiến trúc checker xét cả declarations, import type/dynamic/re-export, source zones, imports sang tests/scripts và cycles. Generator gate typecheck/lint/architecture/core cả mã sinh ra, kiểm tra failure rollback/no overwrite. Gates cơ học hỗ trợ review, không chứng minh business ownership tự động.

Release hiện host root / và có browser target cụ thể trong Vite. Subpath/SSR, SSO/MFA, cross-tab session, upload, realtime, durable offline và telemetry sink cần quyết định tích hợp được ghi ở [capabilities](capabilities.md). Không có SDK hay folder rỗng giả làm những tính năng này.
