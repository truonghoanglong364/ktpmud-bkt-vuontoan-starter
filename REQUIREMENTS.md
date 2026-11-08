# TÀI LIỆU PHÂN TÍCH YÊU CẦU PHẦN MỀM (REQUIREMENTS SPECIFICATION)
## Dự án: Vườn Toán Lớp 3 — Dạng bài "Ước lượng trước khi tính đúng"
**Mã tài liệu**: `KTPMUD-BKT-TRACKB-REQUIREMENTS`  
**Nhánh / Track**: Track B (Toán Tiểu Học Lớp 3)  
**Phiên bản**: `1.0.0` (Checkpoint 1)  
**Đối chiếu cơ sở**: `docs/architecture-reference.md` (Repo: `fossbk-spec/ktpmud-bkt-vuontoan-starter` @ tag `bkt-2026-v1`)

---

## 1. Giới thiệu & Bối cảnh Bài toán (Background & Context)
"Vườn Toán Lớp 3" là nền tảng học toán tương tác brownfield dành cho học sinh tiểu học (lớp 3). Nền tảng được xây dựng trên nền Node.js/Express kết hợp cơ sở dữ liệu SQLite (`better-sqlite3`) và giao diện web tĩnh thân thiện.

Trong chương trình Toán Lớp 3 (Chương trình GDPT mới), kỹ năng **ước lượng kết quả phép tính** trước khi thực hiện tính toán chi tiết là một năng lực tư duy định lượng nền tảng. Học sinh học cách làm tròn số (đến hàng chục gần nhất) để tính nhẩm nhanh một khoảng giá trị ước lượng, từ đó tự kiểm chứng và giảm thiểu sai sót khi đặt tính rồi tính.

Dự án này mở rộng hệ thống hiện có để tích hợp dạng bài tập mới: **"Ước lượng trước khi tính đúng"** trên các phép nhân và phép chia, tuân thủ nghiêm ngặt nguyên tắc **Deterministic Math** (toán học tất định) và **Server-side Scoring** (chấm điểm an toàn phía máy chủ).

---

## 2. Phạm vi Dự án (Project Scope)

### 2.1. Trong phạm vi (In-Scope)
1. **Dạng bài tập mới (`type = 'estimate'`)**:
   - Mở rộng luồng luyện tập trên hệ thống hiện có mà không phá vỡ 4 dạng câu hỏi cũ (`multiple-choice`, `input`, `compare`, `paint`).
   - Thiết kế câu hỏi theo quy trình 2 bước sư phạm: Bước 1 (Nhập giá trị ước lượng nhẩm) $\rightarrow$ Bước 2 (Nhập kết quả tính chính xác).
2. **Quy tắc toán học & chấm điểm tất định (Deterministic Scoring Engine)**:
   - Quy tắc làm tròn về hàng chục gần nhất:
     - Với phép nhân $a \times b$ ($a \in [10, 99], b \in [2, 9]$): Làm tròn $a$ về hàng chục gần nhất (chữ số hàng đơn vị $\ge 5$ làm tròn lên, $< 5$ làm tròn xuống). Giá trị ước lượng chuẩn là $a_{\text{chục}} \times b$.
     - Với phép chia $a : b$: Làm tròn $a$ về số tròn chục gần nhất chia hết cho $b$ (hoặc hàng chục gần nhất).
   - Đánh giá phân biệt rõ ràng: **Ước lượng hợp lý** vs **Kết quả chính xác**.
3. **Bảo mật và an toàn dữ liệu**:
   - Endpoint lấy câu hỏi (`GET /api/question-sets/:setId/questions`) tuyệt đối **không trả về đáp án đúng** (`correct_answer`).
   - Logic chấm điểm thực hiện $100\%$ tại server (`POST /api/submissions`), lưu trữ lịch sử làm bài (`attempts`) và cập nhật tiến độ (`progress`). Refresh trang không làm mất kết quả đã nộp.
4. **Bộ câu hỏi kiểm chuẩn (Synthetic Fixtures)**:
   - Cung cấp tối thiểu 12 câu hỏi synthetic tái lập được trong `data/seed.json`, gắn kết hợp lệ với bài học trong SGK.
5. **Chất lượng mã nguồn, Kiểm thử tự động & CI**:
   - Thêm lệnh `npm test` chạy sạch từ clean checkout.
   - Kiểm thử Unit & Integration bao phủ các ca thông thường (normal), ca biên (boundary), ca không hợp lệ (invalid) và logic tính điểm.
   - Thiết lập GitHub Actions CI tự động chạy `npm ci` và `npm test` trên mọi Pull Request.
6. **Trải nghiệm người dùng (UX) & Trợ năng (Accessibility)**:
   - Hỗ trợ thao tác hoàn toàn bằng bàn phím (Tab, Enter, số) và bàn phím ảo trên màn hình cảm ứng.
   - Phản hồi sư phạm gần gũi, khích lệ tâm lý học sinh lớp 3 (nhân vật Ong Vàng).

