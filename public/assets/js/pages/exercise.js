/* Logic trang Luyện Tập — tương tác giữ nguyên bản gốc; phần "Kiểm Tra Đáp Án"
 * được nối API: đáp án gửi lên server chấm (server không gửi đáp án xuống),
 * điểm + sao + tiến độ được lưu vào DB nên tải lại trang không mất. */
let activeInputId = 'math-input-3';

  let currentActiveExercise = 1;

  function scrollToExercise(num) {
    currentActiveExercise = Math.max(1, Math.min(4, num));
    const target = document.getElementById('sec-exercise-' + currentActiveExercise);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('ring-4', 'ring-primary/30');
      setTimeout(() => target.classList.remove('ring-4', 'ring-primary/30'), 1500);
    }
    updateLiveProgress();
  }

  function navigateExercise(delta) {
    scrollToExercise(currentActiveExercise + delta);
  }

  function updateLiveProgress() {
    // 1. Kiểm tra Bài 1 (3 ô so sánh khác '?')
    const ex1Done = ['slot-1-1', 'slot-1-2', 'slot-1-3'].every(id => {
      const el = document.getElementById(id);
      return el && el.textContent.trim() !== '?' && el.textContent.trim() !== '';
    });

    // 2. Kiểm tra Bài 2 (3 ô input đã điền số)
    const ex2Done = ['math-input-1', 'math-input-2', 'math-input-3'].every(id => {
      const el = document.getElementById(id);
      return el && el.value.trim() !== '';
    });

    // 3. Kiểm tra Bài 3 (4 thẻ tô màu đều đã có trạng thái Đã tô)
    const paintBtns = document.querySelectorAll('button[onclick*="paintCard"]');
    const ex3Done = paintBtns.length > 0 && Array.from(paintBtns).every(btn => {
      return btn.textContent.includes('Đã tô');
    });

    // 4. Kiểm tra Bài 4 (Cả ô ước lượng và ô tính đúng đều có số)
    const estVal = (document.getElementById('math-est-1')?.value || '').trim();
    const exactVal = (document.getElementById('math-exact-1')?.value || '').trim();
    const ex4Done = estVal !== '' && exactVal !== '';

    const statuses = [ex1Done, ex2Done, ex3Done, ex4Done];
    let completedCount = 0;

    statuses.forEach((done, idx) => {
      const num = idx + 1;
      const bubble = document.getElementById('bubble-ex-' + num);
      if (!bubble) return;

      if (done) {
        completedCount++;
        bubble.className = "w-9 h-9 rounded-full bg-primary text-on-primary font-headline-sm text-label-md flex items-center justify-center shadow-[0_3px_0_0_#004419] transition-all hover:scale-110 active:scale-95 cursor-pointer";
        bubble.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span>';
      } else {
        const isActive = (num === currentActiveExercise);
        bubble.className = isActive 
          ? "w-10 h-10 rounded-full bg-tertiary-fixed-dim text-on-tertiary font-headline-sm text-label-lg flex items-center justify-center shadow-[0_4px_0_0_#c48c00] scale-110 cursor-pointer"
          : "w-9 h-9 rounded-full bg-surface-container text-on-surface-variant font-headline-sm text-label-md flex items-center justify-center shadow-[0_2px_0_0_#bfcabb] transition-all hover:scale-110 active:scale-95 cursor-pointer";
        bubble.textContent = num;
      }
    });

    const summaryEl = document.getElementById('progress-summary-text');
    if (summaryEl) {
      summaryEl.textContent = `Bài ${completedCount} / 4`;
    }
  }

  let currentBrush = 'green';
  let hintCount = 2;

  function setActiveInput(id) {
    activeInputId = id;
    ['math-input-1', 'math-input-2', 'math-input-3', 'math-est-1', 'math-exact-1'].forEach(name => {
      const el = document.getElementById(name);
      if (el) {
        if (name === id) {
          el.classList.add('ring-2', 'ring-tertiary-fixed-dim');
        } else {
          el.classList.remove('ring-2', 'ring-tertiary-fixed-dim');
        }
      }
    });
  }

  function pressKey(val) {
    if (!activeInputId) return;
    const target = document.getElementById(activeInputId);
    if (!target) return;

    if (val === 'OK') {
      if (activeInputId === 'math-input-1') setActiveInput('math-input-2');
      else if (activeInputId === 'math-input-2') setActiveInput('math-input-3');
      else if (activeInputId === 'math-input-3') setActiveInput('math-est-1');
      else if (activeInputId === 'math-est-1') setActiveInput('math-exact-1');
      return;
    }

    if (target.value === '?' || target.value === '') {
      target.value = val;
    } else if (target.value.length < 5) {
      target.value += val;
    }
    updateLiveProgress();
  }

  function clearKey() {
    if (!activeInputId) return;
    const target = document.getElementById(activeInputId);
    if (target && target.value) {
      target.value = target.value.slice(0, -1);
    }
    updateLiveProgress();
  }

  function setCompare(slotId, sign, btn) {
    const el = document.getElementById(slotId);
    if (el) {
      el.textContent = sign;
      el.classList.add('bg-secondary-container', 'text-on-secondary-container', 'font-bold');
      el.classList.remove('text-primary');
    }
    updateLiveProgress();
    if (btn && btn.parentElement) {
      btn.parentElement.querySelectorAll('button').forEach(b => {
        b.className = "w-12 h-12 rounded-2xl bg-surface-container-lowest hover:bg-surface-container text-on-surface font-headline-lg shadow-[0_4px_0_0_#bfcabb] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center";
      });
      btn.className = "w-12 h-12 rounded-2xl bg-secondary-container text-on-secondary-container font-headline-lg shadow-[0_4px_0_0_#00722f] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center font-bold";
    }
  }

  function selectBrush(color) {
    currentBrush = color;
    const btnGreen = document.getElementById('brush-green');
    const btnYellow = document.getElementById('brush-yellow');

    if (color === 'green') {
      btnGreen.classList.add('ring-2', 'ring-primary');
      btnYellow.classList.remove('ring-2', 'ring-primary');
    } else {
      btnYellow.classList.add('ring-2', 'ring-primary');
      btnGreen.classList.remove('ring-2', 'ring-primary');
    }
  }

  function paintCard(btn) {
    const statusLabel = btn.querySelector('span:nth-child(2)');
    if (currentBrush === 'green') {
      btn.className = "h-24 rounded-2xl bg-secondary-fixed-dim text-on-secondary-fixed p-3 flex flex-col items-center justify-center shadow-[0_4px_0_0_#006e2c] transition-transform active:scale-95 group";
      if (statusLabel) {
        statusLabel.textContent = "Đã tô Xanh lá (=12)";
        statusLabel.className = "text-[12px] font-label-sm text-secondary font-bold mt-1";
      }
    } else {
      btn.className = "h-24 rounded-2xl bg-tertiary-fixed text-on-tertiary-fixed p-3 flex flex-col items-center justify-center shadow-[0_4px_0_0_#e6a400] transition-transform active:scale-95 group";
      if (statusLabel) {
        statusLabel.textContent = "Đã tô Vàng (=18)";
        statusLabel.className = "text-[12px] font-label-sm text-tertiary font-bold mt-1";
      }
    }
    updateLiveProgress();
  }

  function useHint() {
    if (hintCount > 0) {
      hintCount--;
      const btn = document.getElementById('btn-hint');
      if (btn) {
        btn.innerHTML = `<span class="material-symbols-outlined text-[20px]">help_center</span><span>Xem gợi ý chi tiết (Còn ${hintCount} lần)</span>`;
      }
      alert("Ong Vàng mách nước: 36 : 6 nghĩa là mấy nhân với 6 bằng 36 nhỉ? Đúng rồi, 6 × 6 = 36!");
    } else {
      alert("Em đã dùng hết quyền trợ giúp trong lượt này. Hãy thử tự suy luận nhé!");
    }
  }

  function resetWorksheet() {
    ['slot-1-1', 'slot-1-2', 'slot-1-3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = '?';
        el.className = "w-12 h-12 rounded-2xl bg-surface-container-lowest text-primary flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] font-headline-lg";
      }
    });

    document.querySelectorAll('button[onclick*="setCompare"]').forEach(b => {
      b.className = "w-12 h-12 rounded-2xl bg-surface-container-lowest hover:bg-surface-container text-on-surface font-headline-lg shadow-[0_4px_0_0_#bfcabb] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center";
    });

    ['math-input-1', 'math-input-2', 'math-input-3', 'math-est-1', 'math-exact-1'].forEach(id => {
      const inp = document.getElementById(id);
      if (inp) inp.value = '';
    });

    document.querySelectorAll('button[onclick*="paintCard"]').forEach(btn => {
      btn.className = "h-24 rounded-2xl bg-surface-container-low text-on-surface p-3 flex flex-col items-center justify-center shadow-[0_4px_0_0_#bfcabb] transition-transform active:scale-95 group hover:bg-surface-container";
      const statusLabel = btn.querySelector('span:nth-child(2)');
      if (statusLabel) {
        statusLabel.textContent = "Chưa tô màu";
        statusLabel.className = "text-[12px] font-label-sm text-on-surface-variant font-medium mt-1";
      }
    });

    const estBox = document.getElementById('estimate-feedback-box');
    if (estBox) estBox.classList.add('hidden');
    const actRow = document.getElementById('modal-action-row');
    if (actRow) actRow.classList.add('hidden');

    alert("Đã làm mới lại phiếu bài tập. Chúc bé luyện tập vui vẻ!");
    updateLiveProgress();
  }

  /** Thu thập đáp án trên phiếu theo đúng id câu hỏi trong DB (data/seed.json). */
  function collectAnswers() {
    const answers = {};
    ['slot-1-1', 'slot-1-2', 'slot-1-3'].forEach((id, i) => {
      const el = document.getElementById(id);
      answers[`compare-${i + 1}`] = el && el.textContent.trim() !== '?' ? el.textContent.trim() : '';
    });
    ['math-input-1', 'math-input-2', 'math-input-3'].forEach((id, i) => {
      const el = document.getElementById(id);
      answers[`input-${i + 1}`] = el ? el.value.trim() : '';
    });
    document.querySelectorAll('button[onclick*="paintCard"]').forEach((btn, i) => {
      const label = btn.textContent;
      answers[`paint-${i + 1}`] = label.includes('Xanh') ? 'green' : label.includes('Vàng') ? 'yellow' : '';
    });

    const estInput = document.getElementById('math-est-1');
    const exactInput = document.getElementById('math-exact-1');
    if (estInput && exactInput) {
      answers['est-bai-9-10'] = {
        estimate: estInput.value.trim(),
        exact: exactInput.value.trim()
      };
    }
    return answers;
  }

  async function submitExam() {
    const modal = document.getElementById('feedback-modal');
    try {
      const result = await window.MathAPI.post('/api/submissions', {
        setId: 'phieu-bai-9-10', answers: collectAnswers(), durationSec: Math.max(0, seconds - 342),
      });
      if (modal) {
        const title = modal.querySelector('h4');
        const desc = modal.querySelector('p');
        if (title) title.textContent = result.scorePercent >= 80 ? 'Xuất sắc quá! 🎉' : result.scorePercent >= 50 ? 'Tốt lắm, cố thêm chút nữa nhé! 💪' : 'Mình cùng ôn lại rồi làm lại nhé! 🌱';
        if (desc) desc.innerHTML = `Em làm đúng <strong>${result.correctCount}/${result.totalCount}</strong> phần, đạt <strong>${result.scorePercent}%</strong>` +
          (result.starsEarned ? ` và nhận thêm <strong class="text-tertiary">+${result.starsEarned} Sao</strong> vàng!` : ' (điểm chưa cao hơn lần tốt nhất nên chưa cộng thêm sao).') +
          `<br/>Điểm đã được lưu vào hồ sơ học tập của em.`;

        const estBox = document.getElementById('estimate-feedback-box');
        const estContent = document.getElementById('estimate-feedback-content');
        if (estBox && estContent && Array.isArray(result.detail)) {
          const estDetail = result.detail.find(d => d.type === 'estimate');
          if (estDetail) {
            estBox.classList.remove('hidden');
            const estBadge = estDetail.estimateOk 
              ? '<span class="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-[11px]">✓ Ước lượng hợp lý</span>'
              : '<span class="px-2 py-0.5 rounded bg-error-container text-on-error-container font-bold text-[11px]">✗ Ước lượng chưa sát</span>';
            const exactBadge = estDetail.exactOk
              ? '<span class="px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-bold text-[11px]">✓ Tính chính xác</span>'
              : '<span class="px-2 py-0.5 rounded bg-error-container text-on-error-container font-bold text-[11px]">✗ Kết quả chưa đúng</span>';
            estContent.innerHTML = `<div class="flex items-center gap-2 mb-1">${estBadge} ${exactBadge}</div><p class="mt-1 text-on-surface-variant font-medium">${estDetail.feedbackMessage}</p>`;
          } else {
            estBox.classList.add('hidden');
          }
        }
        // Cập nhật icon theo điểm
        const iconContainer = document.getElementById('modal-icon-container');
        const iconSymbol = document.getElementById('modal-icon-symbol');
        if (iconContainer && iconSymbol) {
          if (result.scorePercent >= 80) {
            iconContainer.className = "w-14 h-14 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0";
            iconSymbol.textContent = "celebration";
          } else if (result.scorePercent >= 50) {
            iconContainer.className = "w-14 h-14 rounded-2xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0";
            iconSymbol.textContent = "thumb_up";
          } else {
            iconContainer.className = "w-14 h-14 rounded-2xl bg-error-container text-on-error-container flex items-center justify-center shrink-0";
            iconSymbol.textContent = "sync";
          }
        }

        // Hiện nút Qua màn khi đạt >= 50%
        const actionRow = document.getElementById('modal-action-row');
        if (actionRow) {
          if (result.scorePercent >= 50) {
            actionRow.classList.remove('hidden');
          } else {
            actionRow.classList.add('hidden');
          }
        }

        modal.classList.remove('hidden');
      }
    } catch (err) {
      alert(err.message === 'Bạn chưa đăng nhập.' ? 'Phiên đăng nhập đã hết, em đăng nhập lại nhé!' : `Chưa nộp được bài: ${err.message}`);
      if (err.message === 'Bạn chưa đăng nhập.') location.href = 'login.html';
    }
  }

  function closeModal() {
    const modal = document.getElementById('feedback-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  // Gentle timer counter
  let seconds = 342;
  setInterval(() => {
    seconds++;
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    const timerEl = document.getElementById('display-timer');
    if (timerEl) timerEl.textContent = `${m}:${s}`;
  }, 1000);

  document.addEventListener('DOMContentLoaded', updateLiveProgress);
  setTimeout(updateLiveProgress, 300);
