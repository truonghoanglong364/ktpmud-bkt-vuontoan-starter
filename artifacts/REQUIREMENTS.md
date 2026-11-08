# REQUIREMENTS.md — Track B: Dạng bài "Ước lượng trước khi tính đúng"

**Mã nhóm:** N12
**Track:** B — Vườn Toán Lớp 3 (brownfield extension)
**Starter:** `fossbk-spec/ktpmud-bkt-vuontoan-starter` @ tag `bkt-2026-v1`
**Đặc tả chính thức tham chiếu:** `docs/architecture-reference.md` (starter repo)
**Version:** v0.1 (Checkpoint 1 — 08/11/2026)

---

## 1. Bối cảnh & Mục tiêu sư phạm

### 1.1. Bối cảnh

Vườn Toán Lớp 3 là ứng dụng luyện tập Toán cho học sinh lớp 3. Hệ thống hiện có luồng luyện tập các phép nhân/chia với cơ chế chấm điểm server-side tất định tại `POST /api/submissions` — **so sánh chuỗi chính xác** giữa `answers[q.id]` của học sinh và `questions.correct_answer` trong DB (xem `architecture-reference.md` §4).

Dạng bài hiện tại yêu cầu học sinh nhập **kết quả chính xác** của phép tính. Tuy nhiên, theo chuẩn kiến thức Toán lớp 3, học sinh cần được rèn **tư duy ước lượng** (estimation) trước khi tính chính xác — một kỹ năng nền tảng giúp phát hiện sai sót khi tính nhẩm và xây dựng "số giác" (number sense).

### 1.2. Mục tiêu sư phạm của dạng bài mới

Thêm dạng luyện tập **"Ước lượng kết quả trước khi tính đúng"** cho phép nhân/chia, trong đó:

1. Học sinh **phải đưa ra ước lượng** (một khoảng hợp lý) **trước** khi được xem/nhập kết quả chính xác.
2. Hệ thống **phân biệt rõ 2 loại feedback**:
   - Ước lượng **có hợp lý** hay không (so với "khoảng chấp nhận được" tất định).
   - Kết quả chính xác **có đúng** hay không.
3. Logic chấm điểm **100% tất định bằng code** — không dùng LLM runtime để sinh đáp án (ràng buộc Mục 8.2 đề thi).

### 1.3. Ngoài phạm vi (bám sát Mục 8.4 đề thi)

- Không thêm chương trình Toán hoặc nội dung SGK mới ngoài phép nhân/chia đã có.
- **Không** sửa `server/auth.js`, session, tài khoản mẫu hay deployment.
- Không kết nối ứng dụng thật/production; dữ liệu 100% synthetic.
- Không dùng LLM để sinh đáp án runtime.
- Không yêu cầu deploy public.

---

## 2. Phân tích hệ thống hiện có (đối chiếu `architecture-reference.md`)

> **Nguồn:** `docs/architecture-reference.md` v1.0.0 — trích nguyên văn từ commit `aca3ea9` của starter.

### 2.1. Stack & kiến trúc

- Backend: Node.js 18+, Express.
- CSDL: SQLite qua **`better-sqlite3`** (driver đồng bộ, không async).
- Truy vấn: **SQL thuần qua `db.prepare(...)`**, không ORM.
- Frontend: **HTML/CSS/JavaScript thuần**, không framework. Server trả JSON, client dùng `fetch()` và tự dựng DOM.
- Session/auth: cookie-based, nằm trong `server/auth.js` — **ngoài phạm vi, không được sửa** (B-07).

### 2.2. Schema DB liên quan (từ `server/db.js`, Mục 2)

