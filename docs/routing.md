# Routing và navigation

Registry `app/routing/routes.ts` sở hữu path/ID/title/permission. Endpoints API ở feature infrastructure; không dùng browser route làm HTTP contract.

| Route                     | Quyền           |
| ------------------------- | --------------- |
| /login                    | Guest           |
| /projects                 | projects:read   |
| /projects/new             | projects:create |
| /projects/:projectId      | projects:read   |
| /projects/:projectId/edit | projects:update |
| /settings                 | Authenticated   |

App route adapters cấp href/callback và quyền vào feature page. Feature không import app; Projects không import auth.

```tsx
<Link to={APP_ROUTES.newProject.path}>...</Link>;
navigate(projectsHref({ page: 2, search: searchText }));
navigate(projectHref(project.id));
```

Dynamic ID được encode ở builder. Query codec giữ tham số không thuộc feature, normalize page/search; đổi search về page 1. Typed builder được kiểm tra bằng routing tests. Không nối URL bằng string rải rác.

RequireAuth đóng protected UI khi checking/error/signing-out. Return URL được kiểm tra local origin/path, loại login loops và control characters. Guard component không bảo vệ loader/action tự gọi API; khi thêm loader/action phải xác minh session tại đó.

RootLayout cập nhật title từ registry, locale/app name và ScrollRestoration. AppLayout focus main-content khi pathname đổi, dùng preventScroll để không phá scroll restoration. 404 quay về bằng SPA Link; fatal/chunk error cho phép document navigation khởi động lại app.

Form dùng router blocker + beforeunload. Confirm leave giữ hoặc bỏ input; request đang chạy vẫn có thể đã tạo side effect trên server nếu người dùng rời trang. Không tự retry write hoặc tự lưu dữ liệu nhạy cảm vào storage.
