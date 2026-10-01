# Rà soát cấu trúc foundation

Repo đã chuyển mục tiêu từ starter nghiệp vụ cụ thể thành base React web dùng chung. Package và thư mục vật lý cùng tên react-web-foundation. Source đã được push lên remote cùng tên; branch bootstrap không phải convention bắt buộc cho dev mới.

## Quyết định hiện tại

- Feature-first Clean Architecture; giữ responsibility groups làm ví dụ thực tế.
- Auth và Projects là hai module mẫu; Projects có list/create/detail/edit/delete, mapper, query keys, form schema, view types và URL codecs.
- App sở hữu composition/routing/config/preferences/observability/store.
- Shared có hooks/types/contexts/providers với consumer thật. Shared/types chỉ là UI contract; core/DTO ở layer sở hữu.
- Formatter ngày/tiền và cn có file riêng; Page ở application.
- Preferences tập trung cùng owner; store factory không chứa preference workflow.
- Route title/scroll/focus và errors có ownership rõ.
- Naming/core/architecture/scaffolding gates là quy tắc cơ học; semantic ownership vẫn cần review.
- Git convention dùng Conventional Commits, không bắt buộc workflow của một tổ chức.

Không làm phẳng nhóm chỉ vì một file. Không tạo dummy services/types/hooks để giả vờ có capability. Các tình huống đã triển khai và phần cần contract sản phẩm được ghi ở [capabilities](capabilities.md).

## Tài liệu chuẩn

[Structure](project-structure.md), [architecture](architecture.md), [naming](naming.md), [feature recipe](adding-a-feature.md), [configuration audit](configuration-audit.md).

Kết quả quality gate và browser tests được cập nhật ở [configuration audit](configuration-audit.md). Bản rà soát mới bổ sung source-zone/import enforcement, generated-code checking, cấu hình UI/HTTP/cache và tài liệu onboarding. Backend và hosting thật vẫn cần xác minh ở môi trường adopt.