| Bảng | Vai trò | Dự kiến đụng chạm |
|---|---|---|
| `lessons` | Bài học (số thứ tự, tiêu đề, topic, unlock condition) | **Không sửa** — tái dùng |
| `question_sets` | Bộ đề thuộc 1 bài học (`lesson_id`, `star_reward`, `duration_minutes`) | **Không sửa cấu trúc** — thêm set mới chứa câu hỏi ước lượng |
| `questions` | Câu hỏi (`type`, `prompt`, `correct_answer`, `options_json`, `points`) | **Thêm `type` mới** = `'estimate'` (không thêm cột); mã hoá "đáp án đúng + khoảng chấp nhận" vào `correct_answer` dưới dạng JSON string |
| `attempts` | Lượt làm bài (có cột `answers_json` TEXT lưu toàn bộ đáp án học sinh) | **Không sửa cấu trúc** — tái dùng `answers_json` để lưu cặp `{estimation, exact}` cho câu type `estimate` |
| `progress` | Tiến độ `(user_id, lesson_id, best_score, completed)` | **Không sửa** |
| `users`, `assignments`, `game_scores` | **Ngoài phạm vi** | Không chạm |

**Ý nghĩa thiết kế:** vì `questions.correct_answer` là `TEXT`, nhóm có thể mã hoá đáp án ước lượng dưới dạng JSON (vd. `'{"exact":"48","tolerance":10}'`) **mà không cần migration schema** — giảm rủi ro phá seed data mẫu. Xem ADR-001 để biết trade-off.

### 2.3. Các API endpoint liên quan (từ `server/api.js`, Mục 5)

| Endpoint | Mô tả hiện có | Hành động cho dạng ước lượng |
|---|---|---|
| `GET /api/lessons` | Danh sách bài học + tiến độ | **Không sửa** — tái dùng |
| `GET /api/question-sets/:setId/questions` | Lấy câu hỏi của 1 bộ đề, **không trả `correct_answer`** | **Không sửa contract chính** — đảm bảo type `estimate` cũng không lộ `correct_answer` (B-04). Có thể cần trả thêm metadata hiển thị (vd. flag `type: 'estimate'`) nếu starter chưa trả |
| `POST /api/submissions` | Nhận `{setId, answers, durationSec}`, chấm bằng so sánh chuỗi chính xác, ghi `attempts` + cập nhật `progress` | **Mở rộng dispatcher theo `q.type`**: nếu `type === 'estimate'` → gọi `scoreEstimation(answer, q)` thay vì so sánh chuỗi. Giữ nguyên hành vi cũ cho 4 type hiện có |
| `GET /api/me/progress` | Tiến độ người dùng hiện tại | **Không sửa** |
| `POST /api/auth/*`, `/api/teacher/*`, `/api/admin/*` | Auth/quản trị | **Không được sửa** (B-07) |

### 2.4. Luồng học hiện có — điểm tích hợp (B-01)

Theo Mục 6 của `architecture-reference.md`, giao diện làm bài nằm ở **`public/assets/js/pages/exercise.js`** (~170 dòng). File này:
- Nhận `setId` từ URL, gọi `GET /api/question-sets/:setId/questions` lấy câu hỏi.
- **Render UI theo `type`** (hiện có 4 nhánh cho 4 type), thu thập đáp án.
- Gọi `POST /api/submissions` để chấm, hiển thị kết quả.

**Điểm tích hợp (B-01):** Thêm dạng bài ước lượng = (1) thêm bộ đề mới trong `data/seed.json` với `kind: "exercise"`, các câu hỏi `type: "estimate"`, gắn vào một `lesson_id` phù hợp (vd. bài về bảng nhân 6); (2) thêm nhánh render mới trong `exercise.js` cho type `estimate`; (3) thêm nhánh scoring trong `server/api.js`. Học sinh truy cập qua đúng luồng "chọn bài → chọn bộ đề → luyện tập" như hiện có — **không tạo trang `/demo-estimation` rời**.

---

## 3. User Stories

### US-01 — Học sinh làm bài ước lượng
> **Là** học sinh lớp 3, **tôi muốn** được yêu cầu ước lượng kết quả trước khi nhập kết quả chính xác, **để** rèn kỹ năng nhẩm nhanh và phát hiện sai sót khi tính.

### US-02 — Học sinh nhận feedback rõ ràng
> **Là** học sinh, **tôi muốn** biết ước lượng của mình có "hợp lý" không VÀ kết quả chính xác có "đúng" không như hai thông tin tách biệt, **để** hiểu rằng ước lượng hợp lý nhưng tính sai là khác với cả hai cùng sai.

