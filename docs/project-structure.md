# Cấu trúc và ownership

Đây là base React DOM/Vite dùng chung. `app` nghĩa là lớp lắp ráp ứng dụng web; không phải React Native hoặc Next.js file router.

## Cây source

```text
src/
  main.tsx
  app/
    bootstrap.tsx
    composition-root.ts
    styles.css
    config/feature-flags.ts
    layouts/                 # RootLayout: title/scroll; AppLayout: shell/navigation
    routing/
      routes.ts              # Registry + typed URL builders
      router.tsx
      navigation.ts
      guards/
      route-adapters/
    providers/
    errors/                  # Fatal, route error, 404
    preferences/             # Schema, slice, thunk, storage, DOM sync, controls/page
    observability/           # Browser listeners and reporter context
    store/                   # Store factory and typed bindings
  features/
    auth/
      domain/
      application/ports/
      infrastructure/dto/
      infrastructure/services/
      infrastructure/repositories/
      presentation/pages/
      presentation/components/
      presentation/hooks/
      presentation/contexts/
      presentation/providers/
      presentation/schemas/
    projects/
      domain/project.ts
      application/
        project-use-cases.ts
        ports/project-repository.ts
      infrastructure/
        dto/project-dto.ts
        services/http-project-service.ts
        mappers/project-mapper.ts
        repositories/http-project-repository.ts
      presentation/
        pages/               # List, new, detail, edit
        components/          # ProjectForm
        hooks/               # Queries, mutations, use-case consumer, URL state
        contexts/
        providers/
        queries/             # Cache-key factories
        schemas/             # Form validation + inferred types
        types/               # Feature UI contracts
        constants/
        utils/               # URL codecs
  shared/
    domain/                  # Pure shared domain errors
    application/
      ports/error-reporter.ts
      app-error.ts
      cancellation.ts
      page.ts
    infrastructure/
      config/
      http/
      i18n/locales/
      observability/
      query-client.ts
      cancellation.ts
    ui/                      # shadcn/Radix DOM primitives
    components/              # RequestError, ConfirmDialog, OfflineBanner, UnsavedChangesDialog
    hooks/                   # useOnline, useNotifications, useUnsavedChanges, useDocumentTitle
    contexts/                # NotificationContext
    providers/               # NotificationProvider
    types/                   # Notification UI contracts
    lib/                     # cn, formatters, browser write precondition
  mocks/                     # HTTP handlers + synthetic fixtures
tests/                       # Unit/contract/integration
e2e/production/              # Production artifact tests
scripts/                     # Quality gates + generators
docs/adr/                    # Decisions
deployment/                  # Static hosting
```

## Bảng đặt code mới

| Trách nhiệm                        | Nơi đặt                                              | Dependency hợp lệ                     |
| ---------------------------------- | ---------------------------------------------------- | ------------------------------------- |
| Entity/value object/invariant      | feature/domain                                       | Domain thuần TypeScript               |
| Use case/workflow/input/output     | feature/application                                  | Application/domain                    |
| Repository/service capability port | application/ports                                    | Contract do consumer sở hữu           |
| Zod response schema, wire type     | infrastructure/dto                                   | Boundary bên ngoài core               |
| HTTP route/request/envelope        | infrastructure/services                              | HTTP adapter; không React             |
| DTO → domain                       | infrastructure/mappers                               | Được repository gọi                   |
| Triển khai port                    | infrastructure/repositories                          | Map result và errors                  |
| Trang/form/business component      | presentation/pages, components                       | Injected use cases + shared UI        |
| React/Query/context hooks          | presentation/hooks                                   | Không import concrete feature adapter |
| Query keys                         | presentation/queries                                 | Scope cache của feature               |
| Form schema/inferred values        | presentation/schemas                                 | Không thay domain invariants          |
| View model dùng giữa nhiều UI file | presentation/types                                   | Không DTO/core                        |
| Hằng UI/codec URL                  | presentation/constants, utils                        | Không quy tắc nghiệp vụ               |
| Route/guard/compose nhiều feature  | app                                                  | Outer layer biết dependencies         |
| Client state toàn shell            | app/preferences hoặc nhóm app sở hữu                 | app/store chỉ compose                 |
| Error reporter port                | shared/application/ports                             | Adapter bên ngoài implement           |
| Shared hooks/types/providers       | shared/hooks, types, contexts, providers             | Chỉ presentation, không app/feature   |
| DTO/schema/core type dùng chung    | shared/infrastructure hoặc shared/application/domain | Giữ layer sở hữu                      |

## Shared không phải nơi gom code

Shared/hooks và shared/types hiện có **consumer thật**: offline, notification, unsaved form và document title. Type trong shared/types chỉ dành cho presentation; checker chặn infrastructure/domain/application import nhóm này. DTO, Page, cancellation và application errors vẫn ở layer tương ứng.

Hook biết auth/use cases của feature ở feature/presentation/hooks. Hook biết AppStore ở app/store. Props đơn lẻ đặt cạnh component; type suy ra từ schema đặt cạnh schema.

## Bản đồ mở rộng

| Tình huống                       | Vị trí                                                              | Điều kiện khi triển khai                        |
| -------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------- |
| Nhiều entity/value objects       | domain/entities, domain/value-objects                               | Có invariants riêng                             |
| Workflow lớn                     | application/use-cases                                               | Tách theo hành động và port                     |
| Wizard/client-only feature state | presentation/state                                                  | Không sao chép server cache                     |
| Upload/media                     | feature riêng có application/ports và infrastructure upload adapter | Size/MIME/scan/retention/cancel contract        |
| WebSocket/SSE                    | infrastructure/realtime                                             | Reconnect, dispose, auth, cache invalidation    |
| IndexedDB/offline outbox         | infrastructure/storage + application sync policy                    | Conflict/idempotency/retention quyết định trước |
| Assets                           | feature/presentation/assets hoặc shared/assets                      | Import để bundler xử lý                         |
| Flags remote                     | app/config hoặc feature adapter                                     | Không thay authorization                        |
| Test helpers/fixtures            | tests/helpers, tests/fixtures                                       | Không import từ production                      |
| API codegen                      | infrastructure/generated                                            | Không để generated DTO đi vào domain            |
| SSR/SEO public site              | Entry/renderer adapter riêng hoặc framework phù hợp                 | Đây hiện là SPA, không giả định SSR đã có       |

Các đường dẫn mở rộng là quy ước, không phải module đã triển khai. Không tạo code rỗng hoặc thêm SDK chưa có consumer. Giữ nhóm hiện có để dev học từ ví dụ; chỉ làm phẳng khi lớp trung gian thực sự không còn trách nhiệm.

## Theo một request

Route adapter cấp href/quyền → page/form → hook → injected use case → repository port → HTTP repository → service validate envelope/DTO → backend hoặc MSW. Kết quả đi ngược qua mapper thành domain object; UI không đọc raw Axios response.

Xem [kiến trúc](architecture.md), [thêm feature](adding-a-feature.md), [naming](naming.md), [capabilities](capabilities.md).
