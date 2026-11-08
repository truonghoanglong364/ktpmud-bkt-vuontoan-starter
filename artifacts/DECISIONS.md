# DECISIONS.md — Architecture Decision Records

**Mã nhóm:** N12
**Track:** B — Vườn Toán Lớp 3
**Version:** v0.1 (Checkpoint 1 — 08/11/2026)

---

## ADR-001: Thêm dạng câu hỏi "Ước lượng" bằng cách mở rộng bảng câu hỏi hiện có, không tạo service riêng

**Trạng thái:** Proposed (chờ TA duyệt scope tại Checkpoint 1)
**Ngày:** 08/11/2026
**Người đề xuất:** Nhóm N12
**Context tham chiếu:** `docs/architecture-reference.md` v1.0.0 §2, §3, §4, §5

### Bối cảnh

Đề bài Track B yêu cầu thêm dạng luyện tập "Ước lượng trước khi tính đúng" vào hệ thống Vườn Toán Lớp 3 hiện có (brownfield). Theo `architecture-reference.md`:
- Bảng `questions` đã có cột `type` (TEXT) với 4 giá trị hiện có (`multiple-choice`, `input`, `compare`, `paint`) và cột `correct_answer` kiểu TEXT.
- `POST /api/submissions` chấm bằng cách **so sánh chuỗi chính xác** cho tất cả type.
- Mục 7 của tài liệu nêu rõ: "Không tự đổi nghĩa 4 `type` hiện có — chỉ thêm, không sửa hành vi cũ".

Có 3 lựa chọn kiến trúc chính:

- **Phương án A — Thêm `type` mới + dispatcher theo type, mã hoá đáp án trong JSON:** Thêm `type = 'estimate'` cho bảng `questions`; mã hoá đáp án đúng + tolerance dưới dạng JSON string trong cột `correct_answer` sẵn có (vd. `'{"exact":"48","tolerance":10}'`); thêm nhánh `if (q.type === 'estimate') scoreEstimation(...)` trong vòng `questions.map` của `POST /api/submissions`; không migration schema.
- **Phương án B — Thêm cột mới vào bảng `questions`:** Thêm cột `acceptable_range` TEXT; migration DB; thay đổi `tools/seed` để cột mới được populate; sửa thêm các query select.
- **Phương án C — Service con tách biệt:** Tạo module `estimation-service` với bảng DB riêng, endpoint `/api/estimation/*` riêng, frontend route riêng, kết nối với core qua adapter.

### Quyết định

**Chọn Phương án A — Thêm `type = 'estimate'`, mã hoá đáp án trong JSON string của cột `correct_answer` sẵn có, dispatcher theo type trong `POST /api/submissions`.**

### Lý do

1. **Không migration schema → không phá seed hiện có.** Cột `correct_answer` đã là TEXT, chứa JSON string hợp lệ. Tránh rủi ro migration làm hỏng 99 tài khoản học sinh mẫu (`hocsinh01`–`hocsinh99`) và các bộ đề đang có.
2. **Tuân thủ Mục 7 của `architecture-reference.md`:** "chỉ thêm, không sửa hành vi cũ" — nhánh `if (q.type === 'estimate')` chỉ kích hoạt cho type mới, 4 type cũ (`multiple-choice`, `input`, `compare`, `paint`) đi đúng nhánh chuỗi so sánh cũ.
3. **Bám đúng B-01:** Dạng bài mới xuất hiện trong luồng học hiện có bằng cách seed thêm 1 `question_set` với các câu hỏi `type: "estimate"` gắn vào `lesson_id` phù hợp (vd. `bai-10` — Bảng nhân 6 & Bảng chia 6). Học sinh truy cập qua đúng `exercise.html?setId=...` sẵn có.
4. **Bám đúng B-04:** Starter đã không trả `correct_answer` qua `GET /api/question-sets/:setId/questions`. Mình giữ hành vi này, chỉ cần đảm bảo code SELECT không vô tình include cột đó cho type mới.
5. **Bám đúng B-05:** Cơ chế `attempts.answers_json` (TEXT) sẵn có đã lưu được JSON tuỳ ý → lưu `{estimation, exact}` cho type `estimate` tái dùng gần như miễn phí. Refresh không mất trạng thái vì load lại qua `GET /api/me/progress` + `attempts`.
6. **Bám đúng B-07:** Không đụng `server/auth.js`, không sửa session, deployment. Chỉ sửa `server/api.js` (logic chấm), `server/db.js` (có thể cần nếu thêm helper query), `data/seed.json`, `public/assets/js/pages/exercise.js`.
7. **Deterministic scoring (B-03 + Mục 8.2 đề thi):** Hàm `scoreEstimation(answer, correctAnswerJson)` là pure function — input chuỗi, output `{estimationVerdict, exactVerdict}`. Test được 100% bằng unit test, không cần mock DB/HTTP.
8. **Maintainability cho khóa sau (rubric Handoff — 5 điểm):** Pattern "thêm type mới + nhánh dispatcher + JSON schema trong `correct_answer`" mở đường cho dạng bài khác (vd. "làm tròn", "so sánh phân số") tiếp tục thêm theo cùng công thức, không migration.

