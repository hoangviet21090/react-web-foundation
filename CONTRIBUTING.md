# Phát triển trên web foundation

## Bắt đầu

Đọc [structure](docs/project-structure.md), [architecture](docs/architecture.md), [naming](docs/naming.md) và [capabilities](docs/capabilities.md). Xác nhận requirements/base branch của repository đang làm; không kế thừa workflow của một repo khác.

```sh
git status --short
git fetch origin
git switch -c feat/project-search origin/<confirmed-base>
npm ci
```

Repo local hiện chưa có remote. Không chạy fetch cho đến khi team đã cấu hình remote.

## Git conventions

Branch dùng `feat/<description>`, `fix/<description>`, `chore/<description>`; có thể thêm issue ID nếu team muốn. Commit theo [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/): `feat(projects): add search`, `fix(auth): prevent stale responses`, `feat(api)!: change response contract`. Types: feat/fix/docs/style/refactor/perf/test/build/ci/chore/revert. Không bắt buộc mã US/sprint hoặc tên tổ chức.

Không stage/commit unrelated changes, secrets, local env, reports hoặc agent files. Dùng explicit paths. AGENTS.md/AGENTS.override.md là machine-local, exclude bằng .git/info/exclude. Không rewrite pushed history/merge/publish/deploy khi chưa được yêu cầu.

## Code conventions

- Feature/layer ownership trước, naming sau. Named exports và import type.
- Domain/application thuần TS; port tại layer consumer; app inject concrete adapters.
- Wire/form types suy từ schema; UI view types tách khỏi core/DTO.
- Query cho server cache, Redux cho client workflow, RHF cho form, URL cho filters/page.
- Route constants/builders ở app; endpoint HTTP ở feature infrastructure.
- UI primitives shared/ui; business UI tại feature; common composed UI/hooks/types tại shared presentation groups.
- Strings qua locale, màu qua semantic tokens. Form có label/error association/pending/dirty behavior.
- Timestamp backend UTC; format theo timezone cấu hình. Currency/budget rules của domain được nêu rõ.
- Không log credentials, payload hoặc raw HTTP errors. Reporter chỉ nhận dữ liệu đã lọc tại boundary.
- Dependency mới phải giải thích consumer, license, bundle/browser impact và test trong PR.

## Gates

```sh
npm run format
npm run check
npm run test:e2e
npm run test:e2e:production
git diff --check
git status --short
```

Chạy các suites tuần tự để tránh tranh tài nguyên. Hooks: pre-commit lint-staged + architecture, commit-msg commitlint, pre-push full check. CI chạy lại để không phụ thuộc hooks trên máy dev.

Không nới threshold hoặc disable rule để che lỗi. Tests tập trung invariants/contracts/races/user behavior. PR mô tả vấn đề, kết quả, validation và giới hạn còn lại.

## Tạo source

`npm run feature:new -- <name> --dry-run` xem output trước; bỏ --dry-run để tạo. Tích hợp theo README sinh ra và [recipe](docs/adding-a-feature.md).

`npm run ui:add -- dialog` dùng CLI shadcn đã pin. Wrapper chuẩn hóa cn imports. Review generated source/dependencies, accessibility, tokens trước khi dùng; không overwrite primitive tùy biến thiếu review.

## Adopt cho team

Đổi branding/storage namespace/package metadata, backend contracts và example feature. Chọn Git host/base, reviewer ownership, branch protection, required CI và release approvals. Templates local không tự thiết lập các settings trên remote.
