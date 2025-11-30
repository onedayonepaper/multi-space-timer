// 업종별 템플릿

export const TEMPLATES = {
  custom: {
    name: '커스텀',
    description: '직접 설정',
    config: {
      spaceCount: 16,
      gridColumns: 4,
      presets: [1, 2, 3],
      labels: {
        spaceName: '공간',
        unit: '번',
        serviceName: '멀티 공간 타이머'
      }
    }
  },

  studycafe: {
    name: '스터디카페',
    description: '열람석, 스터디룸 관리',
    icon: '📚',
    config: {
      spaceCount: 16,
      gridColumns: 4,
      presets: [1, 3, 5],
      labels: {
        spaceName: '좌석',
        unit: '번',
        serviceName: '스터디카페 타이머'
      },
      theme: {
        name: 'studycafe',
        primaryColor: '#3b82f6',
        dangerColor: '#ef4444'
      }
    }
  },

  laundromat: {
    name: '코인세탁방',
    description: '세탁기, 건조기 관리',
    icon: '🧺',
    config: {
      spaceCount: 12,
      gridColumns: 4,
      presets: [0.5, 0.67, 1], // 30분, 40분, 60분
      labels: {
        spaceName: '세탁기',
        unit: '번',
        serviceName: '세탁소 타이머'
      },
      theme: {
        name: 'laundromat',
        primaryColor: '#06b6d4',
        dangerColor: '#ef4444'
      },
      features: {
        warningMinutes: 5,
        autoReset: false,
        showStats: true
      }
    }
  },

  coworking: {
    name: '공유오피스',
    description: '회의실, 폰부스 관리',
    icon: '🏢',
    config: {
      spaceCount: 8,
      gridColumns: 4,
      presets: [0.5, 1, 2],
      labels: {
        spaceName: '회의실',
        unit: '',
        serviceName: '오피스 타이머'
      },
      theme: {
        name: 'coworking',
        primaryColor: '#8b5cf6',
        dangerColor: '#ef4444'
      },
      features: {
        warningMinutes: 5,
        autoReset: false,
        showStats: true
      }
    }
  },

  sleepCafe: {
    name: '수면카페',
    description: '수면 부스, 안마 의자',
    icon: '😴',
    config: {
      spaceCount: 12,
      gridColumns: 4,
      presets: [0.5, 1, 2],
      labels: {
        spaceName: '부스',
        unit: '번',
        serviceName: '수면카페 타이머'
      },
      theme: {
        name: 'sleepcafe',
        primaryColor: '#6366f1',
        dangerColor: '#ef4444'
      }
    }
  },

  pcBang: {
    name: 'PC방',
    description: '프리미엄석 관리',
    icon: '🎮',
    config: {
      spaceCount: 20,
      gridColumns: 5,
      presets: [1, 2, 4],
      labels: {
        spaceName: '프리미엄석',
        unit: '번',
        serviceName: 'PC방 타이머'
      },
      theme: {
        name: 'pcbang',
        primaryColor: '#f59e0b',
        dangerColor: '#ef4444'
      }
    }
  },

  karaoke: {
    name: '노래방',
    description: '룸 시간 관리',
    icon: '🎤',
    config: {
      spaceCount: 10,
      gridColumns: 5,
      presets: [0.5, 1, 2],
      labels: {
        spaceName: '룸',
        unit: '번',
        serviceName: '노래방 타이머'
      },
      theme: {
        name: 'karaoke',
        primaryColor: '#ec4899',
        dangerColor: '#ef4444'
      }
    }
  }
};

export class TemplateManager {
  constructor(configManager) {
    this.configManager = configManager;
  }

  // 템플릿 목록 가져오기
  getTemplates() {
    return Object.entries(TEMPLATES).map(([key, template]) => ({
      key,
      ...template
    }));
  }

  // 템플릿 적용
  applyTemplate(templateKey) {
    const template = TEMPLATES[templateKey];
    if (!template) {
      console.error('Template not found:', templateKey);
      return false;
    }

    // 현재 PIN은 유지
    const currentPin = this.configManager.get('admin.pin');

    // 템플릿 설정 적용
    this.configManager.update(template.config);

    // PIN 복원
    this.configManager.set('admin.pin', currentPin);

    return true;
  }

  // 현재 템플릿 감지
  getCurrentTemplate() {
    const currentLabels = this.configManager.get('labels');

    for (const [key, template] of Object.entries(TEMPLATES)) {
      if (template.config.labels.spaceName === currentLabels.spaceName) {
        return key;
      }
    }

    return 'custom';
  }

  // 프리셋 시간을 분 단위로 변환
  getPresetMinutes(hours) {
    return Math.round(hours * 60);
  }

  // 프리셋 표시 텍스트
  getPresetLabel(hours) {
    const minutes = this.getPresetMinutes(hours);

    if (minutes < 60) {
      return `${minutes}분`;
    }

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    if (m === 0) {
      return `${h}시간`;
    }

    return `${h}시간 ${m}분`;
  }
}
