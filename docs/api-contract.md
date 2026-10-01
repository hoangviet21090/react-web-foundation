# API contract mẫu

Base URL: VITE_API_BASE_URL, mặc định /api. Endpoints và envelope là ví dụ có thể thay tại infrastructure khi adopt sản phẩm khác. Domain/application không biết Axios hoặc wire envelopes.

## Envelope

```json
{
  "success": true,
  "result": {},
  "errorCode": null,
  "errorDetails": null,
  "message": null
}
```

Mọi key bắt buộc. Lỗi có success=false, result=null; errorCode là string/number/null, errorDetails/message là string/null. Services validate và trả toàn bộ ApiResponse; repositories đọc result/map domain/errors. Không chấp nhận raw/envelope union hoặc success payload thiếu key.

## Projects

| Method | Endpoint       | Request                                       | result                                |
| ------ | -------------- | --------------------------------------------- | ------------------------------------- |
| GET    | /projects      | page=1, pageSize=5, search=""                 | { items, totalCount, page, pageSize } |
| GET    | /projects/{id} | ID được encode                                | Project                               |
| POST   | /projects      | { name, budget }                              | Project, HTTP 201                     |
| PUT    | /projects/{id} | { name, budget, status }, If-Match: "version" | Project version mới                   |
| DELETE | /projects/{id} | If-Match: "version"                           | { deleted: true }                     |

Project: id/reference/name, budget nguyên 1..1e9 USD, currency=USD, status=draft|active|archived, createdAt ISO UTC, version nguyên dương. Name trim 2..100 ký tự.

PUT/DELETE thiếu hoặc stale If-Match trả 412. Mock cập nhật version atomically sau khi đã đọc/validate body; hai writer cùng version chỉ một request thành công. Unknown ID trả 404. Demo role được phép read/create/update/delete; viewer chỉ read. Đây là mock authorization, không chứng minh tenant isolation.

400/422 map validation; 409/412 map conflict; 429 rate-limit; timeout giữ thông báo riêng. Mutation không retry network/5xx và không xếp hàng offline. POST chưa có idempotency-key contract: sau timeout cần kiểm tra server state trước khi gửi lại.

## Auth

POST /auth/login nhận {email,password}; /auth/refresh và /auth/logout dùng browser cookie. Login/refresh trả { accessToken, expiresInSeconds, user }; logout trả {loggedOut:true}. User có id/name/email và permissions dạng resource:action. Xem [session lifecycle](authentication.md).

401 protected request có thể replay một lần sau refresh nếu backend bảo đảm chưa thực hiện side effect trước khi trả 401. 403 không refresh. Response token không cache; refresh cookie do backend cấp HttpOnly/Secure theo deployment/CSRF policy.

## Mock và backend thật

MSW trả cùng envelope và DTO schema, chạy qua Axios/repositories/use cases. Không nhánh mock trong nghiệp vụ production. Dữ liệu synthetic reset khi reload; không durable database.

[OpenAPI](openapi.yaml) mô tả contract mẫu. Khi API sản phẩm khác shape, sửa DTO/service/mapper/OpenAPI/mock/tests cùng nhau. Frontend không sửa payload lỗi tại component hoặc âm thầm chấp nhận nhiều định dạng.
