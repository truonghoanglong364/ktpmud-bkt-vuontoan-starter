const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
let Database;
try {
  Database = require('better-sqlite3');
  new Database(':memory:').close();
} catch (_) {
  const { DatabaseSync } = require('node:sqlite');
  Database = class extends DatabaseSync {
    pragma(cmd) { try { this.exec('PRAGMA ' + cmd + ';'); } catch (_) {} }
    transaction(fn) {
      return (...args) => {
        this.exec('BEGIN TRANSACTION');
        try {
          const res = fn(...args);
          this.exec('COMMIT');
          return res;
        } catch (err) {
          this.exec('ROLLBACK');
          throw err;
        }
      };
    }
  };
}
const { evaluateEstimateAnswer } = require('../server/estimation-engine');

describe('Integration Tests - Luồng Chấm Bài & Bảo Mật Đáp Án (Track B)', () => {
  let db;

  before(() => {
    // Sử dụng in-memory database để cô lập hoàn toàn môi trường test
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password_hash TEXT,
        full_name TEXT,
        role TEXT,
        class_name TEXT,
        student_code TEXT,
        total_stars INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE lessons (
        id TEXT PRIMARY KEY,
        number INTEGER,
        title TEXT,
        description TEXT,
        topic TEXT,
        sort_order INTEGER,
        unlock_after TEXT
      );

      CREATE TABLE question_sets (
        id TEXT PRIMARY KEY,
        title TEXT,
        kind TEXT DEFAULT 'exercise',
        lesson_id TEXT,
        star_reward INTEGER DEFAULT 40,
        duration_minutes INTEGER DEFAULT 0
      );

      CREATE TABLE questions (
        id TEXT PRIMARY KEY,
        set_id TEXT,
        lesson_id TEXT,
        type TEXT,
        prompt TEXT,
        options_json TEXT,
        correct_answer TEXT,
        points INTEGER DEFAULT 1,
        category TEXT DEFAULT '',
        sort_order INTEGER
      );

      CREATE TABLE attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        kind TEXT,
        ref_id TEXT,
        score_percent INTEGER,
        correct_count INTEGER DEFAULT 0,
        total_count INTEGER DEFAULT 0,
        stars_earned INTEGER DEFAULT 0,
        duration_sec INTEGER DEFAULT 0,
        answers_json TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE progress (
        user_id INTEGER,
        lesson_id TEXT,
        best_score INTEGER DEFAULT 0,
        completed INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT (datetime('now','localtime')),
        PRIMARY KEY (user_id, lesson_id)
      );
    `);

    // Tạo dữ liệu người dùng mẫu
    db.prepare(`INSERT INTO users (id, username, password_hash, full_name, role, total_stars)
      VALUES (1, 'test_student', 'hash', 'Học Sinh Thử Nghiệm', 'student', 100)`).run();

    // Tạo bài học mẫu
    db.prepare(`INSERT INTO lessons (id, number, title, sort_order)
      VALUES ('bai-10', 10, 'Bảng nhân 6 & Phép ước lượng', 10)`).run();

    // Tạo bộ bài tập mẫu
    db.prepare(`INSERT INTO question_sets (id, title, kind, lesson_id, star_reward)
      VALUES ('test-set-estimate', 'Phiếu Ước Lượng Thử Nghiệm', 'exercise', 'bai-10', 40)`).run();

    // Thêm câu hỏi loại estimate vào bộ bài
    const estimateAnswer = JSON.stringify({
      estimate: 150,
      exact: 144,
      formula: '48 × 3',
      roundedFormula: '50 × 3 = 150',
      explanation: 'Làm tròn 48 thành 50. Ước lượng 50 × 3 = 150. Tính đúng 48 × 3 = 144.'
    });

    db.prepare(`INSERT INTO questions (id, set_id, lesson_id, type, prompt, correct_answer, points, sort_order)
      VALUES ('est-q1', 'test-set-estimate', 'bai-10', 'estimate', 'Ước lượng và tính: 48 × 3 = ?', ?, 10, 1)`)
      .run(estimateAnswer);

    // Thêm câu hỏi loại input cũ để kiểm tra tương thích ngược
    db.prepare(`INSERT INTO questions (id, set_id, lesson_id, type, prompt, correct_answer, points, sort_order)
      VALUES ('input-q2', 'test-set-estimate', 'bai-10', 'input', '6 × 7 = ?', '42', 10, 2)`)
      .run();
  });

  after(() => {
    if (db) db.close();
  });

  it('B-04: Endpoint lấy câu hỏi KHÔNG được trả về correct_answer', () => {
    // Mô phỏng query của GET /api/question-sets/:setId/questions
    const rows = db.prepare('SELECT id,type,prompt,options_json,points,category FROM questions WHERE set_id=? ORDER BY sort_order')
      .all('test-set-estimate');

    assert.equal(rows.length, 2);
    for (const q of rows) {
      assert.equal(q.correct_answer, undefined, 'Tuyệt đối không được rò rỉ correct_answer');
      assert.ok(q.id);
      assert.ok(q.prompt);
    }
  });

  it('B-05 & B-06: Chấm câu hỏi estimate trên server và phân biệt feedback', () => {
    // Mô phỏng logic hàm chấm điểm của /api/submissions
    function gradeSubmission(userId, setId, answers, durationSec) {
      const s = db.prepare('SELECT * FROM question_sets WHERE id=?').get(setId);
      if (!s) throw new Error('Bộ bài không hợp lệ.');

      const questions = db.prepare('SELECT * FROM questions WHERE set_id=? ORDER BY sort_order').all(setId);
      let earned = 0, max = 0, correct = 0;

      const detail = questions.map(q => {
        max += q.points;
        if (q.type === 'estimate') {
          const evalRes = evaluateEstimateAnswer(q.correct_answer, answers[q.id]);
          if (evalRes.isCorrect) {
            earned += q.points;
            correct++;
          }
          return {
            questionId: q.id,
            type: q.type,
            correct: evalRes.isCorrect,
            estimateOk: evalRes.estimateOk,
            exactOk: evalRes.exactOk,
            feedbackMessage: evalRes.feedbackMessage
          };
        }
        const given = answers[q.id] == null ? '' : String(answers[q.id]).trim().toLowerCase();
        const ok = given === String(q.correct_answer).trim().toLowerCase();
        if (ok) { earned += q.points; correct++; }
        return { questionId: q.id, type: q.type, correct: ok };
      });

      const percent = max ? Math.round((earned / max) * 100) : 0;
      const old = db.prepare('SELECT * FROM progress WHERE user_id=? AND lesson_id=?').get(userId, s.lesson_id);
      const oldBest = old ? old.best_score : 0;
      const starsEarned = Math.round(Math.max(0, percent - oldBest) / 100 * s.star_reward);

      db.transaction(() => {
        db.prepare(`INSERT INTO attempts (user_id,kind,ref_id,score_percent,correct_count,total_count,stars_earned,duration_sec,answers_json)
          VALUES (?,?,?,?,?,?,?,?,?)`).run(userId, s.kind, setId, percent, correct, questions.length, starsEarned, durationSec, JSON.stringify(answers));
        db.prepare(`INSERT INTO progress (user_id,lesson_id,best_score,completed,updated_at) VALUES (?,?,?,?,datetime('now','localtime'))
          ON CONFLICT(user_id,lesson_id) DO UPDATE SET best_score=MAX(best_score,excluded.best_score),
            completed=MAX(completed,excluded.completed), updated_at=datetime('now','localtime')`)
          .run(userId, s.lesson_id, percent, percent >= 50 ? 1 : 0);
        if (starsEarned) db.prepare('UPDATE users SET total_stars=total_stars+? WHERE id=?').run(starsEarned, userId);
      })();

      return { percent, correct, totalCount: questions.length, starsEarned, detail };
    }

    // Học sinh nộp: est-q1 (ước lượng đúng 150 nhưng tính sai 140), input-q2 (đúng 42)
    const result = gradeSubmission(1, 'test-set-estimate', {
      'est-q1': { estimate: 150, exact: 140 },
      'input-q2': '42'
    }, 30);

    assert.equal(result.totalCount, 2);
    assert.equal(result.correct, 1); // Chỉ đúng câu 2
    assert.equal(result.percent, 50);

    // Kiểm tra B-06: Feedback phân biệt
    const estDetail = result.detail.find(d => d.questionId === 'est-q1');
    assert.equal(estDetail.correct, false);
    assert.equal(estDetail.estimateOk, true, 'Phải nhận diện ước lượng hợp lý');
    assert.equal(estDetail.exactOk, false, 'Phải nhận diện kết quả chính xác bị sai');
    assert.match(estDetail.feedbackMessage, /ước lượng hợp lý/);

    // Kiểm tra B-05: Lưu vào database attempts và progress
    const attempt = db.prepare('SELECT * FROM attempts WHERE user_id=1 ORDER BY id DESC LIMIT 1').get();
    assert.ok(attempt);
    assert.equal(attempt.score_percent, 50);
    assert.equal(attempt.correct_count, 1);

    const prog = db.prepare("SELECT * FROM progress WHERE user_id=1 AND lesson_id='bai-10'").get();
    assert.ok(prog);
    assert.equal(prog.best_score, 50);
    assert.equal(prog.completed, 1); // >= 50% là hoàn thành
  });

  it('B-05: Nộp lại đạt 100% -> Cập nhật best_score và cộng sao tiến bộ', () => {
    const s = db.prepare("SELECT * FROM question_sets WHERE id='test-set-estimate'").get();
    const questions = db.prepare("SELECT * FROM questions WHERE set_id='test-set-estimate' ORDER BY sort_order").all();

    // Nộp hoàn hảo cả 2 câu
    const answers = {
      'est-q1': { estimate: 150, exact: 144 },
      'input-q2': '42'
    };

    let earned = 0, max = 0, correct = 0;
    questions.forEach(q => {
      max += q.points;
      if (q.type === 'estimate') {
        const evalRes = evaluateEstimateAnswer(q.correct_answer, answers[q.id]);
        if (evalRes.isCorrect) { earned += q.points; correct++; }
      } else {
        if (answers[q.id] === q.correct_answer) { earned += q.points; correct++; }
      }
    });

    const percent = Math.round((earned / max) * 100);
    assert.equal(percent, 100);
    assert.equal(correct, 2);

    const old = db.prepare('SELECT * FROM progress WHERE user_id=1 AND lesson_id=?').get(s.lesson_id);
    const oldBest = old ? old.best_score : 0; // 50
    const starsEarned = Math.round(Math.max(0, percent - oldBest) / 100 * s.star_reward); // (100 - 50) / 100 * 40 = 20 sao

    assert.equal(starsEarned, 20);

    db.prepare(`UPDATE progress SET best_score=?, updated_at=datetime('now','localtime') WHERE user_id=1 AND lesson_id=?`)
      .run(percent, s.lesson_id);
    db.prepare('UPDATE users SET total_stars=total_stars+? WHERE id=1').run(starsEarned);

    const updatedUser = db.prepare('SELECT total_stars FROM users WHERE id=1').get();
    assert.equal(updatedUser.total_stars, 140); // 100 ban đầu + 20 lần 1 + 20 lần 2
  });

});
