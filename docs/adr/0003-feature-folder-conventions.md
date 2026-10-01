# ADR 0003: Nhóm thư mục theo trách nhiệm trong từng layer

Status: Accepted

## Bối cảnh

Starter ban đầu có ít file nên presentation/infrastructure khá phẳng. Team cần nhìn cây thư mục để biết component, hook, DTO, schema và type mới thuộc đâu khi mở rộng.

## Quyết định

Giữ feature-first Clean Architecture. Nhóm infrastructure thành dto/services/repositories. Nhóm presentation thành pages/components/hooks/contexts/providers/schemas; thêm queries/types/constants/utils theo nội dung thực tế của feature.

Giữ shadcn primitives tại shared/ui; component ghép độc lập feature tại shared/components. components.json phân biệt hai alias và tiếp tục dành shared/hooks cho hooks dùng chung khi có consumer. Wrapper shadcn chuẩn hóa utility imports trong các thư mục này, kể cả thư mục con.

Không tạo global types/services hoặc mọi thư mục trống cho từng feature. Type thuộc layer sở hữu; DTO/form type suy ra từ schema, props đơn lẻ colocate. Application/domain nhỏ tiếp tục giữ file model/use case trực tiếp và ports trong application/ports.

## Hệ quả

Dev có ví dụ thực tế Auth/Projects và bảng nơi đặt file trong [project structure](../project-structure.md). Import dài hơn nhưng ownership rõ. Không giữ shim/re-export cho đường dẫn nội bộ cũ.

Cấu trúc không đổi URL, API, session lifecycle hay nghiệp vụ. Core compilation và architecture gate tiếp tục áp dụng cho thư mục con; infrastructure cũng bị chặn import shared/components. Code review vẫn cần đánh giá trách nhiệm, không chỉ kiểm tra tên thư mục.

## Làm rõ khi rà soát ngày 01/10/2026

Giữ các nhóm có trách nhiệm rõ làm ví dụ cho dev; không làm phẳng vì một folder chỉ có một file. Preference toàn web thuộc app/preferences, store factory/bindings ở app/store. Shared hooks/types không được tạo bằng code rỗng; nhóm type tiếp tục theo layer sở hữu. Xem [rà soát và ví dụ hiện tại](../structure-review.md).