### US-03 — Hệ thống không lộ đáp án trước
> **Là** giáo viên/người thiết kế, **tôi muốn** API không trả đáp án đúng trước khi học sinh nộp, **để** đảm bảo tính trung thực của bài luyện tập.

### US-04 — Lưu trạng thái bền vững
> **Là** học sinh, **tôi muốn** refresh trang không mất kết quả đã lưu, **để** không phải làm lại từ đầu.

### US-05 — Truy cập từ luồng học hiện có
> **Là** học sinh, **tôi muốn** truy cập dạng bài mới ngay trong luồng luyện tập chính, **không phải** đi tới một trang demo rời.

---

## 4. Acceptance Criteria (traceability tới B-01 → B-12 đề thi)

| ID AC đề thi | Mô tả | AC chi tiết của nhóm | Test case liên quan |
|---|---|---|---|
| **B-01** | Dạng bài mới nằm trong luồng học hiện có | Từ trang chủ luyện tập, học sinh thấy lựa chọn/được assign câu hỏi dạng ước lượng xen kẽ với câu hỏi thường. Không có trang `/demo-estimation` rời. | TC-01 (E2E flow) |
| **B-02** | ≥ 12 fixture synthetic tái lập được | File `fixtures/estimation-questions.json` chứa ≥ 12 câu hỏi với cặp (toán tử, 2 toán hạng, khoảng chấp nhận, đáp án đúng). Mỗi câu có `id` cố định để test tái lập. | TC-02 |
| **B-03** | Quy tắc tạo + chấm ước lượng tất định, test được | Quy tắc "hợp lý" = `|ước_lượng - đáp_án_đúng| ≤ tolerance(toán_tử, độ_lớn)` — xem Mục 5. Hàm `scoreEstimation(input, question)` pure function, test được. | TC-03, TC-04 |
| **B-04** | API không trả đáp án đúng trước khi nộp | `GET /api/practice/question/:id` chỉ trả `prompt`, `operator`, `operands`, `id`. **Không** chứa `correctAnswer` hay `acceptableRange`. | TC-05 (API contract) |
| **B-05** | Server chấm + lưu kết quả; refresh không mất | Sau khi `POST /api/practice/answer`, kết quả lưu vào DB. `GET /api/practice/session/:id` trả về lịch sử. Refresh frontend → gọi API này để phục hồi. | TC-06 |
| **B-06** | Feedback phân biệt "ước lượng hợp lý" vs "kết quả chính xác" | Response chấm điểm có 2 trường riêng: `estimationVerdict: "reasonable" \| "off"` và `exactVerdict: "correct" \| "wrong"`. UI hiển thị 2 dòng riêng. | TC-07 |
| **B-07** | **Không** sửa `server/auth.js`, session, tài khoản mẫu, deployment | PR không touch các file: `server/auth.js`, `server/session/*`, `seeds/users.*`, `deploy/*`. CI có check diff. | Check-list PR |
| **B-08** | Test cho normal, boundary, invalid, scoring | - Normal: ước lượng trong khoảng → "reasonable"<br>- Boundary: đúng mép tolerance<br>- Invalid: chuỗi, số âm, NaN, null, undefined<br>- Scoring: ma trận (reasonable/off) × (correct/wrong) | TC-08 → TC-15 |
| **B-09** | `npm test` chạy được từ clean checkout | Thêm script `"test": "jest"` (hoặc tương đương) vào `package.json`. Jest config chạy được sau `npm ci`. | CI log |
| **B-10** | CI chạy `npm ci` + `npm test` trên PR | `.github/workflows/ci.yml` chạy trên `pull_request`. | GitHub Actions |
| **B-11** | Không PII/secret; alias/tài khoản synthetic | Fixture dùng `student_alias: "hs_01"`, không có tên thật. Secrets scanner (gitleaks) sạch. | CI step |
| **B-12** | Dùng được bằng bàn phím, thông báo lỗi dễ hiểu | Mọi input focus được bằng Tab; Enter để nộp. Lỗi hiển thị bằng tiếng Việt, cấp lớp 3 đọc hiểu được. | Manual a11y check |

---

## 5. Quy tắc chấm ước lượng (deterministic)

