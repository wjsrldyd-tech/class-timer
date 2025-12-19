// 타이머 상태
let totalSeconds = 0;
let remainingSeconds = 0;
let isRunning = false;
let intervalId = null;

// DOM 요소
const timeDisplay = document.getElementById('timeDisplay');
const minValue = document.getElementById('minValue');
const secValue = document.getElementById('secValue');
const minDec = document.getElementById('minDec');
const minInc = document.getElementById('minInc');
const secDec = document.getElementById('secDec');
const secInc = document.getElementById('secInc');
const resetBtn = document.getElementById('resetBtn');
const startPauseBtn = document.getElementById('startPauseBtn');

// 시간 포맷 (MM:SS)
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// 화면 업데이트
function updateDisplay() {
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  
  minValue.textContent = mins;
  secValue.textContent = secs;
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

// 분 증감
function adjustMinutes(delta) {
  if (isRunning) return;
  
  const currentMins = parseInt(minValue.textContent) || 0;
  const newMins = Math.max(0, Math.min(99, currentMins + delta));
  const currentSecs = parseInt(secValue.textContent) || 0;
  
  totalSeconds = newMins * 60 + currentSecs;
  remainingSeconds = totalSeconds;
  updateDisplay();
}

// 초 증감
function adjustSeconds(delta) {
  if (isRunning) return;
  
  const currentMins = parseInt(minValue.textContent) || 0;
  const currentSecs = parseInt(secValue.textContent) || 0;
  const newSecs = Math.max(0, Math.min(59, currentSecs + delta));
  
  totalSeconds = currentMins * 60 + newSecs;
  remainingSeconds = totalSeconds;
  updateDisplay();
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
    enableControls(true);
  } else {
    // 시작
    if (remainingSeconds === 0) {
      remainingSeconds = totalSeconds;
    }
    isRunning = true;
    startPauseBtn.textContent = '정지';
    startPauseBtn.classList.add('running');
    enableControls(false);
    
    intervalId = setInterval(() => {
      remainingSeconds--;
      updateDisplay();
      
      if (remainingSeconds <= 0) {
        clearInterval(intervalId);
        isRunning = false;
        startPauseBtn.textContent = '시작';
        startPauseBtn.classList.remove('running');
        enableControls(true);
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
  enableControls(true);
  updateDisplay();
}

// 컨트롤 활성화/비활성화
function enableControls(enabled) {
  minDec.disabled = !enabled;
  minInc.disabled = !enabled;
  secDec.disabled = !enabled;
  secInc.disabled = !enabled;
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
minDec.addEventListener('click', () => adjustMinutes(-1));
minInc.addEventListener('click', () => adjustMinutes(1));
secDec.addEventListener('click', () => adjustSeconds(-1));
secInc.addEventListener('click', () => adjustSeconds(1));
resetBtn.addEventListener('click', resetTimer);
startPauseBtn.addEventListener('click', toggleTimer);

// 초기화
updateDisplay();
