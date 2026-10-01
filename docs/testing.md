# Kiểm thử

## Quality gate

npm run check: Prettier → ESLint type-aware → naming → architecture/cycle/core ES2022 → commit/navigation/naming tooling → generator validation → Vite config → TypeScript → Vitest coverage → production build → bundle guard.

Coverage gate: statements/lines/functions 85%, branches 75% cho domain/application/infrastructure của auth/projects, shared domain/application và HTTP/cancellation adapters. Không phải coverage toàn bộ UI.

## Behavior tests

- Domain/use cases: input, ID, status/version/pagination; invalid input không gọi persistence.
- HTTP/contracts: malformed envelope/DTO, auth, errors, cancellation, replay/races.
- CRUD: read/create/update/delete, read-only permission, 412 stale version, hai writer không ghi đè nhau.
- UI: form errors, preserve input, query invalidation, empty/retry states.
- Platform: env/timezone/currency, preference storage denial, offline hook/write precondition, bounded/redacted diagnostics và listener cleanup.
- Browser: login/refresh/logout/guards, list/filter/history, CRUD, dirty form, offline, responsive layout và axe.
- Production artifact: deep link/lazy form/create, blocked storage, missing chunk recovery; HTTP stubs ở test runner, không MSW trong bundle.

MSW server reset handlers/data/auth sau từng test. Không dùng credentials thật. Test helpers tạo QueryClient/i18n/store mới để tránh state rò giữa cases.

## Chạy

```sh
npm run check
npm run test:e2e
npm run test:e2e:production
```

Chạy tuần tự. Chromium lần đầu: npx playwright install chromium. CI Linux thêm --with-deps. Dev E2E cổng 5174; production preview cổng 4175; dev thường 5173.

Reports ở coverage, playwright-report, test-results đều ignored. Browser mobile là viewport emulation, không native/device certification. Firefox/WebKit và cookies trên backend thật cần test theo product matrix.

Naming/architecture/scaffolding không xác minh business requirement; Vite preview không xác minh Nginx/TLS/upstream. Không disable gate hoặc hạ threshold để che failure.
