# Bắt đầu phát triển

## Cài đặt và chạy

Dùng Node theo .node-version (24.18.1), npm 11.x và lockfile có sẵn. Trước khi làm việc, kiểm tra git status và base branch của team. Trên PowerShell bị chặn npm.ps1, dùng npm.cmd/npx.cmd.

```sh
npm ci
npm run dev
```

Mở http://127.0.0.1:5173. Demo có hai tài khoản với mật khẩu Demo123!: demo@example.test có quyền CRUD; viewer@example.test chỉ đọc. Dữ liệu giả reset khi reload. Thử tạo/sửa project, điều hướng khi chưa lưu, đổi ngôn ngữ/theme và đăng nhập bằng viewer để hiểu các luồng mẫu.

Dùng backend thật: đặt VITE_API_BASE_URL trong .env.development.local rồi chạy npm run dev:api. Sao chép các key cần thiết từ .env.example; không đưa credentials/token vào VITE_*. Mode và precedence được giải thích ở [deployment](deployment.md).

## Đọc và lần theo source

1. [Bản đồ cấu trúc](project-structure.md): ownership và nơi đặt code mới.
2. [Kiến trúc](architecture.md): dependency rule, ports, injection và state ownership.
3. [Cấu hình thư viện](library-configuration.md): file nào sở hữu từng cấu hình và cách mở rộng.
4. [Naming](naming.md), [feature recipe](adding-a-feature.md) và [quy trình đóng góp](../CONTRIBUTING.md).

Lần theo Projects: app/routing/route-adapters/projects-route.tsx → presentation/pages/projects-page.tsx → presentation/hooks/use-projects.ts → application/project-use-cases.ts → application/ports/project-repository.ts → infrastructure/repositories/http-project-repository.ts → infrastructure/services/http-project-service.ts. Composition-root tạo adapter rồi inject qua provider; mock nằm ở src/mocks và dùng cùng HTTP contract.

Folder domain/application/infrastructure/presentation thể hiện dependency rule. Các nhóm components/hooks/types/queries/schemas/providers trong presentation thể hiện trách nhiệm React. Shared có các nhóm tương tự cho code dùng chung thực sự; không chuyển nghiệp vụ vào shared chỉ để tránh tạo file trong feature.

## Thêm feature đầu tiên

```sh
npm run feature:new -- catalog --dry-run
npm run feature:new -- catalog
```

Generator tạo slice đọc danh sách, đã format và có gate TypeScript/lint/architecture/core. Nó giữ nguyên routing, permissions, locales và mocks; dev tích hợp theo README được sinh và [recipe](adding-a-feature.md). Projects là ví dụ mở rộng CRUD/form/version conflict, không phải lớp cha để mọi module kế thừa.

Khi thêm trang, app cấp URL/quyền/callback qua route adapter; feature dùng use cases được inject. Khi thêm API, cập nhật DTO/schema → service → mapper/repository → mock và tests cùng lúc. Khi thêm UI, dùng shared/ui, semantic tokens và locale trước; business component đặt trong feature/presentation/components.

```sh
npm run ui:add -- dialog
```

CLI shadcn được pin theo lockfile; registry từ xa vẫn có thể thay đổi. Review code và dependency được sinh, không overwrite primitive tùy biến thiếu review. components.json đã map về các nhóm shared của repository.

## Kiểm tra trước khi bàn giao

```sh
npm run format
npm run check
npx playwright install chromium
npm run test:e2e
npm run test:e2e:production
git diff --check
```

Chạy suites tuần tự. Playwright sở hữu port 5174 (dev) và 4175 (production); dừng server riêng trên các port này trước khi chạy. Cấu hình không tái sử dụng server khác để tránh kiểm tra nhầm source/mode. CI chạy lại gates; hook local không thay thế CI.

PR mô tả hành vi thay đổi, checks đã chạy và giới hạn còn lại. Không commit env local, secrets, report, agent files hoặc thay đổi ngoài task. Khi adopt template, team chọn branch protection, backend/auth contract, browser matrix và deployment; xem [capabilities](capabilities.md).

## Xử lý tình huống thường gặp

| Triệu chứng                              | Việc cần kiểm tra                                                                                    |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| npm ci báo engine không phù hợp          | Chọn đúng Node/npm, không tắt engine-strict để bỏ qua                                                |
| Trang API thật báo contract error        | Response envelope/DTO theo API đã chốt; sửa boundary + mocks/tests, không thêm raw/envelope fallback |
| Theme/chart/sidebar mất màu              | Token tại app/styles.css, CSS dùng class đầy đủ; tránh ghép chuỗi tên class động                     |
| Hook báo thiếu provider                  | Composition-root, AppProviders hoặc feature provider tại adapter                                     |
| Không có thay đổi sau sửa env production | VITE_* được đóng vào build; build/deploy lại                                                         |
| Stale version khi lưu                    | Giữ input, xem bản mới nhất rồi giải quyết conflict; không blind retry                               |
| Offline write thất bại                   | Đây là chính sách chủ động; outbox/sync cần contract riêng                                           |
| Lazy chunk mất sau deploy                | Dùng recovery UI, giữ assets release trước theo deployment policy                                    |
