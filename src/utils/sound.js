// 사운드 알림 관리

export class SoundManager {
  constructor() {
    this.context = null;
    this.enabled = false;
    this.volume = 0.5;
  }

  // 초기화
  init(enabled = false, volume = 0.5) {
    this.enabled = enabled;
    this.volume = Math.max(0, Math.min(1, volume));

    // Web Audio API 지원 확인
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
      this.context = new (AudioContext || webkitAudioContext)();
    }
  }

  // 사운드 활성화/비활성화
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  // 볼륨 설정
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  // 간단한 비프음 생성 (Web Audio API)
  playBeep(frequency = 800, duration = 200) {
    if (!this.enabled || !this.context) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(this.volume, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.context.currentTime + duration / 1000
    );

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + duration / 1000);
  }

  // 만료 알림음 (3번 비프)
  playExpireSound() {
    if (!this.enabled) return;

    this.playBeep(800, 200);
    setTimeout(() => this.playBeep(800, 200), 300);
    setTimeout(() => this.playBeep(800, 300), 600);
  }

  // 경고 알림음 (1번 비프)
  playWarningSound() {
    if (!this.enabled) return;

    this.playBeep(600, 150);
  }

  // 버튼 클릭음
  playClickSound() {
    if (!this.enabled) return;

    this.playBeep(1000, 50);
  }
}