> **Đây là phần nghiệp vụ cốt lõi — phải tất định, test được, không phụ thuộc runtime LLM.**

### 5.1. Định nghĩa "khoảng hợp lý"

Với câu hỏi `a ⊕ b` (⊕ ∈ {×, ÷}), đáp án chính xác là `exact`, ước lượng của học sinh là `est`:

```
isReasonable(est, exact, operator) =
    |est − exact| ≤ tolerance(operator, exact)
```

### 5.2. Hàm `tolerance` đề xuất (v0.1 — nhóm có thể điều chỉnh)

| Toán tử | Độ lớn `|exact|` | Tolerance |
|---|---|---|
| × (nhân) | 0 – 20 | ±2 |
| × (nhân) | 21 – 100 | ±10 (làm tròn chục gần nhất) |
| × (nhân) | 101 – 1000 | ±50 |
| ÷ (chia) | 0 – 20 | ±1 |
| ÷ (chia) | 21 – 100 | ±5 |

> **Căn cứ sư phạm:** ở lớp 3, ước lượng phép nhân thường bằng cách làm tròn một thừa số rồi nhân — sai số hợp lý nằm trong ~10% × độ lớn kết quả. Nhóm sẽ kiểm chứng ngưỡng này trong M2 và cập nhật `DECISIONS.md`.

### 5.3. Ma trận verdict

| Ước lượng hợp lý? | Kết quả chính xác? | Verdict tổng | Feedback cho học sinh |
|---|---|---|---|
| ✓ | ✓ | `excellent` | "Giỏi quá! Vừa ước lượng tốt vừa tính đúng." |
| ✓ | ✗ | `estimation_ok_calc_wrong` | "Ước lượng của em hợp lý, nhưng tính lại cho chính xác nhé." |
| ✗ | ✓ | `calc_ok_estimation_off` | "Em tính đúng! Thử ước lượng lại xem có gần hơn không." |
| ✗ | ✗ | `both_off` | "Cùng nhẩm lại nhé: [gợi ý làm tròn]" |

---

## 6. Kế hoạch test (chi tiết)

### 6.1. Test suite layout

```
tests/
├── unit/
│   ├── scoring.test.js       # Hàm scoreEstimation pure function
│   ├── tolerance.test.js     # Hàm tolerance cho mọi khoảng
│   └── validator.test.js     # Validate input: null, NaN, chuỗi, số âm
├── integration/
│   ├── api-question.test.js  # GET không lộ đáp án (B-04)
│   ├── api-answer.test.js    # POST chấm + lưu DB (B-05)
│   └── api-session.test.js   # GET phục hồi sau refresh
└── e2e/
    └── estimation-flow.test.js  # Luồng end-to-end (B-01)
```

### 6.2. Test cases bắt buộc