### 2.2. Ngoài phạm vi (Out-of-Scope)
- Không bổ sung toàn bộ chương trình Toán hay sách giáo khoa mới ngoài phạm vi dạng bài ước lượng.
- Không sửa đổi hoặc thay thế cơ chế xác thực/phiên đăng nhập (`server/auth.js`), cookies hay tài khoản mẫu có sẵn (Tiêu chí B-07).
- Không kết nối với ứng dụng thực tế hoặc cơ sở dữ liệu production bên ngoài.
- Tuyệt đối không dùng dữ liệu người dùng thật (PII).
- Tuyệt đối không gọi mô hình ngôn ngữ lớn (LLM API) trong quá trình runtime để sinh đáp án hoặc chấm điểm.
- Không yêu cầu bắt buộc deploy public lên cloud hosting.

---

## 3. Ma trận Yêu cầu & Tiêu chí Nghiệm thu (Traceability Matrix)

| ID Tiêu chí | Mô tả Tiêu chí | User Story & Kịch bản Nghiệm thu (Gherkin) | Phương thức Kiểm chứng |
|---|---|---|---|
| **B-01** | Truy cập từ luồng học hiện có, không phải trang demo rời | **Là** học sinh lớp 3, **tôi muốn** vào mục Luyện tập của Bài học để làm bài tập ước lượng, **để** kiến thức gắn liền với tiến trình học.<br>• *Given*: Học sinh đã đăng nhập và vào Bài 10.<br>• *When*: Chọn phiếu bài tập Ước lượng.<br>• *Then*: Hệ thống nạp câu hỏi vào trang `exercise.html` chuẩn. | Manual Walkthrough & UI Route Test |
| **B-02** | Có tối thiểu 12 fixture/câu hỏi synthetic tái lập được | **Là** giáo viên/tester, **tôi muốn** có sẵn bộ đề mẫu 12 câu hỏi ước lượng, **để** kiểm thử toàn diện các tình huống phép nhân và phép chia.<br>• *Given*: Database được khởi tạo từ `data/seed.json`.<br>• *When*: Truy vấn bộ câu hỏi ước lượng.<br>• *Then*: Trả về đúng $\ge 12$ câu hỏi hợp lệ với dữ liệu synthetic tái lập được. | Unit/Data Test trong `test/seed.test.js` |
| **B-03** | Quy tắc tạo và chấm ước lượng rõ ràng, tất định và test được | **Là** hệ thống chấm, **tôi muốn** áp dụng quy tắc làm tròn hàng chục bằng code thuần túy, **để** kết quả luôn nhất quán và không phụ thuộc vào yếu tố ngẫu nhiên.<br>• *Given*: Phép tính $48 \times 3$.<br>• *When*: Đánh giá ước lượng.<br>• *Then*: Chấp nhận ước lượng $50 \times 3 = 150$ và đáp án đúng 144. | Automated Unit Test `test/estimation-engine.test.js` |
| **B-04** | API không trả đáp án đúng trước khi nộp | **Là** quản trị viên an toàn, **tôi muốn** client chỉ nhận đề bài, **để** học sinh không thể gian lận bằng cách inspect mạng.<br>• *Given*: Học sinh gửi `GET /api/question-sets/:setId/questions`.<br>• *When*: Nhận payload JSON.<br>• *Then*: Trường `correct_answer` hoàn toàn không tồn tại trong response. | Integration Test `test/integration.test.js` |
| **B-05** | Server chấm và lưu kết quả; refresh không mất dữ liệu | **Là** học sinh, **tôi muốn** kết quả làm bài được lưu bền vững, **để** xem lại điểm và sao thưởng bất kỳ lúc nào.<br>• *Given*: Học sinh nộp bài `POST /api/submissions`.<br>• *When*: Tải lại trang hoặc gọi `GET /api/me/progress`.<br>• *Then*: Điểm cao nhất và trạng thái hoàn thành vẫn nguyên vẹn. | Integration Test `test/integration.test.js` |
| **B-06** | Có feedback phân biệt "ước lượng hợp lý" với "kết quả chính xác" | **Là** học sinh, **tôi muốn** biết rõ mình đúng/sai ở bước ước lượng hay bước tính đúng, **để** khắc phục điểm yếu.<br>• *Given*: Học sinh ước lượng đúng nhưng tính sai.<br>• *When*: Server trả kết quả.<br>• *Then*: `estimateOk = true`, `exactOk = false` và lời nhắn phân biệt rõ 2 bước. | Unit & Integration Tests |
| **B-07** | Không sửa `server/auth.js`, session, tài khoản mẫu | **Là** kiến trúc sư hệ thống, **tôi muốn** giữ nguyên vẹn module xác thực, **để** không gây tác động tiêu cực đến an ninh hệ thống hiện có.<br>• *Given*: Git diff của dự án.<br>• *When*: Kiểm tra thay đổi.<br>• *Then*: `server/auth.js` không có bất kỳ commit sửa đổi nào. | Git Diff Inspection & CI Security Check |
| **B-08** | Có test tự động cho normal, boundary, invalid input và scoring | **Là** kỹ sư QA, **tôi muốn** có test suite bao phủ mọi ca biên và dữ liệu dị thường, **để** hệ thống không bao giờ crash.<br>• *Given*: Đầu vào null, rỗng, chữ cái, số âm, số tận cùng bằng 5.<br>• *When*: Gọi hàm chấm.<br>• *Then*: Trả về `isCorrect = false` và thông báo lỗi rõ ràng, không văng lỗi 500. | Test Suite `test/estimation-engine.test.js` |
| **B-09** | Bổ sung lệnh `npm test`; test đạt từ clean checkout | **Là** thành viên nhóm, **tôi muốn** chỉ cần gõ `npm test` là chạy kiểm thử ngay, **để** kiểm tra chất lượng code dễ dàng.<br>• *Given*: Một máy mới clone repo về và chạy `npm ci`.<br>• *When*: Chạy `npm test`.<br>• *Then*: $100\%$ các bài test đều pass với exit code 0. | NPM Script Verification |
| **B-10** | Bổ sung CI chạy `npm ci` và `npm test` trên Pull Request | **Là** người review code, **tôi muốn** GitHub tự động chạy test khi có PR, **để** ngăn chặn lỗi hồi quy trước khi merge.<br>• *Given*: Một PR được tạo trên nhánh `main`.<br>• *When*: GitHub Actions kích hoạt.<br>• *Then*: Luồng `npm ci` và `npm test` thực thi thành công. | Workflow `.github/workflows/ci.yml` |
| **B-11** | Không có PII/secret; chỉ dùng synthetic data | **Là** nhân viên bảo mật, **tôi muốn** repo không chứa thông tin định danh hay khóa bí mật, **để** tuân thủ quy chuẩn bảo mật giáo dục.<br>• *Given*: Quét toàn bộ repo.<br>• *When*: Tìm kiếm token, secret, thông tin cá nhân.<br>• *Then*: Chỉ tồn tại tài khoản mẫu synthetic (`hocsinh01`, `giaovien01`). | Secret Scanning & Audit Checklist |
| **B-12** | Giao diện dùng được bằng bàn phím và có thông báo lỗi dễ hiểu | **Là** học sinh sử dụng bàn phím máy tính hoặc phím ảo cảm ứng, **tôi muốn** dễ dàng chuyển ô nhập và đọc thông báo dễ hiểu.<br>• *Given*: Màn hình làm bài ước lượng.<br>• *When*: Dùng phím Tab/Enter/phím ảo và nhập sai.<br>• *Then*: Focus di chuyển mượt mà, thông báo lỗi bằng tiếng Việt gần gũi. | UX Accessibility Review |

