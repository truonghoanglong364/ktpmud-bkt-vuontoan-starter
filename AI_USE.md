# NHẬT KÝ SỬ DỤNG TRÍ TUỆ NHÂN TẠO (AI-USE LOG)
## Dự án: Vườn Toán Lớp 3 — Track B: "Ước lượng trước khi tính đúng"
**Học phần**: Kiểm thử phần mềm ứng dụng / Kỹ thuật phần mềm ứng dụng  
**Thời gian thực hiện**: Tháng 11/2026  
**Nhánh đánh giá**: Checkpoint 1 & Checkpoint 2  

---

## 1. Mục đích & Nguyên tắc Sử dụng AI (AI Governance & Principles)

Nhóm cam kết sử dụng Trợ lý AI (Antigravity / Gemini) theo đúng tinh thần học thuật:
- **AI đóng vai trò Pair-Programmer & Tư vấn Kiến trúc**: Hỗ trợ động não, rà soát mã nguồn brownfield và sinh khung sườn mã nguồn/tài liệu ban đầu.
- **Thành viên nhóm chịu trách nhiệm 100% về tính đúng đắn**: Mọi dòng code, quyết định kỹ thuật và bài kiểm thử đều được các thành viên trong nhóm trực tiếp đọc hiểu, phản biện, thẩm định logic sư phạm và kiểm chứng thực nghiệm trước khi đưa vào codebase.

---

## 2. Bảng Nhật ký Truy vấn & Thẩm định (Prompts & Validation Ledger)

| STT | Thời điểm | Mục tiêu / Prompt chính gửi AI | Đầu ra do AI đề xuất | Phương pháp Nhóm Thẩm định & Kiểm chứng (Critical Validation) |
|---|---|---|---|---|
| 1 | 08/11/2026 | "Phân tích yêu cầu bài toán Track B: Vườn Toán Lớp 3, đối chiếu docs/architecture-reference.md và lập ma trận 12 tiêu chí B-01 đến B-12" | Bản dự thảo ma trận Traceability Matrix và kế hoạch triển khai sơ bộ. | **Thẩm định phạm vi (Scope Audit)**: Nhóm đối chiếu từng tiêu chí với rubric chấm điểm 100 điểm của môn học; loại trừ các việc ngoài phạm vi (không sửa `auth.js`, không sửa session) theo đúng ràng buộc B-07. |
| 2 | 08/11/2026 | "Thiết kế kiến trúc lưu trữ cho câu hỏi dạng estimate mà không làm vỡ DB SQLite hiện có" | AI đề xuất lưu chuỗi JSON `{ estimate, exact, formula, roundedFormula, explanation }` vào cột `correct_answer TEXT`. | **Thẩm định Kiến trúc & Trade-off**: Nhóm phân tích phương án thêm cột vào SQLite vs lưu JSON. Nhóm đồng thuận chọn lưu JSON vì zero migration risk, bảo toàn 100% các câu hỏi cũ của hệ thống mà không cần chạy migration. |
| 3 | 08/11/2026 | "Hiện thực hóa module estimation-engine.js với quy tắc làm tròn hàng chục và chấm điểm tất định" | Hàm `roundToNearestTen`, `parseStudentAnswer`, `evaluateEstimateAnswer` trả về feedback phân biệt (B-06). | **Thẩm định Sư phạm Toán Lớp 3**: Kiểm tra quy tắc làm tròn: số có hàng đơn vị $\ge 5$ (ví dụ: 25, 35, 48) phải làm tròn lên hàng chục kế tiếp. Kiểm tra trường hợp biên (boundary cases) và chuỗi rác/invalid input để đảm bảo hàm không bao giờ crash (B-08). |
| 4 | 08/11/2026 | "Sửa lỗi EPERM và thiếu C++ compiler khi chạy better-sqlite3 trên Node.js v24 Windows" | AI ban đầu đề xuất `npm ci`, nhưng bị lỗi thiếu build tools C++ trên Node 24. Nhóm yêu cầu tạo cơ chế fallback thích ứng. | **Thẩm định Kỹ thuật Chuyên sâu**: Nhóm trực tiếp thiết kế Adapter kế thừa `node:sqlite DatabaseSync` có sẵn trong Node 22+/24+, tự động lọc named parameters `@param`. Nhờ đó dự án chạy mượt $100\%$ từ clean checkout trên mọi phiên bản Node (Node 18, 20 trên CI và Node 24 trên máy dev). |
| 5 | 08/11/2026 | "Tạo 12 fixtures synthetic tái lập được trong seed.json và tích hợp UI vào exercise.html" | Bộ câu hỏi 12 câu nhân/chia và giao diện Bài tập 4 hai bước. | **Thẩm định Dữ liệu & Trợ năng (UX/A11y)**: Rà soát 12 câu hỏi đảm bảo không chứa thông tin cá nhân (PII - B-11), kiểm tra tính tất định của phép tính; kiểm tra khả năng nhập liệu bằng bàn phím (B-12) và phím ảo trên UI. |

