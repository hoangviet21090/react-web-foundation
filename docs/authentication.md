# Authentication và refresh session

Status: implemented against a **proposed web contract**, approved for this starter. Backend integration remains unconfirmed. Không dùng endpoint/token flow của mobile.

## Chạy local

`npm run dev` → mở /projects hoặc /projects/new sẽ chuyển tới /login. Đăng nhập demo:

| Tài khoản           | Mật khẩu minh họa | Quyền                              |
| ------------------- | ----------------- | ---------------------------------- |
| demo@example.test   | Demo123!          | projects:read/create/update/delete |
| viewer@example.test | Demo123!          | projects:read                      |

Tài khoản này chỉ thuộc MSW. Không dùng credential thật trên mock. Access token mock sống 30 giây; yêu cầu Project tiếp theo sau khi hết hạn sẽ nhận 401, refresh rồi gửi lại. Phiên mock sống 15 phút và được gia hạn khi refresh. Không có timer giữ phiên sống khi idle.

MSW **không cấp được HttpOnly cookie thật** từ một backend. Nó dùng cookie marker đọc được `foundation_mock_session` (vai trò + thời hạn, không chứa token/secret) để demo reload; access token mock ngẫu nhiên nằm trong memory. Marker và mock handlers không có trong production bundle. Fixture Project là dữ liệu synthetic dùng chung; không mô phỏng đầy đủ tenant/data isolation.

## Contract giả định

Base `VITE_API_BASE_URL`. Mọi endpoint dùng chuẩn `ApiResponse`; service trả envelope đầy đủ, repository đọc result.

| Endpoint           | Request                                | Successful result                       |
| ------------------ | -------------------------------------- | --------------------------------------- |
| POST /auth/login   | { email, password }                    | { accessToken, expiresInSeconds, user } |
| POST /auth/refresh | {} + refresh cookie tự gửi bởi browser | { accessToken, expiresInSeconds, user } |
| POST /auth/logout  | {} + refresh cookie                    | { loggedOut: true }                     |

`user`: `{ id, name, email, permissions: string[] }`.
Permission được validate theo resource:action. Không trả refreshToken trong JSON. API Project dùng `Authorization: Bearer <accessToken>`.

BE thật phải cấp refresh cookie qua `Set-Cookie` với `HttpOnly; Secure; SameSite=Strict; Path=/api/auth` cho same-site deployment mẫu; cookie name đề xuất `refresh_token`. Path thay theo public gateway prefix thực tế. Login/refresh rotate cookie; logout revoke session/token family và expire cookie cùng name/path/domain. Refresh trả 401 khi phiên thiếu/hết hạn/bị thu hồi. Các response chứa token dùng `Cache-Control: no-store`.

Cookie/XSRF và CORS phụ thuộc deployment. Axios đã có credentials + `XSRF-TOKEN`/`X-XSRF-TOKEN` same-origin. Backend/ingress phải cấp CSRF cookie trước cookie-authenticated writes (bao gồm login), kiểm tra CSRF/Origin và CORS; frontend không tự tạo proof CSRF. Nếu chọn SSO khác site hoặc cross-origin BFF phải chốt cookie/CORS/CSRF contract và bổ sung integration tests trước khi deploy.

## Lifecycle và ownership

- `features/auth/domain`: user, permission, login input invariants.
- `features/auth/application`: auth-session use cases, auth-state, auth-credentials và ports/auth-repository. Access token chỉ nằm trong closure; state không biết HTTP status.
- `features/auth/infrastructure`: Zod DTO, HTTP service, repository mapping credentials và lỗi transport sang application failure.
- `features/auth/presentation`: login form, context và subscription. Snapshot chỉ có state/user/error, không chứa token.
- `app`: bootstrap restore, composition, route guard, nối permission với Project qua props. Projects không import feature auth.
- `shared/infrastructure/http`: structural auth port, bearer injection, refresh/replay và cancellation; không import auth feature.
- Redux giữ preferences. TanStack Query giữ Project/server state. Password/token không lưu trong Redux, Query cache, localStorage hay sessionStorage.

