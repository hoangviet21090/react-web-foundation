# Architecture review

Source dùng inward dependencies với core TypeScript không DOM/Node. Use cases phụ thuộc ports; concrete HTTP repositories map wire DTO/errors; app compose providers và router.

Các nhóm presentation/infrastructure được giữ làm ví dụ mở rộng. Shared UI/hooks/types/contexts/providers là outer layer; infrastructure không import chúng. Application errors không giữ raw Axios metadata. Domain vẫn validate khi caller bỏ qua form.

Projects minh họa full CRUD, optimistic concurrency bằng version, cancellation, form dirty guard và cache invalidation. Auth độc lập Projects và dùng permission dạng resource:action.

Xem [structure review](structure-review.md), [architecture](architecture.md), [capabilities](capabilities.md) và [ADR generic foundation](adr/0004-generic-web-foundation.md). Kiểm tra import/cycle/core không chứng nhận backend integration hoặc mọi business rule của sản phẩm.
