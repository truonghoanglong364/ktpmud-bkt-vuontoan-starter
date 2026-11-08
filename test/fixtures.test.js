const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { roundToNearestTen, parseExpectedAnswer } = require('../server/estimation-engine');

describe('Fixture Tests - B-02: Bộ câu hỏi Synthetic Tái lập được', () => {
  const seedPath = path.join(__dirname, '..', 'data', 'seed.json');
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

  it('Tồn tại bộ bài tập phieu-uoc-luong-lop-3 liên kết với bài học SGK', () => {
    const set = seed.questionSets['phieu-uoc-luong-lop-3'];
    assert.ok(set, 'Bộ đề phieu-uoc-luong-lop-3 phải tồn tại trong seed.json');
    assert.equal(set.kind, 'exercise');
    assert.ok(set.lessonId, 'Bộ đề phải gắn với một bài học hợp lệ trong SGK');
  });

  it('Có tối thiểu 12 câu hỏi synthetic dạng estimate', () => {
    const set = seed.questionSets['phieu-uoc-luong-lop-3'];
    const estimateQuestions = set.questions.filter(q => q.type === 'estimate');
    assert.ok(
      estimateQuestions.length >= 12,
      `Yêu cầu tối thiểu 12 câu hỏi estimate, hiện có ${estimateQuestions.length}`
    );
  });

  it('Tất cả 12 câu hỏi đều có cấu trúc hợp lệ và đáp án tất định', () => {
    const set = seed.questionSets['phieu-uoc-luong-lop-3'];
    const questions = set.questions.filter(q => q.type === 'estimate');

    let mulCount = 0;
    let divCount = 0;

    questions.forEach((q, idx) => {
      assert.ok(q.id, `Câu ${idx + 1} phải có id`);
      assert.ok(q.prompt, `Câu ${idx + 1} phải có prompt`);
      assert.ok(q.points > 0, `Câu ${idx + 1} phải có điểm số > 0`);

      const ans = parseExpectedAnswer(q.correctAnswer);
      assert.ok(Number.isFinite(ans.estimate), `Câu ${q.id}: Giá trị estimate phải là số hữu hạn`);
      assert.ok(Number.isFinite(ans.exact), `Câu ${q.id}: Giá trị exact phải là số hữu hạn`);

      if (q.category === 'multiplication') mulCount++;
      if (q.category === 'division') divCount++;
    });

    assert.ok(mulCount >= 3, 'Phải có ít nhất 3 câu phép nhân');
    assert.ok(divCount >= 3, 'Phải có ít nhất 3 câu phép chia');
  });
});
