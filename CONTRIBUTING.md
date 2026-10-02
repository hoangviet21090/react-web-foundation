# Quy trình phát triển

Đọc [README.md](README.md) để biết vị trí code và cách chạy. Chọn base branch theo team; giữ thay đổi có sẵn của người khác.

```sh
git status --short
git fetch origin
git switch -c feat/project-search origin/main
npm ci
```

## Quy ước code

- Folder/file dùng kebab-case: `project-form.tsx`, `use-projects.ts`. Component/type dùng PascalCase; function/variable/schema/query-key factory dùng camelCase. Hằng số dùng chung và registry như APP_ROUTES dùng UPPER_SNAKE_CASE; object cấu hình từ env như featureFlags dùng camelCase.
- Named exports, `import type` cho type. Props đơn giản đặt cùng component; model đặt ở entities, type dành riêng UI ở types hoặc cạnh consumer.
- Kiểu và helper đặt theo owner: session/kết quả/lỗi ứng dụng ở usecases; URL/redirect ở routes; persistence riêng của preferences ở store/preferences. Schema form dùng `<name>-form-schema.ts`; schema wire tách riêng dùng `<name>-response-schema.ts` trong services.
- `schemas/` dành cho form. Schema storage/state, env, HTTP và mock đặt cạnh module đọc dữ liệu; schema nhỏ chỉ dùng trong một file có thể private tại đó. Type client state/form có thể suy ra từ schema bằng `z.infer`; kiểu nghiệp vụ và contract trong entities/usecases giữ TypeScript thuần.
- Pages/components chỉ làm UI. Business rule ở entities/usecases; API và schema response ở services. Không import concrete service vào usecase; truyền capability từ runtime để test độc lập.
- TanStack Query cho server cache; Redux cho session/client workflow; RHF cho form; URL cho filter/page có thể chia sẻ. Không lưu access/refresh token vào Redux hoặc localStorage.
- URL tập trung ở constants/routes, API endpoints ở constants/endpoints. Không copy chuỗi route ở nhiều nơi.
- Dùng component có sẵn ở components/ui, semantic tokens và locale keys. Form có label/error/pending state; request có loading/empty/error/retry phù hợp.
- Không thêm wrapper, interface, folder hay package chỉ để dự phòng. Tách khi có trách nhiệm hoặc consumer rõ ràng; giữ luồng gọi dễ lần theo.

## Test và kiểm tra

```sh
npm run format
npm run check
npm run test:e2e
npm run test:e2e:production
git diff --check
```

Vitest/Testing Library kiểm tra business rule, API contract, auth races và UI. MSW dùng cùng response contract với service. Playwright kiểm tra browser, desktop/mobile width và accessibility. Khi thay API, cập nhật service/schema/mock/test cùng lúc; giữ input khi request lỗi hoặc version conflict.

Pre-commit chạy lint-staged; commit-msg chạy commitlint; pre-push chạy typecheck và unit tests. CI chạy lại checks và browser tests. Test mới tập trung vào hành vi hoặc rủi ro thực tế, không mô phỏng lại implementation hay ép folder structure.

## Git và review

Branch: `feat/<description>`, `fix/<description>`, `refactor/<description>`, `chore/<description>`. Commit theo Conventional Commits: `feat(projects): add search`, `fix(auth): prevent stale refresh`. PR nêu vấn đề, kết quả và kiểm tra đã chạy.

Stage path cụ thể, không đưa secrets, local env, report hoặc thay đổi ngoài scope vào commit. AGENTS.md/AGENTS.override.md là hướng dẫn riêng máy, exclude bằng .git/info/exclude. Không force-push, publish/deploy hoặc merge khi chưa được yêu cầu.

Trước review: code đúng owner; mock/contract khớp; chức năng cũ còn chạy; vi/en, light/dark, keyboard và route bảo vệ được kiểm tra khi có ảnh hưởng. Dependency mới cần consumer rõ ràng; không upgrade dependency ngoài phạm vi task.

Khi adopt base: đổi branding/package/storage namespace, thay backend contract và ví dụ Projects, cấu hình env/hosting, thống nhất base branch và CI/release của team. Báo lỗi bảo mật qua kênh riêng do team chỉ định, không đăng public dữ liệu người dùng hoặc secret.
