# Thêm feature

## Generator

```sh
npm run feature:new -- catalog --dry-run
npm run feature:new -- catalog
```

Generator tạo read-only vertical slice gồm domain, application/ports/use cases, infrastructure/dto/services/mappers/repositories, presentation/contexts/providers/hooks/queries/components/pages và README tích hợp.

Tên phải kebab-case, tối đa 50 ký tự; từ chối traversal hoặc target đã tồn tại. Không ghi đè feature, không tự sửa routing/permissions/locales/mocks. `check:scaffolding` kiểm tra tên, syntax, naming và các nhóm architecture của output.

## Tích hợp theo thứ tự

1. Chốt entity/invariants tại domain. Không import Zod/React/Axios vào core.
2. Chốt workflow port, input/output/cancellation tại application.
3. Cập nhật DTO/schema, service endpoints, mapper và repository theo backend contract.
4. Thêm MSW handler cùng response envelope. Đừng return raw array khi service yêu cầu envelope.
5. Compose service → repository → use cases tại app/composition-root.ts.
6. Inject qua provider; app route adapter cấp href/callback/quyền vào page.
7. Thêm path/title/permission vào route registry và lazy route; không hardcode navigation trong page.
8. Đặt copy vi/en, form schema và mutation hooks ở đúng owner. Shared chỉ nhận behavior qua props.
9. Kiểm tra invariants, malformed payload, cancellation, denied permission, lỗi ghi và flow browser.
10. Chạy format/check/E2E phù hợp.

Projects là mẫu đầy đủ CRUD. Khi thêm update/delete, định nghĩa concurrency/idempotency ở server trước; đừng tự bật retry mutation. Khi thêm form, dùng dirty guard và giữ input khi API thất bại.

## Chọn state

Server entity → Query. Form → RHF. Query string → URL. Shell preferences → Redux. Component open/close → local state. Client-only state trong feature có thể tạo presentation/state; không mirror server data vào slice.

## Assets và adapter mới

Assets có owner, import qua Vite. SDK/realtime/storage ở infrastructure, ports tại application consumer. Consumer phải dọn subscription/AbortSignal/object URLs khi unmount; viết tests cho lifecycle. Xem [capabilities](capabilities.md) cho các contract còn cần khi thêm upload/offline/SSO.
