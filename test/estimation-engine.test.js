const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  roundToNearestTen,
  parseStudentAnswer,
  parseExpectedAnswer,
  evaluateEstimateAnswer
} = require('../server/estimation-engine');

describe('Estimation Engine Unit Tests (Toán Lớp 3)', () => {

  describe('1. Quy tắc làm tròn về hàng chục gần nhất (roundToNearestTen)', () => {
    it('Làm tròn xuống khi chữ số hàng đơn vị < 5', () => {
      assert.equal(roundToNearestTen(21), 20);
      assert.equal(roundToNearestTen(24), 20);
      assert.equal(roundToNearestTen(72), 70);
    });

    it('Làm tròn lên khi chữ số hàng đơn vị >= 5 (Boundary case: 5)', () => {
      assert.equal(roundToNearestTen(25), 30);
      assert.equal(roundToNearestTen(45), 50);
      assert.equal(roundToNearestTen(89), 90);
    });

    it('Giữ nguyên khi số đã là số tròn chục', () => {
      assert.equal(roundToNearestTen(30), 30);
      assert.equal(roundToNearestTen(90), 90);
    });

    it('Xử lý input dạng chuỗi hợp lệ', () => {
      assert.equal(roundToNearestTen('48'), 50);
      assert.equal(roundToNearestTen('  62 '), 60);
    });

    it('Xử lý input không hợp lệ', () => {
      assert.ok(Number.isNaN(roundToNearestTen('abc')));
      assert.ok(Number.isNaN(roundToNearestTen(undefined)));
    });
  });

  describe('2. Phân tích câu trả lời của học sinh (parseStudentAnswer)', () => {
    it('Nhận diện object { estimate, exact } dạng số', () => {
      const res = parseStudentAnswer({ estimate: 150, exact: 144 });
      assert.equal(res.isValid, true);
      assert.equal(res.estimate, 150);
      assert.equal(res.exact, 144);
    });

    it('Nhận diện object { estimate, exact } dạng chuỗi số', () => {
      const res = parseStudentAnswer({ estimate: ' 150 ', exact: '144' });
      assert.equal(res.isValid, true);
      assert.equal(res.estimate, 150);
      assert.equal(res.exact, 144);
    });

    it('Nhận diện chuỗi JSON serialize từ client', () => {
      const res = parseStudentAnswer('{"estimate": 200, "exact": 196}');
      assert.equal(res.isValid, true);
      assert.equal(res.estimate, 200);
      assert.equal(res.exact, 196);
    });

    it('Nhận diện chuỗi phân tách dấu phẩy hoặc chấm phẩy', () => {
      const res = parseStudentAnswer('150, 144');
      assert.equal(res.isValid, true);
      assert.equal(res.estimate, 150);
      assert.equal(res.exact, 144);
    });

    it('Trả về isValid: false khi thiếu trường hoặc giá trị không phải số (Invalid input)', () => {
      assert.equal(parseStudentAnswer(null).isValid, false);
      assert.equal(parseStudentAnswer(undefined).isValid, false);
      assert.equal(parseStudentAnswer({ estimate: 150 }).isValid, false);
      assert.equal(parseStudentAnswer({ estimate: 'abc', exact: 144 }).isValid, false);
      assert.equal(parseStudentAnswer('').isValid, false);
      assert.equal(parseStudentAnswer('chuỗi rác không có số').isValid, false);
    });
  });

  describe('3. Đánh giá chấm điểm tất định & Feedback sư phạm (evaluateEstimateAnswer)', () => {
    const sampleCorrect = JSON.stringify({
      estimate: 150,
      exact: 144,
      formula: '48 × 3',
      roundedFormula: '50 × 3 = 150',
      explanation: 'Làm tròn 48 thành 50. Ước lượng 50 × 3 = 150. Tính đúng 48 × 3 = 144.'
    });

    it('TH1: Cả ước lượng và tính chính xác đều đúng (Full score)', () => {
      const result = evaluateEstimateAnswer(sampleCorrect, { estimate: 150, exact: 144 });
      assert.equal(result.isCorrect, true);
      assert.equal(result.estimateOk, true);
      assert.equal(result.exactOk, true);
      assert.match(result.feedbackMessage, /Xuất sắc/);
    });

    it('TH2: Ước lượng hợp lý nhưng tính kết quả sai (B-06 phân biệt)', () => {
      const result = evaluateEstimateAnswer(sampleCorrect, { estimate: 150, exact: 140 });
      assert.equal(result.isCorrect, false);
      assert.equal(result.estimateOk, true);
      assert.equal(result.exactOk, false);
      assert.match(result.feedbackMessage, /ước lượng hợp lý/);
      assert.match(result.feedbackMessage, /tính chính xác cần cẩn thận/);
    });

    it('TH3: Tính đúng nhưng ước lượng sai (B-06 phân biệt)', () => {
      const result = evaluateEstimateAnswer(sampleCorrect, { estimate: 120, exact: 144 });
      assert.equal(result.isCorrect, false);
      assert.equal(result.estimateOk, false);
      assert.equal(result.exactOk, true);
      assert.match(result.feedbackMessage, /đã tính đúng kết quả/);
      assert.match(result.feedbackMessage, /ước lượng nhẩm/);
    });

    it('TH4: Cả ước lượng và tính kết quả đều sai', () => {
      const result = evaluateEstimateAnswer(sampleCorrect, { estimate: 100, exact: 100 });
      assert.equal(result.isCorrect, false);
      assert.equal(result.estimateOk, false);
      assert.equal(result.exactOk, false);
      assert.match(result.feedbackMessage, /đều chưa đúng/);
      assert.match(result.feedbackMessage, /Làm tròn 48/);
    });

    it('TH5: Input không hợp lệ / bỏ trống', () => {
      const result = evaluateEstimateAnswer(sampleCorrect, null);
      assert.equal(result.isCorrect, false);
      assert.equal(result.estimateOk, false);
      assert.equal(result.exactOk, false);
      assert.match(result.feedbackMessage, /Em chưa hoàn thành đủ 2 phần/);
    });
  });

});
