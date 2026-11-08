> **Đây là bản sao đóng băng (starter) dùng cho Bài kiểm tra Hackathon (BKT-2 /
> Track B) môn Kỹ thuật Phần mềm Ứng dụng (KTPMUD) — KHÔNG phải ứng dụng thật
> đang vận hành, không kết nối tới dữ liệu/CSDL production thật.** Toàn bộ tên
> người và ảnh thật trong bản gốc đã được thay bằng dữ liệu hư cấu trước khi
> công khai repo này. Sinh viên làm việc trên fork của repo NÀY, nộp bài qua
> `ktpmud-project` theo đúng hướng dẫn `nop_bai.md` của KTPMUD — không PR vào
> ứng dụng Vườn Toán thật.

---

# 🌱 Vườn Toán Lớp 3 — Trường Tiểu học Hoàng Mai
## Nâng cấp Track B: Dạng bài "Ước lượng trước khi tính đúng"

Nền tảng học Toán Lớp 3 tương tác (Node.js/Express + SQLite + HTML/JS tĩnh). Dự án đã được mở rộng hoàn chỉnh luồng nghiệp vụ (vertical slice) cho dạng bài **"Ước lượng trước khi tính đúng"**, đáp ứng trọn vẹn $12/12$ Acceptance Criteria (B-01 đến B-12) và chuẩn bị đầy đủ hồ sơ Checkpoint 1 & Checkpoint 2.

---

## 1. Hướng dẫn Chạy & Kiểm thử Tự động

Yêu cầu môi trường: **Node.js 18+** (Hỗ trợ Node 18, 20 LTS và Node 22/24).

```bash
# 1. Cài đặt dependencies từ clean checkout (B-09)
npm ci
# hoặc: npm install

# 2. Chạy bộ kiểm thử tự động (21 test cases - B-08, B-09)
npm test

# 3. Khởi tạo lại cơ sở dữ liệu mẫu từ seed.json
npm run reset-db

# 4. Khởi động máy chủ ứng dụng
npm start
# Truy cập giao diện tại: http://localhost:3000
```

### Tài khoản đăng nhập mẫu (Synthetic Data - B-11)

| Vai trò | Tên đăng nhập | Mật khẩu | Ghi chú |
|---|---|---|---|
| Học sinh | `hocsinh01` … `hocsinh99` | `123456` | 99 tài khoản synthetic, điểm và tiến độ lưu SQLite |
| Giáo viên | `giaovien01` | `123456` | Quản lý học sinh, thống kê bài học |

---

## 2. Ma trận Đối chiếu 12 Tiêu chí Nghiệm thu (Track B)

| Mã AC | Tiêu chí Nghiệm thu | Hiện thực hóa kỹ thuật trong Codebase | Trạng thái |
|---|---|---|---|
| **B-01** | Truy cập từ luồng học hiện có | Tích hợp vào bài tập Bài 9 & 10 tại `public/exercise.html` và bộ đề `phieu-uoc-luong-lop-3`. | ✅ Hoàn thành |
| **B-02** | Tối thiểu 12 fixture synthetic | Đã thêm 12 câu hỏi synthetic tái lập được trong `data/seed.json` (`phieu-uoc-luong-lop-3`). | ✅ Hoàn thành |
| **B-03** | Quy tắc toán tất định, kiểm thử được | Xây dựng `server/estimation-engine.js` làm tròn hàng chục gần nhất, không dùng AI runtime. | ✅ Hoàn thành |
| **B-04** | API không trả đáp án trước khi nộp | Endpoint `GET /api/question-sets/:setId/questions` bảo mật, không select `correct_answer`. | ✅ Hoàn thành |
| **B-05** | Server chấm & lưu kết quả bền vững | Chấm tập trung tại `POST /api/submissions`, transaction lưu `attempts` & `progress`. | ✅ Hoàn thành |
| **B-06** | Feedback phân biệt rõ 2 bước | Trả `estimateOk`, `exactOk` và nhận xét sư phạm riêng biệt của Ong Vàng trên UI. | ✅ Hoàn thành |
| **B-07** | Không sửa `server/auth.js` | Giữ nguyên $100\%$ module xác thực và session cookies. | ✅ Hoàn thành |
| **B-08** | Test tự động normal/boundary/invalid | Test suite 21 bài kiểm thử trong `test/` bao phủ mọi ca biên, số tận cùng bằng 5, chuỗi rác. | ✅ Hoàn thành |
| **B-09** | Thêm lệnh `npm test` chạy sạch | Script `"test": "node --test test/**/*.test.js"` chạy sạch từ clean checkout. | ✅ Hoàn thành |
| **B-10** | CI GitHub Actions trên PR | Cấu hình `.github/workflows/ci.yml` chạy `npm ci` & `npm test` trên Node 18 & 20. | ✅ Hoàn thành |
| **B-11** | Không có PII/secret | Chỉ sử dụng dữ liệu synthetic, rà soát an toàn thông tin giáo dục. | ✅ Hoàn thành |
| **B-12** | Hỗ trợ bàn phím & thông báo lỗi rõ ràng | Hỗ trợ Tab, Enter, số, bàn phím ảo, thông báo lỗi bằng tiếng Việt gần gũi. | ✅ Hoàn thành |

