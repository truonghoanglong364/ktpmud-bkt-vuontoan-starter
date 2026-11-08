# PROGRESS.md — Theo dõi tiến độ Hack Marathon 2026

**Mã nhóm:** N12
**Track:** B — Vườn Toán Lớp 3
**Fork URL:** https://github.com/truonghoanglong364/ktpmud-bkt-vuontoan-starter
**Starter commit (pinned):** `bkt-2026-v1`
**Thành viên (alias ẩn danh):** `cu_an_danh`, `soi_an_danh`, `dai_bang_an_danh`

> File này cập nhật qua PC-1 (11/11), PC-2 (18/11) và Freeze (19/11). Theo quy định Issue #19: "Mỗi dòng ghi 'Xong' phải có bằng chứng: commit, CI, hoặc file/test." Không ghi họ tên/MSSV.

---

## PC-1 — 11/11/2026

### Đã hoàn thành (M1 — Understand)

| Việc | Trạng thái | Bằng chứng (commit/file) |
|---|---|---|
| Fork starter (`truonghoanglong364/ktpmud-bkt-vuontoan-starter`), pin tag `bkt-2026-v1` | Xong | Fork tại https://github.com/truonghoanglong364/ktpmud-bkt-vuontoan-starter — xác nhận tag `bkt-2026-v1` tồn tại trong fork |
| Đọc `docs/architecture-reference.md` | Xong | — |
| `REQUIREMENTS.md` v0.1 | Xong | `artifacts/REQUIREMENTS.md`, commit `af96820` |
| `DECISIONS.md` v0.1 (ADR-001, 002, 003) | Xong | `artifacts/DECISIONS.md`, commit `af96820` |
| Acceptance criteria traceable tới B-01→B-12 | Xong | `REQUIREMENTS.md` §4 |
| Kế hoạch test TC-01→TC-15 | Xong | `REQUIREMENTS.md` §6 |
| Repo chạy được `npm ci && npm start` từ clean checkout | [TODO — kiểm tra sau khi clone fork] | CI run `[ĐIỀN LINK sau khi chạy workflow]` |

### Timeline dự kiến đến khi hoàn thành

| Mốc | Ngày | Việc chính |
|---|---|---|
| M2 bắt đầu | 09/11 | Scaffolding: thêm cột `question_type`, module `scoring/estimation.js` khung |
| M2 giữa | 11–12/11 | Fixture 12 câu + unit test `scoring` + `tolerance` |
| M2 cuối | 13–15/11 | API `GET/POST` + frontend render feedback 2 chiều + integration test |
| PC-2 | 18/11 | Vertical slice chạy E2E; public tests đạt |
| M3 | 16–19/11 | Hardening: security checklist, AI_USE.md, README đầy đủ |
| Freeze | 19/11 23:59 | Tag `bkt-2026-<ma-nhom>-rc1` |
| Nộp | 20/11 | PR vào `ktpmud-project` |
| Demo/Viva | 21/11 | 7' demo + 8' Q&A |

### Câu hỏi của nhóm cho TA (tại buổi PC-1)

1. Phép chia có dư: nhóm đề xuất chỉ dùng phép chia hết (thương nguyên, số dư = 0) cho dạng ước lượng. TA đồng ý không?
2. Format `correct_answer` cho type mới `estimate`: nhóm đề xuất `'{"exact":"48","tolerance":10}'` (JSON string lồng). TA có yêu cầu format khác (vd. thêm cột `acceptable_range`) không?
3. Nhóm dự kiến gắn bộ đề ước lượng mới vào `lessonId: "bai-10"`. TA có muốn chỉ định lesson khác không?
4. Nhóm dự kiến thêm `jest` + `supertest`. Xác nhận theo Mục 5.1 đề thi — chỉ khai báo trong `package.json` có đủ không, hay cần file khai báo thư viện OSS riêng?
5. Ngưỡng tolerance ở `REQUIREMENTS.md` §5.2 (tolerance = 10 cho tích trong khoảng 21–100) có cần TA review sư phạm trước khi lock không?

### Phân công sơ bộ (ẩn danh, theo alias) — nhóm 3 người

| Alias | Mảng phụ trách | Ghi chú |
|---|---|---|
| `cu_an_danh` | Scoring logic + unit test (M2) | Owner module `scoring/estimation.js`, hàm `tolerance`, test TC-03/04/12/13 |
| `soi_an_danh` | API + integration test + CI (M2) | Owner endpoint GET/POST, supertest, `.github/workflows/ci.yml`, test TC-05→TC-11, TC-14/15 |
| `dai_bang_an_danh` | Frontend + a11y + E2E + security/AI log (M2–M3) | Owner UX feedback 2 chiều, B-12, test TC-01, `SECURITY_PRIVACY_CHECKLIST.md`, `AI_USE.md` |

> **Nhóm 3 người** nên phân công cân bằng; mỗi thành viên có đầu việc chính nhưng review chéo PR của nhau. *Phân công sẽ được chi tiết hóa trong `CONTRIBUTIONS.md` lúc nộp bài — có thể thay đổi sau PC-1 dựa trên phản hồi TA.*

*Phân công sẽ được chi tiết hóa trong `CONTRIBUTIONS.md` lúc nộp bài.*

---

## PC-2 — 18/11/2026

*(sẽ cập nhật tại buổi PC-2)*

### Đối chiếu với timeline PC-1

| Mục | Dự kiến | Thực tế | Ghi chú |
|---|---|---|---|

### Mức sẵn sàng cho Freeze (19/11)

| Hạng mục | Trạng thái |
|---|---|
| Vertical slice chạy E2E | |
| Public tests đạt | |
| CI xanh trên `main` | |
| `AI_USE.md` đầy đủ | |
| `SECURITY_PRIVACY_CHECKLIST.md` | |
| README với lệnh install/run/test | |

---

## Freeze — 19/11/2026 23:59

*(sẽ cập nhật lúc freeze)*

**Release tag:** `bkt-2026-<ma-nhom>-rc1`
**Final commit SHA:** `[ĐIỀN]`
**CI run xanh cuối cùng:** `[ĐIỀN LINK]`
