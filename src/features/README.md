# Feature modules

Auth minh họa identity/session; Projects minh họa CRUD, concurrency, form và cache.

- domain: entity/invariant thuần TypeScript.
- application: use case/workflow và ports.
- infrastructure: dto/services/mappers/repositories.
- presentation: pages/components/hooks/contexts/providers/queries/schemas/types/constants/utils.

Giữ nhóm có trách nhiệm rõ để dev dùng làm mẫu, không làm phẳng vì ít file. Feature không import internals của feature khác hoặc app; app compose qua dependency/props.

Tạo feature bằng `npm run feature:new -- catalog`, đọc README của output và [recipe](../../docs/adding-a-feature.md). Không sao chép toàn bộ Projects rồi giữ lại endpoint/model không liên quan.
