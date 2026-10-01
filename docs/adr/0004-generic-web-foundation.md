# ADR 0004: Base web dùng chung

Status: Accepted

## Bối cảnh

Mục tiêu được đổi thành template web có thể dùng cho nhiều sản phẩm, với các ví dụ thực tế cho dev mở rộng ngay từ đầu.

## Quyết định

- Package react-web-foundation; Projects thay ví dụ nghiệp vụ trước.
- Conventional Commits thay convention mã US bắt buộc.
- Auth permissions resource:action, không gắn tập quyền Projects vào core auth.
- Full CRUD sample có version/If-Match và conflict handling.
- Shared presentation groups có implementation thật: hooks/types/contexts/providers/components.
- Offline, notifications, unsaved form, route metadata, flags và redacted error reporter được nối vào runtime.
- Feature generator tạo slice có thể tích hợp theo hướng dẫn; không tự sửa global routing/permissions/mocks.
- Contracts/mocks là ví dụ rõ ràng, không tuyên bố tương thích mọi backend.
- Giữ architecture boundaries và nhóm onboarding; không thêm SDK chưa có contract.

## Hệ quả

Dev có source dùng được và ma trận capability. Thay domain/backend không cần đổi inner dependency rule. Các phần SSO, upload, realtime, durable offline, tenant isolation và deployment vẫn cần quyết định product được ghi trong capabilities.md.

Thư mục local/branch chưa đổi; metadata và tài liệu là generic. Chưa commit/push/deploy hoặc tạo remote.