| TC-ID | Mục đích | Input | Expected |
|---|---|---|---|
| TC-01 | Luồng E2E: học sinh vào bài-10 → thấy bộ đề "Ước lượng" → làm → nhận feedback | Session `hocsinh01` hợp lệ | UI hiển thị 2 ô nhập (ước lượng + kết quả), submit thấy feedback 2 dòng |
| TC-02 | Seed load ≥12 fixture vào bảng `questions` | `data/seed.json` có `phieu-uoc-luong-bai-10` | `SELECT COUNT(*) FROM questions WHERE type='estimate'` ≥ 12 |
| TC-03 | `scoreEstimation`: ước lượng hợp lý | `given={estimation:"45",exact:"48"}`, `correct={exact:"48",tolerance:10}` | `{estimationVerdict:"reasonable", exactVerdict:"correct"}` |
| TC-04 | Scoring boundary (đúng mép tolerance) | `given.estimation="58"`, `correct.tolerance=10`, `exact=48` | `estimationVerdict="reasonable"` |
| TC-05 | API contract: `GET /api/question-sets/:setId/questions` không lộ đáp án | GET set chứa câu `type:estimate` | Response **không có** `correct_answer` ở bất kỳ câu nào |
| TC-06 | Persistence: refresh không mất trạng thái | `POST /api/submissions` → `GET /api/me/progress` | `attempts` có bản ghi mới, `progress.best_score` cập nhật |
| TC-07 | Feedback 2 chiều: ước lượng ok + tính sai | `given={estimation:"50",exact:"47"}`, `correct={exact:"48",tolerance:10}` | `estimationVerdict:"reasonable"`, `exactVerdict:"wrong"` |
| TC-08 | Invalid: estimation là chuỗi không phải số | `given.estimation="abc"` | HTTP 400, thông báo tiếng Việt |
| TC-09 | Invalid: `answers[q.id]` là scalar cho type `estimate` | `answers["est-1"]="42"` (thiếu object) | HTTP 400 |
| TC-10 | Invalid: `correct_answer` JSON hỏng | Seed có `correctAnswer:"not-a-json"` | Server log cảnh báo, câu đó mark `ok:false`, không crash cả request |
| TC-11 | Số âm: `estimation=-5`, exact dương | `given={estimation:"-5",exact:"48"}` | `estimationVerdict:"off"`, không crash |
| TC-12 | Boundary: estimation = exact | `given={estimation:"48",exact:"48"}` | `reasonable` + `correct` |
| TC-13 | Boundary: estimation ngay ngoài tolerance | `given.estimation = exact + tolerance + 1` | `off` |
| TC-14 | Missing `exact` field | `answers["est-1"]={estimation:"45"}` | HTTP 400 |
| TC-15 | Backward compat: câu type cũ vẫn chấm đúng | `answers["input-1"]="9"`, DB `correct_answer:"9"` | `ok:true` như trước, không bị dispatcher mới ảnh hưởng |

### 6.3. Coverage target cho Checkpoint 2

- Unit: ≥ 90% line coverage cho `scoring.js` và `validator.js`.
- Integration: cover 100% endpoint mới.
- E2E: 1 luồng happy path + 1 luồng lỗi.

---

## 7. Traceability matrix

| User Story | Acceptance Criteria đề thi | Test cases |
|---|---|---|
| US-01 | B-01, B-02, B-03 | TC-01, TC-02, TC-03 |
| US-02 | B-06 | TC-07, TC-12 |
| US-03 | B-04 | TC-05 |
| US-04 | B-05 | TC-06 |
| US-05 | B-01, B-07 | TC-01, PR check |

---

## 8. Giả định & rủi ro

| Giả định | Rủi ro | Giảm thiểu |
|---|---|---|
| `architecture-reference.md` phản ánh đúng mã nguồn hiện tại | Lệch giữa tài liệu & code | Đối chiếu code trước khi viết `DECISIONS.md` chi tiết |
| Ngưỡng tolerance ở Mục 5.2 phù hợp sư phạm lớp 3 | Giáo viên phản hồi ngưỡng quá chặt/lỏng | Cho phép cấu hình per-question trong fixture |
| Starter đã có cơ chế lưu kết quả có thể tái dùng | Có thể phải viết mới nếu bảng không phù hợp | Có ADR-002 dự phòng thiết kế bảng mới |

---

## 9. Open questions cho TA (buổi PC-1)

1. **Phép chia có dư:** "đáp án chính xác" tính theo thương nguyên hay thương thập phân? (Chương trình lớp 3 chỉ dạy chia có dư nguyên — nhóm đề xuất lấy thương nguyên).
2. **Format đáp án trong seed:** nhóm đề xuất mã hoá `correct_answer` cho type `estimate` dưới dạng JSON string lồng: `'{"exact":"48","tolerance":10}'`. TA có yêu cầu format khác không?
3. **Lesson để gắn bộ đề mới:** nhóm đề xuất gắn vào `bai-10` (Bảng nhân 6 & Bảng chia 6). TA có đề xuất lesson khác (vd. bài 11/12) không?
4. **Thêm dependency:** nhóm dự định thêm `jest` + `supertest` cho test. Mục 5.1 đề thi cho phép OSS khai báo — xác nhận quy trình khai báo (chỉ cần ghi vào `package.json` hay cần file riêng)?
5. **Hidden test có đụng vào các type cũ không?** Nếu có, nhóm cần đảm bảo backward compat cho `multiple-choice`/`input`/`compare`/`paint` (đã có TC-15 trong kế hoạch test).
