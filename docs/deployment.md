# Environment, CI và triển khai

## Các mode

| Lệnh               | Mode        | Mock  | Output               |
| ------------------ | ----------- | ----- | -------------------- |
| npm run dev        | mock        | Có    | Vite dev 5173        |
| npm run dev:api    | development | Không | BFF URL theo env     |
| npm run build      | production  | Không | dist/                |
| npm run build:demo | demo        | Có    | dist/ riêng cho demo |

`VITE_*` là public build-time config. Never put secrets/password/client secrets vào đây. Sửa env sau khi build không đổi bundle; phải build lại. Local override ở .env.local hoặc .env.<mode>.local, ignored. `VITE_ENABLE_MOCKS` chỉ chấp nhận true/false; production từ chối mock.

Schema tại shared/infrastructure/config/env-schema.ts chạy trong Vite config trước build và trong browser. Release build yêu cầu API HTTPS hoặc path cùng origin, từ chối URL chứa credentials/query/fragment và mock flag ngoài mode mock/demo. Build yêu cầu NODE_ENV=production; đây là biến khác với Vite mode. Tên app được đưa vào HTML title và UI; VITE_DEFAULT_LOCALE xác định ngôn ngữ mặc định.

Precedence: process env > .env.<mode>.local > .env.<mode> > .env.local > .env. Do đó VITE_API_BASE_URL trong .env.production thắng .env.local. Override local cho release phải dùng .env.production.local hoặc biến CI. Để build staging với .env.staging/.env.staging.local: npm run build -- --mode staging rồi npm run check:build. Mọi mode build ngoài mock/demo vẫn chịu chính sách release (HTTPS hoặc path cùng origin, không mock).

Repo pin Node bằng .nvmrc/.node-version và engine-strict; npm ci cài đúng lock. `npm prepare` cài Husky local, bỏ qua trên CI hoặc HUSKY=0.

## Static hosting

Starter hiện host tại root /. Vite base, React Router và recovery URL chưa cấu hình subpath; thay cả ba cùng nhau nếu deployment yêu cầu. Host `dist/` bằng static server/CDN. SPA fallback cho routes UI (`/projects/new` → index.html); `/api/*` phải forward tới BFF và giữ status/content type, tuyệt đối không fallback index.html. File asset không tồn tại trả 404. Ví dụ [nginx.conf](../deployment/nginx.conf) chạy static shell; API trả 503 cho tới khi deployment thay block bằng upstream thật.

Cache: hashed `/assets/*` trả 200/206/304 được immutable một năm; index.html và response lỗi (kể cả asset 404) dùng no-store. TLS/HSTS tại ingress. CSP ví dụ chỉ cùng origin, frame-ancestors none, no object; đổi connect-src có review nếu BFF khác origin. Security headers không thể được Vite dev server chứng minh thay cho ingress thật.

public/ được sao chép cho mọi build và dùng cho favicon/robots/font cần URL cố định. Asset có owner cần hashing đặt trong feature/presentation/assets hoặc shared/assets rồi import. Worker MSW được plugin riêng đọc từ package đã pin, chỉ phục vụ/phát trong mode mock/demo khi bật mock; không đặt worker vào public/. check:config xác minh static asset còn trong production và worker chỉ có ở demo; check:build chặn mock/devtools/source maps.

Triển khai atomically và giữ hashed assets của release trước trong khoảng thời gian team quy định để tab đang mở vẫn tải được lazy chunks. Khi chunk đã mất, app hiển thị recovery và tải lại document bằng thao tác người dùng; không tự reload vòng lặp hoặc tự khôi phục form chưa lưu.

Không đặt production trên origin từng phục vụ demo/MSW. Nếu môi trường demo cũ có service worker, unregister worker trước khi kiểm tra production, không tự xóa service worker của ứng dụng khác.

## CI đã cung cấp

- GitHub: .github/workflows/ci.yml, dependencies và actions pin, fetch history cho commitlint, quality/E2E/audit, artifact dist/report.
- Azure DevOps: azure-pipelines.yml equivalent quality gate, không tự publish release.
- Dependabot: PR cập nhật npm/GitHub Actions theo tuần, không auto-merge.
- Build không có token thật; dev tests dùng MSW. Browser binaries được cài trong job. Sau dev E2E, test:e2e:production build lại rồi kiểm tra dist bằng Chromium với API stub trong test runner; không bật MSW trong app production.
- Maintainer cấu hình branch protection/build validation và chọn base/remote. Workflow đã được push lên GitHub; không suy ra CI đang xanh từ checks local. Azure template phải được đăng ký pipeline; maintainer kiểm tra remote runs và required checks trên host được chọn.

Chưa cấu hình deployment credentials, domain, SSO/BFF upstream, environment approval hoặc release pipeline vì team chưa cung cấp. Không tự publish/bump version để biến scaffold thành một release.

## Mở rộng production

Trước khi tích hợp Project thật cần contract BE/auth, authorization server, storage/upload policy, telemetry sink theo chính sách dữ liệu, data retention, browser support và acceptance tests của sản phẩm. Đây là công việc tích hợp product, không phải mock capability của starter.

## Trạng thái xác minh

Xem [rà soát cấu hình](configuration-audit.md) để phân biệt checks local và phần cần backend/hạ tầng. Vite preview dùng cho smoke test, không phải production server. Chưa chạy nginx -t/HTTP header probes trên ingress thật; template phải được deployment team kiểm tra trước khi áp dụng.
