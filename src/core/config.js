// 설정 관리 모듈

export const DEFAULT_CONFIG = {
  version: '1.0.0',
  spaceCount: 16,
  gridColumns: 4,
  presets: [1, 2, 3], // hours
  labels: {
    spaceName: '공간',
    unit: '번',
    serviceName: '멀티 공간 타이머'
  },
  theme: {
    name: 'default',
    primaryColor: '#3b82f6',
    dangerColor: '#ef4444'
  },
  sound: {
    enabled: false,
    volume: 0.5,
    expireSound: true,
    warningSound: true
  },
  features: {
    warningMinutes: 5,  // 5분 전 경고
    autoReset: false,   // 만료 후 자동 초기화
    showStats: true     // 통계 표시
  },
  admin: {
    pin: '0000',        // 기본 PIN
    locked: false
  }
};

export class ConfigManager {
  constructor() {
    this.config = this.load();
  }

  // localStorage에서 설정 로드
  load() {
    const saved = localStorage.getItem('mst-config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 기본 설정과 병합 (새로운 필드 추가 대응)
        return { ...DEFAULT_CONFIG, ...parsed };
      } catch (e) {
        console.error('Failed to load config:', e);
        return { ...DEFAULT_CONFIG };
      }
    }
    return { ...DEFAULT_CONFIG };
  }

  // 설정 저장
  save() {
    localStorage.setItem('mst-config', JSON.stringify(this.config));
  }

  // 설정 값 가져오기
  get(key) {
    const keys = key.split('.');
    let value = this.config;
    for (const k of keys) {
      value = value?.[k];
    }
    return value;
  }

  // 설정 값 변경
  set(key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    let obj = this.config;

    for (const k of keys) {
      if (!(k in obj)) {
        obj[k] = {};
      }
      obj = obj[k];
    }

    obj[lastKey] = value;
    this.save();
  }

  // 전체 설정 업데이트
  update(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.save();
  }

  // 설정 초기화
  reset() {
    this.config = { ...DEFAULT_CONFIG };
    this.save();
  }

  // 설정 내보내기 (JSON)
  export() {
    return JSON.stringify(this.config, null, 2);
  }

  // 설정 불러오기 (JSON)
  import(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      this.config = { ...DEFAULT_CONFIG, ...imported };
      this.save();
      return true;
    } catch (e) {
      console.error('Failed to import config:', e);
      return false;
    }
  }

  // PIN 검증
  verifyPin(pin) {
    return this.config.admin.pin === pin;
  }

  // PIN 변경
  changePin(newPin) {
    this.config.admin.pin = newPin;
    this.save();
  }
}
