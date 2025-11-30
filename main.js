// 공간 상태 관리
const SPACE_COUNT = 16;
const STORAGE_KEY = 'multi-space-timer-spaces';

// 공간 상태: idle (미사용), running (사용 중), expired (만료)
let spaces = [];
let currentSpaceId = null;

// 초기화
function init() {
    // localStorage에서 저장된 상태 로드
    loadSpaces();

    // UI 생성
    renderSpaces();

    // 이벤트 리스너 등록
    setupEventListeners();

    // 타이머 시작 (1초마다)
    setInterval(updateSpaces, 1000);

    // 현재 시각 업데이트
    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();
}

// localStorage에서 공간 상태 로드
function loadSpaces() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
        try {
            spaces = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load saved spaces:', e);
            initializeSpaces();
        }
    } else {
        initializeSpaces();
    }
}

// 공간 상태 초기화
function initializeSpaces() {
    spaces = Array.from({ length: SPACE_COUNT }, (_, i) => ({
        id: i + 1,
        status: 'idle', // idle, running, expired
        endTime: null
    }));
    saveSpaces();
}

// localStorage에 공간 상태 저장
function saveSpaces() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(spaces));
}

// 공간 UI 렌더링
function renderSpaces() {
    const grid = document.getElementById('spacesGrid');
    grid.innerHTML = '';

    spaces.forEach(space => {
        const spaceEl = createSpaceElement(space);
        grid.appendChild(spaceEl);
    });
}

// 개별 공간 요소 생성
function createSpaceElement(space) {
    const div = document.createElement('div');
    div.className = `space-card space-${space.status}`;
    div.dataset.id = space.id;

    div.innerHTML = `
        <div class="space-header">
            <span class="space-number">${space.id}번 공간</span>
            ${space.status === 'expired' ? '<span class="expired-badge">만료</span>' : ''}
        </div>
        <div class="space-status">
            ${getSpaceStatusText(space)}
        </div>
    `;

    div.addEventListener('click', () => openModal(space.id));

    return div;
}

// 공간 상태 텍스트 생성
function getSpaceStatusText(space) {
    if (space.status === 'idle') {
        return '미사용';
    }

    if (space.status === 'expired') {
        return '만료됨';
    }

    if (space.status === 'running' && space.endTime) {
        return getRemainingTimeText(space.endTime);
    }

    return '미사용';
}

// 남은 시간 텍스트 계산
function getRemainingTimeText(endTime) {
    const now = Date.now();
    const remaining = endTime - now;

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

// 모든 공간 상태 업데이트
function updateSpaces() {
    let updated = false;

    spaces.forEach(space => {
        if (space.status === 'running' && space.endTime) {
            const now = Date.now();

            if (now >= space.endTime) {
                space.status = 'expired';
                updated = true;
            }
        }
    });

    if (updated) {
        saveSpaces();
    }

    // UI 업데이트
    renderSpaces();
}

// 현재 시각 업데이트
function updateCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    document.getElementById('currentTime').textContent = `${hours}:${minutes}`;
}

// 모달 열기
function openModal(spaceId) {
    currentSpaceId = spaceId;

    const modal = document.getElementById('modalOverlay');
    const title = document.getElementById('modalTitle');

    title.textContent = `${spaceId}번 공간 설정`;
    modal.classList.add('active');
}

// 모달 닫기
function closeModal() {
    const modal = document.getElementById('modalOverlay');
    modal.classList.remove('active');
    currentSpaceId = null;
}

// 시간 설정
function setTime(hours) {
    if (currentSpaceId === null) return;

    const space = spaces.find(s => s.id === currentSpaceId);
    if (!space) return;

    const now = Date.now();
    space.endTime = now + (hours * 60 * 60 * 1000);
    space.status = 'running';

    saveSpaces();
    renderSpaces();
    closeModal();
}

// 공간 초기화
function resetSpace() {
    if (currentSpaceId === null) return;

    const space = spaces.find(s => s.id === currentSpaceId);
    if (!space) return;

    space.status = 'idle';
    space.endTime = null;

    saveSpaces();
    renderSpaces();
    closeModal();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 모달 닫기
    document.getElementById('closeBtn').addEventListener('click', closeModal);

    // 모달 오버레이 클릭 시 닫기
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'modalOverlay') {
            closeModal();
        }
    });

    // 공간 초기화
    document.getElementById('resetBtn').addEventListener('click', resetSpace);

    // 프리셋 버튼들
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const hours = parseInt(btn.dataset.hours);
            setTime(hours);
        });
    });
}

// DOMContentLoaded 시 초기화
document.addEventListener('DOMContentLoaded', init);
