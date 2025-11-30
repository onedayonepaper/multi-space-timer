// 메인 애플리케이션

import { ConfigManager } from './core/config.js';
import { StorageManager } from './core/storage.js';
import { TemplateManager, TEMPLATES } from './templates/templates.js';
import { SoundManager } from './utils/sound.js';
import {
  formatRemainingTime,
  formatCurrentTime,
  calculateEndTime,
  isWarningTime,
  isExpired
} from './utils/time.js';

export class MultiSpaceTimer {
  constructor() {
    // 모듈 초기화
    this.configManager = new ConfigManager();
    this.storageManager = new StorageManager();
    this.templateManager = new TemplateManager(this.configManager);
    this.soundManager = new SoundManager();

    // 상태
    this.spaces = [];
    this.currentSpaceId = null;
    this.updateInterval = null;
    this.isAdminMode = false;

    // DOM 요소 캐싱
    this.elements = {};
  }

  // 초기화
  async init() {
    // 사운드 초기화
    const soundEnabled = this.configManager.get('sound.enabled');
    const soundVolume = this.configManager.get('sound.volume');
    this.soundManager.init(soundEnabled, soundVolume);

    // 공간 로드
    const spaceCount = this.configManager.get('spaceCount');
    this.spaces = this.storageManager.loadSpaces(spaceCount);

    // DOM 요소 캐싱
    this.cacheElements();

    // UI 렌더링
    this.renderUI();

    // 이벤트 리스너 등록
    this.setupEventListeners();

    // 타이머 시작
    this.startTimer();

    // 현재 시각 업데이트
    this.updateCurrentTime();
  }

  // DOM 요소 캐싱
  cacheElements() {
    this.elements = {
      spacesGrid: document.getElementById('spacesGrid'),
      currentTime: document.getElementById('currentTime'),
      serviceName: document.getElementById('serviceName'),
      modalOverlay: document.getElementById('modalOverlay'),
      modalTitle: document.getElementById('modalTitle'),
      timePresets: document.getElementById('timePresets'),
      resetBtn: document.getElementById('resetBtn'),
      closeBtn: document.getElementById('closeBtn'),
      adminBtn: document.getElementById('adminBtn'),
      adminPanel: document.getElementById('adminPanel'),
      adminPinInput: document.getElementById('adminPinInput')
    };
  }

  // UI 렌더링
  renderUI() {
    // 서비스명 업데이트
    const serviceName = this.configManager.get('labels.serviceName');
    if (this.elements.serviceName) {
      this.elements.serviceName.textContent = serviceName;
    }

    // 공간 그리드 렌더링
    this.renderSpaces();

    // 프리셋 버튼 렌더링
    this.renderPresets();
  }

  // 공간 그리드 렌더링
  renderSpaces() {
    const gridColumns = this.configManager.get('gridColumns');
    this.elements.spacesGrid.style.gridTemplateColumns = `repeat(${gridColumns}, 1fr)`;
    this.elements.spacesGrid.innerHTML = '';

    this.spaces.forEach(space => {
      const spaceEl = this.createSpaceElement(space);
      this.elements.spacesGrid.appendChild(spaceEl);
    });
  }

  // 개별 공간 요소 생성
  createSpaceElement(space) {
    const div = document.createElement('div');
    let status = space.status;

    // 경고 상태 확인
    if (status === 'running' && space.endTime) {
      if (isExpired(space.endTime)) {
        status = 'expired';
      } else if (isWarningTime(space.endTime, this.configManager.get('features.warningMinutes'))) {
        status = 'warning';
      }
    }

    div.className = `space-card space-${status}`;
    div.dataset.id = space.id;

    const spaceName = this.configManager.get('labels.spaceName');
    const unit = this.configManager.get('labels.unit');
    const displayName = space.name || `${space.id}${unit} ${spaceName}`;

    div.innerHTML = `
      <div class="space-header">
        <span class="space-number">${displayName}</span>
        ${status === 'expired' ? '<span class="expired-badge">만료</span>' : ''}
        ${status === 'warning' ? '<span class="warning-badge">곧 만료</span>' : ''}
      </div>
      <div class="space-status">
        ${this.getSpaceStatusText(space)}
      </div>
    `;

    div.addEventListener('click', () => this.openModal(space.id));

    return div;
  }

  // 공간 상태 텍스트
  getSpaceStatusText(space) {
    if (space.status === 'idle') {
      return '미사용';
    }

    if (space.status === 'expired' || isExpired(space.endTime)) {
      return '만료됨';
    }

    if (space.status === 'running' && space.endTime) {
      return formatRemainingTime(space.endTime);
    }

    return '미사용';
  }

