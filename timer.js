// 타이머 상태
let totalSeconds = 0;
let remainingSeconds = 0;
let isRunning = false;
let intervalId = null;

// DOM 요소
const timeDisplay = document.getElementById('timeDisplay');
const minValue = document.getElementById('minValue');
const minDec = document.getElementById('minDec');
const minInc = document.getElementById('minInc');
const resetBtn = document.getElementById('resetBtn');
const startPauseBtn = document.getElementById('startPauseBtn');
const settingsBtn = document.getElementById('settingsBtn');
const modalOverlay = document.getElementById('modalOverlay');
const closeModal = document.getElementById('closeModal');
const applySettings = document.getElementById('applySettings');

// 시간 포맷 (MM:SS)
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// 화면 업데이트
function updateDisplay() {
  const mins = Math.floor(remainingSeconds / 60);
  
  // 모달이 열려있을 때만 모달의 minValue 업데이트
  if (modalOverlay.classList.contains('show')) {
    minValue.textContent = mins;
  }
  
  timeDisplay.textContent = formatTime(remainingSeconds);
  
  // 10초 이하일 때 경고 색상
  if (remainingSeconds <= 10 && remainingSeconds > 0) {
    timeDisplay.classList.add('critical');
    timeDisplay.classList.remove('warning');
  } else if (remainingSeconds <= 30 && remainingSeconds > 10) {
    timeDisplay.classList.add('warning');
    timeDisplay.classList.remove('critical');
  } else {
    timeDisplay.classList.remove('warning', 'critical');
  }
}

// 분 증감 (모달 내에서 사용)
function adjustMinutes(delta) {
  const currentMins = parseInt(minValue.textContent) || 0;
  const newMins = Math.max(0, Math.min(99, currentMins + delta));
  minValue.textContent = newMins;
}

// 모달 열기
function openModal() {
  if (isRunning) return; // 실행 중에는 모달을 열 수 없음
  
  // 현재 설정된 분 값을 모달에 표시
  const currentMins = Math.floor(totalSeconds / 60);
  minValue.textContent = currentMins;
  
  modalOverlay.classList.add('show');
}

// 모달 닫기
function closeModalWindow() {
  modalOverlay.classList.remove('show');
}

// 설정 적용
function applyTimerSettings() {
  const mins = parseInt(minValue.textContent) || 0;
  totalSeconds = mins * 60;
  remainingSeconds = totalSeconds;
  updateDisplay();
  closeModalWindow();
}

// 타이머 시작/일시정지
function toggleTimer() {
  if (totalSeconds === 0) return;
  
  if (isRunning) {
    // 일시정지
    clearInterval(intervalId);
    isRunning = false;
    startPauseBtn.textContent = '시작';
    startPauseBtn.classList.remove('running');
  } else {
    // 시작
    if (remainingSeconds === 0) {
      remainingSeconds = totalSeconds;
    }
    isRunning = true;
    startPauseBtn.textContent = '정지';
    startPauseBtn.classList.add('running');
    
    intervalId = setInterval(() => {
      remainingSeconds--;
      updateDisplay();
      
      if (remainingSeconds <= 0) {
        clearInterval(intervalId);
        isRunning = false;
        startPauseBtn.textContent = '시작';
        startPauseBtn.classList.remove('running');
        showNotification();
      }
    }, 1000);
  }
}

// 리셋
function resetTimer() {
  clearInterval(intervalId);
  isRunning = false;
  remainingSeconds = totalSeconds;
  startPauseBtn.textContent = '시작';
  startPauseBtn.classList.remove('running');
  updateDisplay();
}

// 컨트롤 활성화/비활성화 (더 이상 사용하지 않음)
function enableControls(enabled) {
  // 모달 방식으로 변경되어 필요 없음
}

// 알림 표시
async function showNotification() {
  // 시스템 알림
  if (window.electronAPI) {
    await window.electronAPI.showNotification('타이머 종료', '설정된 시간이 모두 지났습니다!');
  } else {
    // 브라우저 환경에서는 alert
    alert('⏰ 시간이 모두 지났습니다!');
  }
  
  // 소리 재생
  playBeepSound();
}

// 비프 소리 재생 (Web Audio API 사용)
function playBeepSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800; // 주파수
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
  
  // 0.6초 후 한 번 더
  setTimeout(() => {
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.value = 800;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    osc2.start(audioContext.currentTime);
    osc2.stop(audioContext.currentTime + 0.5);
  }, 600);
}

// 이벤트 리스너
settingsBtn.addEventListener('click', openModal);
closeModal.addEventListener('click', closeModalWindow);
applySettings.addEventListener('click', applyTimerSettings);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    closeModalWindow();
  }
});
minDec.addEventListener('click', () => adjustMinutes(-1));
minInc.addEventListener('click', () => adjustMinutes(1));
resetBtn.addEventListener('click', resetTimer);
startPauseBtn.addEventListener('click', toggleTimer);

// 초기화
updateDisplay();
