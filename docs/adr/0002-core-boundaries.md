# ADR 0002 — Core contracts và composition cho web

Status: Accepted.

## Context

Review phát hiện platform type AbortSignal trong Project port, state phiên ở domain và HTTP metadata trong error dùng chung. app root cũng trộn router, layout, providers và error views.

## Decision

Domain giữ model/invariants và DomainError. Workflow interfaces đặt ở application/ports. Session state/credentials nằm cùng auth application; browser/UI snapshot không chứa access token.

shared/application sở hữu Cancellation, OperationCancelledError và AppError. AppError gồm kind, code tùy chọn và retryable; không mang HTTP status, request/response, headers hoặc raw cause. Retryable là eligibility cho retry read, không cho phép retry write.

Query adapter chuyển AbortSignal thành Cancellation. Repository chuyển Cancellation thành transport AbortSignal trong scope request, luôn unsubscribe ở finally. Axios cancellation được map thành OperationCancelledError trước khi qua application boundary. HTTP service vẫn có thể dùng AbortSignal và trả API envelope đầy đủ.

HTTP adapter chỉ tạo HttpError đã sanitize. Repository boundary map HttpError thành AppError, loại status/cause trước khi trả về use case. DomainError được giữ riêng; UI phân loại cả hai bằng getErrorKind và copy i18n, không render raw backend message.

app giữ bootstrap/composition ở root; nhóm router, guards và route adapters trong routing; nhóm layouts, providers, errors và store riêng. Không tạo global navigation singleton hoặc thêm wrapper bắt buộc cho mọi page.

check:architecture kết hợp import/cycle check với check:core. tsconfig.core.json chỉ cấp ES2022 và types=[]; core không phụ thuộc DOM/Node ambient declarations. Full typecheck/build cũng bao gồm cấu hình này.

## Consequences

Thêm hai adapter cancellation nhưng core test không cần browser globals. Adapters phải dọn listener cả khi request thành công, lỗi hoặc hủy. Backend adapters mới phải phân loại retryable trước khi trả lỗi về use case; không để UI suy luận retry từ HTTP status.

Đổi đường dẫn import nội bộ; public browser routes/API contract không đổi. Tài liệu và test imports được cập nhật theo cấu trúc thật. Không dùng native library/workflow hoặc di chuyển implementation sang repository mobile.