### Hệ quả (trade-off)

**Tích cực:**
- Zero migration → zero rủi ro phá seed.
- Thời gian tích hợp ngắn, kịp vertical slice tại M2 (15/11).
- Cơ chế lưu/phục hồi phiên của starter (`attempts.answers_json`) → giải quyết B-05 gần như miễn phí.
- Bề mặt test nhỏ gọn, pure function dễ đạt coverage target.

**Tiêu cực / Cần theo dõi:**
- JSON string trong `correct_answer` là **implicit schema** — không được DB check. **Giảm thiểu:** viết validator `parseEstimateAnswer(raw)` gọi `JSON.parse` trong try/catch, có unit test; dọn kiểu cho type `estimate` khi load câu hỏi.
- Dispatcher trong `POST /api/submissions` sẽ phình nhẹ. **Giảm thiểu:** tách hàm `scoreByType(q, givenRaw)` nhỏ, dễ test riêng.
- Nếu sau này cần query theo tolerance (vd. thống kê câu khó), JSON lồng trong TEXT khó query. **Chấp nhận** vì ngoài phạm vi 18 ngày.

### Rejected alternatives

- **Phương án B (thêm cột `acceptable_range` TEXT):** Rejected. Cần migration, chạm nhiều điểm trong `db.js` và `seed.json`, không mang thêm lợi ích thực tế so với JSON string trong cột sẵn có.
- **Phương án C (service riêng `/api/estimation/*`):** Rejected. Vi phạm B-01 (tạo luồng rời), tăng bề mặt code, tăng rủi ro chạm `auth`/`session`, overkill cho 1 dạng bài.

### Review tại Checkpoint 2

Nhóm sẽ xem lại ADR này vào 15/11 dựa trên:
- Nếu dispatcher trong `POST /api/submissions` vượt ~30 dòng khi thêm type thứ 2, cân nhắc tách module `scoring/by-type.js`.
- Kết quả public test và hidden test mẫu.

---

## ADR-002: Tái dùng `POST /api/submissions` sẵn có; mã hoá cặp `{estimation, exact}` trong `answers[q.id]`; dispatcher trả về response có 2 verdict

**Trạng thái:** Proposed
**Ngày:** 08/11/2026

### Bối cảnh

`architecture-reference.md` §5 liệt kê 4 endpoint — không có endpoint riêng cho ước lượng. `POST /api/submissions` hiện nhận body `{setId, answers, durationSec}` trong đó `answers[q.id]` là **giá trị đơn (string)**, chấm bằng so sánh chuỗi chính xác.

2 ràng buộc then chốt:
- **B-04:** `GET /api/question-sets/:setId/questions` KHÔNG trả `correct_answer` (hiện tại đã tuân thủ) → giữ nguyên.
- **B-06:** Feedback phân biệt "ước lượng hợp lý" vs "kết quả chính xác" → response của `POST /api/submissions` cần có 2 verdict riêng cho mỗi câu type `estimate`.

Hai lựa chọn chính:
- **Option 1:** Thêm endpoint riêng `POST /api/submissions/estimate` → vi phạm nguyên tắc "chỉ thêm, không sửa hành vi cũ" ở mức kiến trúc (tạo luồng song song), và vi phạm B-01 nếu frontend rẽ nhánh gọi endpoint khác.
- **Option 2:** Mở rộng `POST /api/submissions` hiện có — cho phép `answers[q.id]` là object `{estimation, exact}` khi `q.type === 'estimate'`; dispatcher nội bộ chọn hàm chấm phù hợp.

### Quyết định

**Chọn Option 2.** Contract cụ thể:

**Câu hỏi `type: "estimate"` trong DB `questions`:**
```json
{
  "id": "est-1",
  "type": "estimate",
  "prompt": "Ước lượng kết quả của 23 × 4, rồi tính chính xác.",
  "correct_answer": "{\"exact\":\"92\",\"tolerance\":10}",
  "points": 5
}
```

**`GET /api/question-sets/:setId/questions`** — giữ nguyên hành vi starter: không trả `correct_answer`; FE biết `type: "estimate"` thì render 2 ô nhập.

**`POST /api/submissions` body (mở rộng):**
```jsonc
{
  "setId": "phieu-uoc-luong-bai-10",
  "answers": {
    "input-1": "9",                              // type cũ: scalar string
    "est-1": { "estimation": "90", "exact": "92" }  // type 'estimate': object
  },
  "durationSec": 180
}
```