---

## 4. Đặc tả Sư phạm Chi tiết về Quy tắc Ước lượng

### 4.1. Quy tắc làm tròn (Rounding Rules)
- Áp dụng nguyên lý làm tròn số học cơ bản trong SGK Toán 3:
  - Nếu chữ số hàng đơn vị là $0, 1, 2, 3, 4$: Làm tròn **xuống** hàng chục hiện tại (Ví dụ: $23 \rightarrow 20$; $71 \rightarrow 70$).
  - Nếu chữ số hàng đơn vị là $5, 6, 7, 8, 9$: Làm tròn **lên** hàng chục tiếp theo (Ví dụ: $25 \rightarrow 30$; $48 \rightarrow 50$; $85 \rightarrow 90$).

### 4.2. Luồng thực hiện bài toán của Học sinh
1. **Quan sát đề bài**: Ví dụ: *"Một đội xe có 3 xe tải, mỗi xe chở 48 bao gạo. Hãy ước lượng và tính xem cả đội chở được bao nhiêu bao gạo?"* $\rightarrow$ Phép tính: $48 \times 3$.
2. **Bước 1 — Ước lượng**:
   - Học sinh làm tròn $48$ thành $50$.
   - Tính nhẩm: $50 \times 3 = 150$.
   - Nhập vào ô "Ước lượng": `150`.
3. **Bước 2 — Tính kết quả chính xác**:
   - Đặt tính rồi tính: $48 \times 3 = 144$.
   - Nhập vào ô "Kết quả chính xác": `144`.
4. **Nộp bài & Nhận phản hồi**:
   - Server phân tích độc lập 2 giá trị và đưa ra nhận xét động viên phù hợp.
