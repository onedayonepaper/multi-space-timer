// 시간 관련 유틸리티

// 남은 시간 계산
export function getRemainingTime(endTime) {
  const now = Date.now();
  const remaining = endTime - now;
  return Math.max(0, remaining);
}

// 남은 시간 텍스트 생성
export function formatRemainingTime(endTime) {
  const remaining = getRemainingTime(endTime);

  if (remaining <= 0) {
    return '만료됨';
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // 1시간 미만: MM:SS
  if (hours === 0) {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  // 1시간 이상: H:MM 남음
  return `${hours}:${String(minutes).padStart(2, '0')} 남음`;
}

// 현재 시각 포맷
export function formatCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// 종료 시각 계산
export function calculateEndTime(hours) {
  return Date.now() + (hours * 60 * 60 * 1000);
}

// 경고 시간 확인 (5분 전 등)
export function isWarningTime(endTime, warningMinutes = 5) {
  const remaining = getRemainingTime(endTime);
  const warningMs = warningMinutes * 60 * 1000;
  return remaining > 0 && remaining <= warningMs;
}

// 만료 여부 확인
export function isExpired(endTime) {
  return getRemainingTime(endTime) === 0;
}

// 사용 시간 계산 (통계용)
export function calculateDuration(startTime, endTime) {
  const duration = endTime - startTime;
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  return { hours, minutes, totalMinutes: Math.floor(duration / (1000 * 60)) };
}

// 오늘 날짜 문자열
export function getTodayString() {
  return new Date().toISOString().split('T')[0];
}