**`POST /api/submissions` response (mở rộng)** — thêm trường `estimation` cho mỗi câu type `estimate` trong `detail`:
```jsonc
{
  "scorePercent": 100,
  "detail": [
    {
      "questionId": "est-1",
      "type": "estimate",
      "ok": true,
      "estimationVerdict": "reasonable",   // "reasonable" | "off"
      "exactVerdict": "correct",           // "correct" | "wrong"
      "overallVerdict": "excellent",
      "correctAnswer": "92",
      "acceptableRange": [82, 102]
    }
  ]
}
```

### Lý do

1. **Thỏa B-04:** `GET` không đổi, `correct_answer` chỉ xuất hiện trong response của `POST` (sau khi đã nộp).
2. **Thỏa B-06:** `estimationVerdict` và `exactVerdict` là 2 trường riêng; `overallVerdict` chỉ để render nhanh.
3. **Thỏa B-01:** FE gọi cùng endpoint `POST /api/submissions` từ cùng file `exercise.js` — không tạo trang/luồng rời.
4. **Testable (B-08):** Có thể viết supertest cho đúng endpoint đã có: (TC-05) `GET` không chứa `correct_answer`; (TC-07) `POST` trả về 2 verdict riêng.
5. **Backward compatible:** `answers[q.id]` là **union type** `string | {estimation, exact}`; code cũ (4 type cũ) không đổi vì chúng không bao giờ gặp branch object.

### Hệ quả

- `answers_json` lưu trong `attempts` giờ có thể chứa object → cần đảm bảo `JSON.stringify/parse` round-trip đúng (`attempts.answers_json` đã là TEXT, không vấn đề).
- Validator cho body `POST /api/submissions` phải chấp nhận cả scalar lẫn object — nhớ reject nếu scalar/object không khớp với `q.type` tương ứng.
- Documentation API phải cập nhật trong README/REQUIREMENTS để khoá sau dễ đọc.

---

## ADR-003: Fixture ≥ 12 câu hỏi được thêm vào `data/seed.json` như một `question_set` mới, re-seed qua `npm run reset-db`

**Trạng thái:** Proposed
**Ngày:** 08/11/2026

### Bối cảnh

B-02 yêu cầu ≥ 12 fixture synthetic tái lập được. `architecture-reference.md` §2 cho thấy starter đã có cơ chế seed sẵn: `data/seed.json` chứa các `questionSets` theo cấu trúc chuẩn, chạy `npm run reset-db` (Mục 8.5 đề thi) để reset. Có 2 lựa chọn:
- Lưu fixture ở file riêng (vd. `fixtures/estimation-questions.json`) + thêm script seed riêng.
- Thêm thẳng vào `data/seed.json` sẵn có.

### Quyết định

**Thêm một `questionSet` mới vào `data/seed.json`, gắn vào `lesson_id: "bai-10"` (Bảng nhân 6 & Bảng chia 6).** Ví dụ cấu trúc:

```json
{
  "phieu-uoc-luong-bai-10": {
    "lessonId": "bai-10",
    "title": "Phiếu bài tập: Ước lượng trước khi tính (Bảng nhân/chia 6)",
    "kind": "exercise",
    "questions": [
      { "id": "est-1", "type": "estimate", "prompt": "Ước lượng rồi tính: 6 × 7", "correctAnswer": "{\"exact\":\"42\",\"tolerance\":4}", "points": 5 }
      // ... ≥ 12 câu
    ]
  }
}
```

### Lý do

- **Tái dùng cơ chế sẵn có:** `tools/*` đã biết cách đọc `data/seed.json` và tạo rows cho `question_sets` + `questions`. Không viết thêm pipeline.
- **Tái lập 100%:** `npm run reset-db` → DB giống hệt lần chạy trước (B-02).
- **Dễ review:** TA mở `data/seed.json` thấy ngay 12 câu, không cần clone file rời.
- **Tích hợp vào luồng (B-01):** Vì gắn `lessonId: "bai-10"`, học sinh vào bài 10 là thấy ngay bộ đề ước lượng cạnh bộ đề thường.

### Hệ quả

- Khi muốn thêm/sửa câu, chỉnh `data/seed.json` + chạy lại `reset-db` — hành vi starter.
- Phân bố 12 câu: **8 phép nhân + 4 phép chia** (giữ tỷ lệ chương trình lớp 3), rải đều độ lớn kết quả qua các khoảng tolerance ở `REQUIREMENTS.md` §5.2 để test boundary dễ.
- Lưu ý: giá trị `correctAnswer` trong JSON seed là **chuỗi JSON lồng** (escape quotes). Đảm bảo pipeline seed không double-parse — kiểm chứng bằng test TC-02.

---

## Lịch sử revision

| Ngày | Version | Thay đổi |
|---|---|---|
| 2026-11-08 | v0.1 | Khởi tạo cho Checkpoint 1: ADR-001, 002, 003 |