  // 프리셋 버튼 렌더링
  renderPresets() {
    const presets = this.configManager.get('presets');
    this.elements.timePresets.innerHTML = '';

    presets.forEach(hours => {
      const btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.textContent = this.templateManager.getPresetLabel(hours);
      btn.dataset.hours = hours;

      btn.addEventListener('click', () => {
        this.setTime(hours);
        this.soundManager.playClickSound();
      });

      this.elements.timePresets.appendChild(btn);
    });
  }

  // 타이머 시작
  startTimer() {
    this.updateInterval = setInterval(() => {
      this.updateSpaces();
      this.updateCurrentTime();
    }, 1000);
  }

  // 공간 상태 업데이트
  updateSpaces() {
    let updated = false;
    let hasExpired = false;
    let hasWarning = false;

    this.spaces.forEach(space => {
      if (space.status === 'running' && space.endTime) {
        const now = Date.now();

        // 만료 처리
        if (now >= space.endTime) {
          space.status = 'expired';
          updated = true;
          hasExpired = true;
        }
        // 경고 체크
        else if (isWarningTime(space.endTime, this.configManager.get('features.warningMinutes'))) {
          hasWarning = true;
        }
      }
    });

    if (updated) {
      this.storageManager.saveSpaces(this.spaces);

      // 만료 사운드
      if (hasExpired && this.configManager.get('sound.expireSound')) {
        this.soundManager.playExpireSound();
      }
    }

    // 경고 사운드 (1분에 1번만)
    if (hasWarning && this.configManager.get('sound.warningSound')) {
      const seconds = new Date().getSeconds();
      if (seconds === 0) {
        this.soundManager.playWarningSound();
      }
    }

    // UI 업데이트
    this.renderSpaces();
  }

  // 현재 시각 업데이트
  updateCurrentTime() {
    this.elements.currentTime.textContent = formatCurrentTime();
  }

  // 모달 열기
  openModal(spaceId) {
    this.currentSpaceId = spaceId;
    const space = this.spaces.find(s => s.id === spaceId);

    if (!space) return;

    const spaceName = this.configManager.get('labels.spaceName');
    const unit = this.configManager.get('labels.unit');
    const displayName = space.name || `${space.id}${unit} ${spaceName}`;

    this.elements.modalTitle.textContent = `${displayName} 설정`;
    this.elements.modalOverlay.classList.add('active');
  }

  // 모달 닫기
  closeModal() {
    this.elements.modalOverlay.classList.remove('active');
    this.currentSpaceId = null;
  }

  // 시간 설정
  setTime(hours) {
    if (this.currentSpaceId === null) return;

    const space = this.spaces.find(s => s.id === this.currentSpaceId);
    if (!space) return;

    space.startTime = Date.now();
    space.endTime = calculateEndTime(hours);
    space.status = 'running';

    this.storageManager.saveSpaces(this.spaces);
    this.storageManager.recordUsage(space.id);

    this.renderSpaces();
    this.closeModal();
  }

  // 공간 초기화
  resetSpace() {
    if (this.currentSpaceId === null) return;

    const space = this.spaces.find(s => s.id === this.currentSpaceId);
    if (!space) return;

    space.status = 'idle';
    space.endTime = null;
    space.startTime = null;

    this.storageManager.saveSpaces(this.spaces);

    this.soundManager.playClickSound();
    this.renderSpaces();
    this.closeModal();
  }

