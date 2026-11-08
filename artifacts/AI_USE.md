# AI_USE.md — Log sử dụng AI trong Hack Marathon 2026

**Mã nhóm:** N12
**Track:** B — Vườn Toán Lớp 3
**Chính sách:** `ai-allowed` (Mục 5.1 đề thi) — bắt buộc khai báo và kiểm chứng (Mục 5.3).

> **Nguyên tắc nhóm:** AI hỗ trợ, nhóm chịu trách nhiệm. Mọi output AI đều được review, kiểm chứng và điều chỉnh trước khi đưa vào sản phẩm. Không dùng AI trong phần vấn đáp trực tiếp (Mục 5.2).

---

## Entry 001 — Soạn khung `REQUIREMENTS.md`, `DECISIONS.md`, `PROGRESS.md` (Checkpoint 1, pass 1)

| Trường | Nội dung |
|---|---|
| **Công cụ/model** | Claude (Anthropic) — qua chat UI |
| **Mục đích** | Sinh khung `REQUIREMENTS.md`, `DECISIONS.md` (ADR-001, 002, 003), `PROGRESS.md` theo cấu trúc đề thi KTPMUD-BKT-2026 v1.0.2 Mục 6, 8, 9 |
| **Phạm vi** | `artifacts/REQUIREMENTS.md`, `artifacts/DECISIONS.md`, `progress/PROGRESS.md` — commit `[ĐIỀN SHA sau khi push]` |
| **Kiểm chứng** | (1) đối chiếu từng mục với đề thi chính thức v1.0.2; (2) đối chiếu acceptance criteria B-01→B-12 trong §4 của `REQUIREMENTS.md` với Mục 8.3 đề thi; (3) nhóm thảo luận các ADR và tolerance ngưỡng. |
| **Quyết định của nhóm** | **Giữ, pass 1.** Cấu trúc tốt nhưng cần đối chiếu với `docs/architecture-reference.md` thực tế → chuyển sang Entry 002. |
| **Người chịu trách nhiệm** | Alias `dai_bang_an_danh` review và chấp thuận. |

## Entry 002 — Rà soát & căn chỉnh theo `docs/architecture-reference.md` thực tế (Checkpoint 1, pass 2)

| Trường | Nội dung |
|---|---|
| **Công cụ/model** | Claude (Anthropic) — qua chat UI |
| **Mục đích** | Cập nhật §2 của `REQUIREMENTS.md` (schema DB, API endpoint, luồng chấm), các ADR (từ "endpoint giả định `/api/practice/*`" sang "endpoint thực `POST /api/submissions`" + "mã hoá JSON trong `correct_answer`" thay vì "thêm cột mới"), kế hoạch test TC-01→TC-15, câu hỏi cho TA |
| **Phạm vi** | Các mục đã sửa trong `REQUIREMENTS.md` §1.1, §2, §6.2; `DECISIONS.md` ADR-001/002/003; `PROGRESS.md` câu hỏi cho TA — commit `[ĐIỀN SHA sau khi push]` |
| **Kiểm chứng** | (1) đọc nguyên văn `docs/architecture-reference.md` v1.0.0 (trích từ `server/db.js`, `server/api.js`, `data/seed.json`, `exercise.js` tại commit `aca3ea9`); (2) xác nhận 4 type hiện có `multiple-choice`/`input`/`compare`/`paint` không bị đổi nghĩa; (3) xác nhận không đụng `server/auth.js` (B-07); (4) xác nhận `GET /api/question-sets/:setId/questions` không trả `correct_answer` (B-04). |
| **Quyết định của nhóm** | **Giữ, có sửa.** Chọn Phương án A trong ADR-001 (thêm `type='estimate'`, mã hoá JSON trong cột sẵn có) vì tránh được migration schema. Ngưỡng tolerance ở `REQUIREMENTS.md` §5.2 sẽ được nhóm review lại với giáo viên Toán nếu có điều kiện trước Checkpoint 2. |
| **Người chịu trách nhiệm** | Alias `dai_bang_an_danh` review và chấp thuận. |

---

## Entry 003 — [TODO khi phát sinh trong M2]

*(Dành cho các lần dùng AI tiếp theo, vd. gợi ý test cases, debug, refactor)*

---

## Cam kết

- Không có secret/PII trong log này.
- Không có prompt riêng tư của thành viên trong log này (Mục 5.3 — không bắt buộc công khai prompt).
- Tất cả thành viên hiểu rằng phần vấn đáp 21/11 **không dùng AI**, và mỗi người phải tự giải thích được phần mình chịu trách nhiệm (Mục 9.3 — "Thành viên không giải thích được phần mình nhận trách nhiệm → điều chỉnh điểm cá nhân").
