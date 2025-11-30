// localStorage 추상화 모듈

const STORAGE_KEYS = {
  SPACES: 'mst-spaces',
  CONFIG: 'mst-config',
  STATS: 'mst-stats'
};

export class StorageManager {
  // 공간 상태 로드
  loadSpaces(count) {
    const saved = localStorage.getItem(STORAGE_KEYS.SPACES);

    if (saved) {
      try {
        const spaces = JSON.parse(saved);
        // 공간 개수가 변경된 경우 조정
        if (spaces.length !== count) {
          return this.initializeSpaces(count);
        }
        return spaces;
      } catch (e) {
        console.error('Failed to load spaces:', e);
        return this.initializeSpaces(count);
      }
    }

    return this.initializeSpaces(count);
  }

  // 공간 상태 초기화
  initializeSpaces(count) {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: null,  // 커스텀 이름 (없으면 자동)
      status: 'idle',
      endTime: null,
      startTime: null
    }));
  }

  // 공간 상태 저장
  saveSpaces(spaces) {
    localStorage.setItem(STORAGE_KEYS.SPACES, JSON.stringify(spaces));
  }

  // 통계 로드
  loadStats() {
    const saved = localStorage.getItem(STORAGE_KEYS.STATS);

    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load stats:', e);
        return this.initializeStats();
      }
    }

    return this.initializeStats();
  }

  // 통계 초기화
  initializeStats() {
    return {
      dailyUsage: {},  // { 'YYYY-MM-DD': { spaceId: count } }
      totalUsage: {},  // { spaceId: count }
      lastReset: new Date().toISOString()
    };
  }

  // 통계 저장
  saveStats(stats) {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  }

  // 사용 기록 추가
  recordUsage(spaceId) {
    const stats = this.loadStats();
    const today = new Date().toISOString().split('T')[0];

    // 일일 사용량
    if (!stats.dailyUsage[today]) {
      stats.dailyUsage[today] = {};
    }
    stats.dailyUsage[today][spaceId] = (stats.dailyUsage[today][spaceId] || 0) + 1;

    // 전체 사용량
    stats.totalUsage[spaceId] = (stats.totalUsage[spaceId] || 0) + 1;

    this.saveStats(stats);
  }

  // 오늘 통계 가져오기
  getTodayStats() {
    const stats = this.loadStats();
    const today = new Date().toISOString().split('T')[0];
    return stats.dailyUsage[today] || {};
  }

  // 인기 공간 TOP N
  getTopSpaces(n = 3) {
    const todayStats = this.getTodayStats();
    return Object.entries(todayStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([spaceId, count]) => ({ spaceId: parseInt(spaceId), count }));
  }

  // 전체 데이터 삭제
  clearAll() {
    localStorage.removeItem(STORAGE_KEYS.SPACES);
    localStorage.removeItem(STORAGE_KEYS.STATS);
  }

  // 백업 생성
  createBackup() {
    return {
      spaces: localStorage.getItem(STORAGE_KEYS.SPACES),
      config: localStorage.getItem(STORAGE_KEYS.CONFIG),
      stats: localStorage.getItem(STORAGE_KEYS.STATS),
      timestamp: new Date().toISOString()
    };
  }

  // 백업 복원
  restoreBackup(backup) {
    try {
      if (backup.spaces) {
        localStorage.setItem(STORAGE_KEYS.SPACES, backup.spaces);
      }
      if (backup.config) {
        localStorage.setItem(STORAGE_KEYS.CONFIG, backup.config);
      }
      if (backup.stats) {
        localStorage.setItem(STORAGE_KEYS.STATS, backup.stats);
      }
      return true;
    } catch (e) {
      console.error('Failed to restore backup:', e);
      return false;
    }
  }
}
