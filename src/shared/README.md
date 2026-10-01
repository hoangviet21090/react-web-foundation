# Shared

Contract độc lập feature/app; shared không import các owner này.

| Nhóm               | Trách nhiệm                                                      |
| ------------------ | ---------------------------------------------------------------- |
| domain             | Business core dùng chung                                         |
| application/ports  | AppError, Page, Cancellation, ErrorReporter                      |
| infrastructure     | HTTP/config/i18n/cache/observability adapters                    |
| ui                 | Primitive DOM                                                    |
| components         | RequestError, ConfirmDialog, OfflineBanner, UnsavedChangesDialog |
| hooks              | useOnline, useUnsavedChanges, useNotifications, useDocumentTitle |
| contexts/providers | Notification context/state                                       |
| types              | **Presentation types only**, hiện là notification                |
| lib                | cn, formatters, browser write precondition                       |

Shared/types không chứa entity, DTO hoặc application port. Core và infrastructure bị checker chặn phụ thuộc shared presentation groups. Typed Redux hooks thuộc app/store; useAuth/useProjects thuộc feature.

Xem [structure](../../docs/project-structure.md), [naming](../../docs/naming.md), [capabilities](../../docs/capabilities.md).