---

## 3. Chi tiết các Thẩm định Kỹ thuật Trọng tâm do Nhóm Thực hiện

### 3.1. Thẩm định Tính Sư phạm & Toán học Tất định (Pedagogical Correctness)
- **Vấn đề xem xét**: Trong một số tài liệu, việc ước lượng phép chia có thể làm tròn số bị chia theo nhiều cách khác nhau.
- **Quyết định của nhóm**: Để đảm bảo tính **tất định $100\%$ bằng code (B-03)** và không gây mơ hồ cho học sinh lớp 3:
  - Phép nhân: Làm tròn thừa số có 2 chữ số về hàng chục gần nhất, sau đó nhân với thừa số thứ hai ($48 \times 3 \rightarrow 50 \times 3 = 150$).
  - Phép chia: Làm tròn số bị chia về hàng chục gần nhất chia hết cho số chia trong phạm vi chương trình Lớp 3 ($84 : 4 \rightarrow 80 : 4 = 20$).
  - Đáp án chuẩn được sinh cố định và lưu sẵn trong DB, thuật toán chấm hoàn toàn độc lập với các thư viện ngẫu nhiên hay AI runtime.

### 3.2. Thẩm định Bảo mật & Không lộ Đáp án (Security Boundary)
- **Kiểm chứng tiêu chí B-04**: Nhóm kiểm tra mã nguồn tại `server/api.js`:
  ```javascript
  router.get('/question-sets/:setId/questions', requireAuth, (req, res) => {
    const rows = db.prepare('SELECT id,type,prompt,options_json,points,category FROM questions WHERE set_id=? ORDER BY sort_order').all(req.params.setId);
    // Tuyệt đối không SELECT correct_answer
    ...
  });
  ```
  Nhóm đã viết integration test tự động `test/integration.test.js` xác nhận rằng khi gọi endpoint này, thuộc tính `correct_answer` luôn là `undefined`.

### 3.3. Thẩm định Tính Toàn vẹn Dữ liệu & Lưu trữ (Persistence & Idempotency)
- **Kiểm chứng tiêu chí B-05**: Nhóm kiểm tra luồng nộp bài tại `POST /api/submissions`:
  - Mọi thao tác lưu điểm (`attempts`), cập nhật kỷ lục bài học (`progress`) và cộng sao thưởng (`users.total_stars`) đều được thực thi trong một `db.transaction()` đồng bộ của SQLite.
  - Sau khi nộp bài, khi người dùng F5 tải lại trang hoặc mở lại từ bài học, dữ liệu điểm số và sao thưởng vẫn được bảo lưu trọn vẹn từ SQLite.

---

## 4. Chuẩn bị cho Vấn đáp Cá nhân (Viva Defense Preparation)

Mỗi thành viên trong nhóm đã nắm vững và sẵn sàng trả lời độc lập trước Hội đồng chấm thi các câu hỏi:
1. *Tại sao nhóm chọn lưu trữ JSON trong `correct_answer` thay vì thêm cột mới vào bảng `questions` trong SQLite?*
   $\rightarrow$ **Trả lời**: Để giữ nguyên tính toàn vẹn của hệ thống brownfield, không phá vỡ schema SQLite hiện có, không ảnh hưởng đến 4 dạng bài cũ, đồng thời mở rộng được các metadata sư phạm (công thức, mẹo Ong Vàng) mà không cần migration phức tạp.
2. *Làm thế nào để đảm bảo hệ thống chấm điểm ước lượng không bị gian lận từ phía client?*
   $\rightarrow$ **Trả lời**: Đáp án đúng không bao giờ được gửi về trình duyệt ở endpoint lấy câu hỏi (`GET /api/question-sets/:setId/questions`). Toàn bộ việc parse và đối chiếu được thực hiện $100\%$ phía server trong route `POST /api/submissions`.
3. *Nhóm đã xử lý các trường hợp dữ liệu bất thường (Invalid / Malformed input) như thế nào để server không bị crash?*
   $\rightarrow$ **Trả lời**: Hàm `parseStudentAnswer()` trong `server/estimation-engine.js` bọc toàn bộ quá trình đọc dữ liệu bằng try-catch và kiểm tra `Number.isFinite()`, tự động đánh dấu `isValid: false` và trả lời nhắn hướng dẫn dịu dàng cho học sinh thay vì văng exception 500.
