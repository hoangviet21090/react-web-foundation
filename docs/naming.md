# Naming conventions

Tên phản ánh trách nhiệm; vị trí theo [ownership](project-structure.md).

| Loại                         | Convention                         | Ví dụ                                                               |
| ---------------------------- | ---------------------------------- | ------------------------------------------------------------------- |
| Folder/file                  | lowercase kebab-case               | project-form.tsx, route-adapters                                    |
| Component/type/interface     | PascalCase                         | ProjectForm, ProjectRepository                                      |
| Function/value               | camelCase                          | createProjectUseCases, projectKeys                                  |
| Hook                         | useX trong use-*.ts(x)             | useProject, useOnline                                               |
| Typed Redux bindings         | *-hooks.ts                         | store-hooks.ts                                                      |
| Page/layout/provider/context | Suffix rõ vai trò                  | project-detail-page.tsx, projects-provider.tsx, projects-context.ts |
| Concrete transport adapter   | Nêu technology và vai trò          | http-project-service.ts                                             |
| DTO/form                     | *-dto.ts, *-schema.ts              | project-dto.ts, project-form-schema.ts                              |
| State/thunk                  | *-slice.ts, *-thunks.ts            | preferences-slice.ts                                                |
| Utility                      | Tên hành vi cụ thể                 | format-money.ts, project-list-search.ts                             |
| Test/declaration             | *.test.ts(x), *.spec.ts(x), *.d.ts | platform.test.tsx, i18next.d.ts                                     |
| Contract constants           | UPPER_SNAKE_CASE                   | APP_ROUTES, PROJECT_ENDPOINTS                                       |

Không viết hoa mọi const: schema/factory/query-key object vẫn camelCase. DTO type suy từ schema; Props đơn lẻ cạnh component. ApiResponse/PaginatedResult là transport contracts; không namespace BASE hoặc prefix I/T cho type mới. Wire field giữ đúng backend; mapper đổi tên khi cần.

Dùng .tsx cho JSX/page components; .ts cho module không JSX. README.md/config/generated file có tên theo công cụ. Không dùng helpers/utils/common.ts làm nơi gom trách nhiệm; folder presentation/utils hợp lệ khi từng file bên trong có tên cụ thể.

Named exports; import type. Alias @ giữa layer/owner lớn, relative ngắn trong cùng layer. App là một composition layer. Không barrel toàn feature hoặc giữ re-export ở đường dẫn cũ sau move nội bộ.

Context/provider/consumer hook tách file để ownership và Fast Refresh rõ ràng. Functions dùng động từ đúng việc: create/validate/parse/to/format; use chỉ React hook. Schema/core/view type giữ đúng layer dù cùng tên business concept.

## Gates

check:naming quét src: folder/file kebab-case, exported top-level type/interface/class/enum PascalCase, hook modules use-* hoặc *-hooks, page dùng .tsx. Tests/declarations chỉ kiểm tra filename; namespace/wire fields/config không bị áp symbol rule chung.

check:tooling có positive/negative cases; check:scaffolding kiểm tra generated sources. ESLint kiểm tra Hooks, Fast Refresh, type imports, hardcoded navigation. Architecture gate kiểm tra import/cycle và core compiler.

Ý nghĩa tên, business ownership, public API hợp lý và quyết định extract shared vẫn cần review.