  // 이벤트 리스너 설정
  setupEventListeners() {
    // 모달 닫기
    this.elements.closeBtn?.addEventListener('click', () => {
      this.closeModal();
      this.soundManager.playClickSound();
    });

    // 모달 오버레이 클릭
    this.elements.modalOverlay?.addEventListener('click', (e) => {
      if (e.target.id === 'modalOverlay') {
        this.closeModal();
      }
    });

    // 공간 초기화
    this.elements.resetBtn?.addEventListener('click', () => {
      this.resetSpace();
    });

    // 관리자 버튼
    this.elements.adminBtn?.addEventListener('click', () => {
      this.showAdminAuth();
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.elements.modalOverlay.classList.contains('active')) {
          this.closeModal();
        }
        if (this.elements.adminPanel?.classList.contains('active')) {
          this.hideAdminPanel();
        }
      }
    });
  }

  // 관리자 인증 표시
  showAdminAuth() {
    const pin = prompt('관리자 PIN을 입력하세요:');

    if (pin && this.configManager.verifyPin(pin)) {
      this.showAdminPanel();
    } else if (pin) {
      alert('PIN이 올바르지 않습니다.');
    }
  }

  // 관리자 패널 표시
  showAdminPanel() {
    this.isAdminMode = true;
    if (this.elements.adminPanel) {
      this.elements.adminPanel.classList.add('active');
      this.renderAdminPanel();
    }
  }

  // 관리자 패널 숨기기
  hideAdminPanel() {
    this.isAdminMode = false;
    if (this.elements.adminPanel) {
      this.elements.adminPanel.classList.remove('active');
    }
  }

  // 관리자 패널 렌더링
  renderAdminPanel() {
    // 현재 설정 값 로드
    const spaceCount = this.configManager.get('spaceCount');
    const spaceName = this.configManager.get('labels.spaceName');
    const soundEnabled = this.configManager.get('sound.enabled');

    // 폼 필드에 값 설정
    document.getElementById('spaceCountInput').value = spaceCount;
    document.getElementById('spaceNameInput').value = spaceName;
    document.getElementById('soundEnabledInput').checked = soundEnabled;

    // 템플릿 버튼 이벤트
    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const template = btn.dataset.template;
        if (confirm(`${btn.querySelector('.template-name').textContent} 템플릿을 적용하시겠습니까?`)) {
          this.applyTemplate(template);
          this.hideAdminPanel();
        }
      });
    });

    // 저장 버튼
    document.getElementById('saveAdminBtn')?.addEventListener('click', () => {
      this.saveAdminSettings();
    });

    // 닫기 버튼
    document.getElementById('adminCloseBtn')?.addEventListener('click', () => {
      this.hideAdminPanel();
    });

    // 내보내기
    document.getElementById('exportBtn')?.addEventListener('click', () => {
      this.exportSettings();
    });

    // 불러오기
    document.getElementById('importBtn')?.addEventListener('click', () => {
      this.importSettings();
    });

    // 전체 초기화
    document.getElementById('resetAllBtn')?.addEventListener('click', () => {
      if (confirm('모든 설정과 데이터를 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
        this.resetAll();
      }
    });
  }

  // 관리자 설정 저장
  saveAdminSettings() {
    const spaceCount = parseInt(document.getElementById('spaceCountInput').value);
    const spaceName = document.getElementById('spaceNameInput').value;
    const soundEnabled = document.getElementById('soundEnabledInput').checked;

    this.configManager.set('spaceCount', spaceCount);
    this.configManager.set('labels.spaceName', spaceName);
    this.configManager.set('sound.enabled', soundEnabled);

    // 사운드 설정 업데이트
    this.soundManager.setEnabled(soundEnabled);

    // 공간 수 변경 시 재로드
    this.spaces = this.storageManager.loadSpaces(spaceCount);

    // UI 재렌더링
    this.renderUI();

    alert('설정이 저장되었습니다.');
    this.hideAdminPanel();
  }

  // 설정 내보내기
  exportSettings() {
    const backup = this.storageManager.createBackup();
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `multi-space-timer-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  // 설정 불러오기
  importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const backup = JSON.parse(event.target.result);
          if (this.storageManager.restoreBackup(backup)) {
            alert('설정을 불러왔습니다. 페이지를 새로고침합니다.');
            location.reload();
          } else {
            alert('설정 파일이 올바르지 않습니다.');
          }
        } catch (e) {
          alert('파일을 읽을 수 없습니다.');
        }
      };

      reader.readAsText(file);
    };

    input.click();
  }

  // 전체 초기화
  resetAll() {
    this.storageManager.clearAll();
    this.configManager.reset();
    alert('초기화가 완료되었습니다. 페이지를 새로고침합니다.');
    location.reload();
  }

  // 템플릿 적용
  applyTemplate(templateKey) {
    if (this.templateManager.applyTemplate(templateKey)) {
      // 공간 수가 변경되었을 수 있으므로 재로드
      const newSpaceCount = this.configManager.get('spaceCount');
      this.spaces = this.storageManager.loadSpaces(newSpaceCount);

      // UI 전체 재렌더링
      this.renderUI();

      alert('템플릿이 적용되었습니다.');
    }
  }

  // 정리
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
  const app = new MultiSpaceTimer();
  app.init();

  // 전역으로 노출 (디버깅용)
  window.multiSpaceTimer = app;
});
