# ADR 0001 — Feature-oriented Clean Architecture

Status: Accepted for bootstrap. Date: 2026-09-30.

## Context

Repo web mới cần dễ mở rộng, ranh giới nghiệp vụ rõ và conventions có kiểm tra. Chưa có backend/identity/base branch chính thức; template không áp quy trình riêng của tổ chức.

## Decision

Dùng modular monolith frontend theo feature. Domain/application là plain TypeScript, repository ports + factory DI. Composition root ở app; không DI container/decorator. Repository adapter tách HTTP service/base envelope và domain mapping.

React Router data mode + lazy routes; Redux cho client state; TanStack Query cho server state; React Hook Form cho form. MSW intercept HTTP để mock không tạo nhánh logic riêng trong service. Zod ở các boundary; validation business ở domain độc lập.

React 19, Vite 8, Router 7, TanStack Query 5, Tailwind 4 và ESLint 10. TypeScript 5.9 được giữ vì typescript-eslint hiện chưa nhận TypeScript 7. Không dùng --force/legacy-peer-deps. Accessibility được kiểm tra bằng axe trên browser thật; không đưa plugin JSX đang chưa hỗ trợ ESLint 10 vào dependency graph. Mọi exact version có trong package.json/lock.

Node 24 LTS line, pin 24.18.1 phù hợp máy hiện tại. CI dùng cùng file pin. Browsers hiện đại phù hợp Tailwind v4; legacy browser phải được product chốt riêng.

## Consequences

Có thêm lớp mapper/provider nhưng tests không cần React để kiểm tra nghiệp vụ. Không trả DTO trực tiếp sang UI. Feature không import chéo; khi cần phối hợp tạo orchestration ở app và ghi ADR cho public contracts.

Bổ sung công nghệ mới qua adapter. Chưa tách monorepo/microfrontend/shared-web-lib cho đến khi có consumer và release ownership thực tế.

## References

- [Vite getting started](https://vite.dev/guide/)
- [React Router data mode](https://reactrouter.com/start/data/installation)
- [Redux Toolkit default middleware](https://redux-toolkit.js.org/api/getDefaultMiddleware)
- [TanStack Query defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [shadcn with Vite](https://ui.shadcn.com/docs/installation/vite)
- [MSW browser integration](https://mswjs.io/docs/integrations/browser/)