Các trạng thái: checking → authenticated/anonymous/error. Logout chuyển ngay sang signing-out, xóa token và dữ liệu cache trước khi chờ server. Refresh/network/contract failure đóng route; 401/403 về login, lỗi kỹ thuật có nút retry. Logout lỗi kỹ thuật không thông báo thành công; giữ màn retry xác nhận revoke. Reload vẫn hỏi server: nếu lần logout trước không tới được BE thì cookie thật có thể còn hợp lệ.

## Refresh và race handling

1. Bootstrap luôn gọi refresh một lần để khôi phục phiên trước khi mount nội dung protected. Không gửi Project request lúc checking.
2. Auth endpoints dùng HTTP client riêng, **không có refresh interceptor**.
3. Protected HTTP client gắn token memory và session generation vào request; chỉ cho URL tương đối thuộc BFF đã cấu hình.
4. Khi nhận 401, cùng session chỉ có một refresh promise; các request chờ chung. 401 đến muộn của token cũ tái sử dụng token mới nếu refresh đã xong.
5. Mỗi request chỉ replay một lần. Replay tiếp tục 401 thì invalidate, không loop.
6. 403 không refresh; hiển thị thiếu quyền. Không retry login/refresh/logout tự động.
7. Abort một caller đang đợi refresh chỉ hủy caller đó; refresh tiếp tục cho các caller khác.
8. Logout/invalidate/login thay session generation, xóa Query cache và cancel active queries. HTTP response cũ (kể cả 200) bị bỏ, không đưa vào cache/UI mới. Các write đã tới BE không thể được hoàn tác chỉ bằng cancellation.
9. Logout chờ login/refresh đang chạy kết thúc trước khi revoke cookie để response Set-Cookie đến muộn không hồi sinh phiên. Client từ chối nhận credential của generation cũ.

Refresh hiện reactive theo 401. `expiresInSeconds` được validate theo contract nhưng không dùng để tự tin rằng token còn hợp lệ, không decode JWT hay thêm background timer. BE là nguồn quyết định token.

**Replay writes:** BE phải trả 401 trước khi thực hiện bất kỳ side effect nào. Đây là điều kiện của contract mẫu để replay POST một lần sau refresh. Network/5xx không replay mutation; khi BE không bảo đảm điều kiện này hoặc cần retry write, phải có idempotency contract trước.

## Routing và authorization

/login là guest route; authenticated user được chuyển về returnTo nội bộ đã kiểm tra hoặc /projects. Protected routes dùng RequireAuth. /projects cần projects:read, /projects/new cần projects:create; nút tạo ẩn nếu thiếu quyền. Deep-link/query/hash được giữ trong router state, không chấp nhận external URL/\\/control characters.

Guard không thay authorization server. MSW cũng kiểm tra token và permission ở GET/POST/PUT/DELETE Project để không chỉ test việc ẩn nút. Khi thêm loader/action thực hiện API ở router, phải kiểm tra session ở loader/action; parent component guard không ngăn router chạy loaders song song.

## Giới hạn tích hợp còn lại

- Chưa nối BE/SSO thật, chưa xác minh cookie flags, CSRF, refresh rotation/reuse detection và server revoke.
- Refresh single-flight là trong một app instance/tab. Cross-tab refresh rotation coordination và logout broadcast chưa triển khai; BE phải chốt semantics nhiều tab trước khi áp dụng rotating cookie.
- Role/permission hiện là contract mẫu; chưa có tenant switching, MFA, password reset hoặc step-up authentication.
- Scope kiểm thử browser: Chromium desktop + mobile viewport; chưa kiểm tra cookie policy trên Safari/thiết bị thật.

## Kiểm thử

Unit/integration kiểm tra concurrent/late 401, refresh failure, replay giới hạn, cancellation, identity change, logout/login race, invalid contract và bearer scope. Browser kiểm tra deep link, login sai/đúng, reload restore, expiry, refresh failure, logout, viewer permissions, storage và accessibility.

Tham khảo: [Axios interceptors](https://axios-http.com/docs/interceptors), [Axios cancellation](https://axios-http.com/docs/cancellation), [cookie attributes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie).
