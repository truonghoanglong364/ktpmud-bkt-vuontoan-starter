/**
 * Estimation Engine - Bộ máy chấm điểm và thẩm định tất định (Deterministic Scoring)
 * Dạng bài: "Ước lượng trước khi tính đúng" - Toán Lớp 3
 * Đáp ứng các tiêu chí: B-03, B-06, B-08
 */

/**
 * Làm tròn một số về hàng chục gần nhất theo quy tắc SGK Toán Lớp 3
 * @param {number|string} num
 * @returns {number}
 */
function roundToNearestTen(num) {
  const n = Number(num);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n / 10) * 10;
}

/**
 * Phân tích và chuẩn hóa dữ liệu trả lời của học sinh
 * Hỗ trợ object { estimate, exact }, JSON string hoặc chuỗi phân tách
 * @param {any} rawInput
 * @returns {{ estimate: number|null, exact: number|null, isValid: boolean }}
 */
function parseStudentAnswer(rawInput) {
  if (rawInput == null) {
    return { estimate: null, exact: null, isValid: false };
  }

  let parsed = rawInput;
  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        parsed = JSON.parse(trimmed);
      } catch (_) {
        parsed = null;
      }
    } else if (trimmed.includes(',') || trimmed.includes(';') || trimmed.includes('|')) {
      const parts = trimmed.split(/[,;|]/).map(s => s.trim());
      if (parts.length >= 2) {
        parsed = { estimate: parts[0], exact: parts[1] };
      }
    }
  }

  if (parsed && typeof parsed === 'object') {
    const estNum = Number(parsed.estimate);
    const exactNum = Number(parsed.exact);
    const estValid = Number.isFinite(estNum);
    const exactValid = Number.isFinite(exactNum);
    return {
      estimate: estValid ? estNum : null,
      exact: exactValid ? exactNum : null,
      isValid: estValid && exactValid
    };
  }

  return { estimate: null, exact: null, isValid: false };
}

/**
 * Chuẩn hóa và đọc đáp án chuẩn từ trường correct_answer trong DB
 * @param {string|object} correctAnswerField
 * @returns {{ estimate: number, exact: number, formula?: string, roundedFormula?: string, explanation?: string }}
 */
function parseExpectedAnswer(correctAnswerField) {
  if (typeof correctAnswerField === 'object' && correctAnswerField !== null) {
    return correctAnswerField;
  }
  try {
    const parsed = JSON.parse(String(correctAnswerField));
    return {
      estimate: Number(parsed.estimate),
      exact: Number(parsed.exact),
      formula: parsed.formula || '',
      roundedFormula: parsed.roundedFormula || '',
      explanation: parsed.explanation || ''
    };
  } catch (err) {
    // Dự phòng trường hợp lưu dạng "150/144"
    const parts = String(correctAnswerField).split(/[\/,;|]/).map(s => Number(s.trim()));
    return {
      estimate: parts[0] || 0,
      exact: parts[1] || 0,
      formula: '',
      roundedFormula: '',
      explanation: ''
    };
  }
}

/**
 * Đánh giá câu trả lời dạng 'estimate' theo tiêu chí tất định và tạo feedback sư phạm phân biệt (B-06)
 * @param {object|string} correctAnswerField Dữ liệu lưu trong questions.correct_answer
 * @param {any} rawStudentAnswer Dữ liệu học sinh nộp từ client
 * @returns {{
 *   isCorrect: boolean,
 *   estimateOk: boolean,
 *   exactOk: boolean,
 *   feedbackMessage: string,
 *   studentAnswer: { estimate: number|null, exact: number|null },
 *   expectedAnswer: { estimate: number, exact: number }
 * }}
 */
function evaluateEstimateAnswer(correctAnswerField, rawStudentAnswer) {
  const expected = parseExpectedAnswer(correctAnswerField);
  const student = parseStudentAnswer(rawStudentAnswer);

  if (!student.isValid) {
    return {
      isCorrect: false,
      estimateOk: false,
      exactOk: false,
      feedbackMessage: 'Em chưa hoàn thành đủ 2 phần (ước lượng và tính kết quả) hoặc nhập ký tự chưa hợp lệ.',
      studentAnswer: student,
      expectedAnswer: { estimate: expected.estimate, exact: expected.exact }
    };
  }

  const estimateOk = student.estimate === expected.estimate;
  const exactOk = student.exact === expected.exact;
  const isCorrect = estimateOk && exactOk;

  let feedbackMessage = '';
  const roundedInfo = expected.roundedFormula ? ` (ước lượng: ${expected.roundedFormula})` : ` (${expected.estimate})`;
  const exactInfo = ` (kết quả đúng là ${expected.exact})`;

  if (estimateOk && exactOk) {
    feedbackMessage = `Xuất sắc! Em ước lượng rất sát${roundedInfo} và tính chính xác tuyệt đối${exactInfo}.`;
  } else if (estimateOk && !exactOk) {
    feedbackMessage = `Rất tốt! Em đã ước lượng hợp lý${roundedInfo}. Tuy nhiên bước tính chính xác cần cẩn thận hơn một chút nhé.`;
  } else if (!estimateOk && exactOk) {
    feedbackMessage = `Em đã tính đúng kết quả chính xác${exactInfo}! Tuy nhiên ở bước ước lượng nhẩm, em hãy chú ý quy tắc làm tròn về hàng chục gần nhất nhé.`;
  } else {
    feedbackMessage = `Cả ước lượng và kết quả tính đều chưa đúng. ${expected.explanation || 'Hãy đọc kỹ lại gợi ý và thử lại nhé!'}`;
  }

  return {
    isCorrect,
    estimateOk,
    exactOk,
    feedbackMessage,
    studentAnswer: { estimate: student.estimate, exact: student.exact },
    expectedAnswer: { estimate: expected.estimate, exact: expected.exact }
  };
}

module.exports = {
  roundToNearestTen,
  parseStudentAnswer,
  parseExpectedAnswer,
  evaluateEstimateAnswer
};
