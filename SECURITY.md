# Security

Template không chứa production credentials. Khi adopt, cấu hình kênh báo lỗi riêng/private security reporting; không đăng public issue chứa dữ liệu người dùng hoặc secrets.

- Access token trong memory; refresh cookie do backend cấp HttpOnly/Secure với SameSite/Path/CORS/CSRF phù hợp.
- Không persist tokens hoặc server data trong Redux/localStorage. Preference storage chỉ theme/language.
- sessionStorage chỉ chứa bản đồ vị trí cuộn dạng số của React Router; không chứa thông tin phiên đăng nhập.

- VITE_* là public build-time values, không phải secret store.
- DTO/env/form validate tại boundaries; domain kiểm tra invariant độc lập.
- Route/feature flag chỉ điều khiển UI; server bắt buộc kiểm tra permission và resource ownership.
- Protected HTTP client không gửi bearer sang endpoint ngoài base được cấu hình.
- GET retry transient có giới hạn; mutation không blind retry/queue offline. Write replay sau 401 yêu cầu backend chưa thực hiện side effect.
- Error reporter chỉ giữ source/kind/timestamp; không messages, stacks, headers, URLs, identifiers hoặc payloads. Sink bên ngoài cần review chính sách dữ liệu.
- Demo cookie foundation_mock_session là marker không bí mật, không HttpOnly; chỉ để demo, không có trong production bundle.
- Nginx template có CSP/security headers nhưng phải kiểm tra trên ingress thật. Không deploy demo/MSW origin làm production.
- Dependencies pin/lock; CI audit và update PRs. Không coi một lần audit sạch là chứng nhận bảo mật vĩnh viễn.

Chưa tích hợp BE/SSO, chưa chứng minh refresh rotation/reuse detection, tenant isolation hay multi-tab session coordination. Xem [authentication](docs/authentication.md) và [capabilities](docs/capabilities.md).