---

## 3. Hồ sơ Báo cáo Kỹ thuật Bàn giao

Nhóm đã hoàn thành trọn bộ 3 tài liệu theo chuẩn Rubric chấm điểm:
- 📄 [REQUIREMENTS.md](file:///d:/ktpmud-bkt-vuontoan-starter/REQUIREMENTS.md): Đặc tả yêu cầu phần mềm, bối cảnh sư phạm Toán lớp 3, phạm vi và Traceability Matrix.
- 📐 [DECISIONS.md](file:///d:/ktpmud-bkt-vuontoan-starter/DECISIONS.md): Hồ sơ Kiến trúc & Quyết định Kỹ thuật (ADR), phân tích Trade-offs, sơ đồ kiến trúc C4 và Sequence Diagram.
- 📝 [AI_USE.md](file:///d:/ktpmud-bkt-vuontoan-starter/AI_USE.md): Nhật ký sử dụng AI, quy trình thẩm định logic toán học, bảo mật, tương thích runtime và bộ câu hỏi vấn đáp Viva.

---

## 4. Cấu trúc Thư mục Codebase

```
ktpmud-bkt-vuontoan-starter/
├─ .github/workflows/ci.yml     # CI Pipeline GitHub Actions (B-10)
├─ REQUIREMENTS.md              # Hồ sơ phân tích yêu cầu & ACs (14 điểm)
├─ DECISIONS.md                 # Hồ sơ thiết kế kiến trúc & ADR (18 điểm)
├─ AI_USE.md                    # Nhật ký sử dụng AI & thẩm định (Bắt buộc)
├─ server/
│  ├─ estimation-engine.js      # BỘ MÁY ƯỚC LƯỢNG & CHẤM ĐIỂM TẤT ĐỊNH (Mới)
│  ├─ api.js                    # REST API, chấm điểm submissions trên server
│  ├─ db.js                     # Adapter SQLite (hỗ trợ better-sqlite3 + node:sqlite)
│  ├─ auth.js                   # Xác thực cookie httpOnly (Bảo toàn 100% - B-07)
│  └─ index.js                  # Entry point Express app
├─ test/
│  ├─ estimation-engine.test.js # Unit test quy tắc làm tròn, scoring, invalid input
│  ├─ fixtures.test.js          # Kiểm thử 12 synthetic fixtures trong seed (B-02)
│  └─ integration.test.js       # Kiểm thử luồng nộp bài, tính sao, bảo mật B-04
├─ public/
│  ├─ exercise.html             # Giao diện luyện tập: Tích hợp Bài tập 4 Ước lượng
│  └─ assets/js/pages/
│     └─ exercise.js            # Logic thu thập đáp án, phím ảo & hiển thị feedback
├─ data/
│  ├─ seed.json                 # Dữ liệu gốc: Thêm bộ đề phieu-uoc-luong-lop-3 (12 câu)
│  └─ vuon-toan.db              # CSDL SQLite tự động nạp từ seed
└─ package.json                 # Cấu hình dự án, bổ sung script "npm test"
```
