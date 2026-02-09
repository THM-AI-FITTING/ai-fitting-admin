<!-- 
  AI 가상 피팅 작업 상세 페이지
  작업의 기본 정보와 결과 이미지를 보여주며, 이미지 다운로드 및 상세 리뷰 이동 기능을 제공합니다.
-->
<template>
  <div v-if="job" class="job-detail-page animate-fade-in stagger-1">
    <div class="breadcrumb">
      <BaseButton variant="ghost" size="sm" @click="$router.back()">← 목록으로 돌아가기</BaseButton>
    </div>

    <!-- Job Header Info -->
    <BaseCard class="header-card animate-fade-in stagger-1">
      <div class="header-info-container" :class="{ 'is-expanded': isHeaderExpanded }">
        <!-- Primary Row: Partner & Status (Always Visible on Mobile) -->
        <div class="header-primary-row">
          <div class="header-item">
            <span class="header-label">
              <UserIcon :size="14" class="label-icon" />
              파트너
            </span>
            <span class="header-value">{{ job.owner }}</span>
          </div>

          <div class="header-divider mobile-hidden"></div>

          <div class="header-item">
            <span class="header-label">
              <Activity :size="14" class="label-icon" />
              상태
            </span>
            <StatusBadge :status="job.status" />
          </div>

          <!-- Mobile Toggle Button -->
          <button class="header-toggle-btn mobile-only" @click="isHeaderExpanded = !isHeaderExpanded">
            <ChevronDown :size="20" class="toggle-icon" :class="{ 'is-rotated': isHeaderExpanded }" />
          </button>
        </div>
        
        <div class="header-divider mobile-hidden"></div>

        <!-- Secondary Row: ID, User, Date (Collapsible on Mobile) -->
        <div class="header-secondary-row">
          <div class="header-item">
            <span class="header-label">
              <Fingerprint :size="14" class="label-icon" />
              요청 ID
            </span>
            <div class="header-value-row">
              <div class="copy-container">
                <span class="header-value mono clickable" @click="copyToClipboard(job.requestId)">{{ job.requestId }}</span>
                <Transition name="fade-up">
                  <div v-if="showTooltip" class="copy-tooltip">복사 완료!</div>
                </Transition>
              </div>
              <button class="copy-btn-inline" @click="copyToClipboard(job.requestId)" title="ID 복사">
                <Copy :size="14" />
              </button>
            </div>
          </div>

          <div class="header-divider mobile-hidden"></div>

          <div class="header-item">
            <span class="header-label">
              <HardDrive :size="14" class="label-icon" />
              사용자 ID
            </span>
            <span class="header-value">{{ job.userId }}</span>
          </div>

          <div class="header-divider mobile-hidden"></div>

          <div class="header-item">
            <span class="header-label">
              <Clock :size="14" class="label-icon" />
              생성일
            </span>
            <span class="header-value">{{ new Date(job.sysRegDtm).toLocaleString('ko-KR', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit',
              hour12: false 
            }) }}</span>
          </div>
        </div>
      </div>
    </BaseCard>

    <div class="comparison-layout" ref="comparisonLayout">
      <!-- 1. Person Card -->
      <BaseCard v-if="job.personUrl" class="comparison-card person-card animate-fade-in">
        <template #header>
          <div class="card-header-styled title-person">
            <UserIcon :size="20" class="header-icon" />
            인물 이미지
          </div>
        </template>
        <div class="comparison-item centered">
          <div class="image-wrapper">
            <BaseImage :src="job.personUrl" alt="Person" show-zoom @zoom="openZoom(job.personUrl, '대상 사람')" />
          </div>
        </div>
      </BaseCard>

      <!-- 2. Product Card -->
      <BaseCard v-if="job.productUrl" class="comparison-card product-card animate-fade-in stagger-2">
        <template #header>
          <div class="card-header-styled title-product">
            <Shirt :size="20" class="header-icon" />
            의류 이미지
          </div>
        </template>
        <div class="comparison-item centered">
          <div class="image-wrapper">
            <BaseImage :src="job.productUrl" alt="Product" show-zoom @zoom="openZoom(job.productUrl, '대상 상품')" />
          </div>
        </div>
      </BaseCard>

      <!-- Arrow 2 -->
      <div class="flow-arrow animate-fade-in stagger-3" v-if="job.status === 'DONE' || job.status === 'FAILED'" :class="{ 'flow-arrow-failed': job.status === 'FAILED' }">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </div>

      <!-- 3. Result Card -->
      <BaseCard v-if="job.status === 'DONE' && job.url" class="comparison-card result-section premium animate-fade-in stagger-4">
        <template #header>
          <div class="fancy-title">
            <Sparkles :size="20" class="sparkle-icon" />
            가상 피팅 결과
          </div>
          <button class="download-btn-header" @click="downloadImage(job.url)" title="이미지 다운로드">
            <Download :size="18" />
          </button>
        </template>
        <div class="result-display">
          <div class="image-wrapper main-result">
            <BaseImage :src="job.url" alt="Result" fit="contain" show-zoom :zoom-icon-size="20" @zoom="openZoom(job.url, '가상 피팅 결과')" />
          </div>

        </div>
      </BaseCard>

      <!-- Failure Section -->
      <BaseCard v-if="job.status === 'FAILED'" title="작업 실패" class="comparison-card failure-section animate-fade-in stagger-4">
        <div class="failure-display">
          <div class="failure-message-box">
            <!-- 실패 아이콘 -->
            <div class="failure-icon-wrapper">
              <div class="failure-icon-bg"></div>
              <svg class="failure-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            
            <!-- 실패 메시지 -->
            <h3 class="failure-title">처리할 수 없는 요청</h3>
            <p class="failure-text">{{ job.message || '실패 이유를 확인할 수 없습니다.' }}</p>
            
            <!-- 재시도 안내 -->
            <div class="failure-hint">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span>다른 이미지로 다시 시도해 주세요</span>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- 슬라이드 인디케이터 (모바일 전용) -->
      <div class="mobile-slide-indicator">
        <div class="indicator-track">
          <div class="indicator-bar" :style="{ width: `${barWidth}%`, left: `${scrollProgress}%` }"></div>
        </div>
      </div>
    </div>

    <!-- 이미지 확대 오버레이 -->
    <Teleport to="body">
      <Transition name="zoom">
        <div v-if="isZoomOpen" class="zoom-overlay" @click="closeZoom">
          <div class="zoom-header">
            <span class="zoom-title">{{ zoomTitle }}</span>
            <button class="zoom-close" @click="closeZoom">
              <X :size="24" />
            </button>
          </div>
          <div class="zoom-content">
            <img 
              :src="activeZoomImage" 
              :alt="zoomTitle" 
              :class="['zoomed-image', { 'is-expanded': isExpanded }]" 
              @click="toggleExpand" 
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { Search, X, User as UserIcon, Shirt, Sparkles, Copy, Fingerprint, Clock, Activity, HardDrive, Download, ChevronDown } from 'lucide-vue-next';
import BaseCard from '~/components/ui/BaseCard.vue';
import BaseButton from '~/components/ui/BaseButton.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import BaseImage from '~/components/ui/BaseImage.vue';

definePageMeta({
  title: '작업 상세 정보'
});

// 페이지 진입 시 해당 ID의 작업 데이터를 조회합니다.
const route = useRoute();
const config = useRuntimeConfig();
const { data: job } = await useFetch<any>(`${config.public.apiBase}/api/jobs/${route.params.id}`);

// 이미지 확대 상태 관리
const isZoomOpen = ref(false);
const isExpanded = ref(false); // 상세 확대(Toggle Zoom) 상태
const activeZoomImage = ref('');
const zoomTitle = ref('');
const showTooltip = ref(false);
const isHeaderExpanded = ref(false); // Mobile header collapse state

const scrollProgress = ref(0);
const barWidth = ref(33); // Initial default
const comparisonLayout = ref<HTMLElement | null>(null);

const handleScroll = (e: Event) => {
  const el = e.target as HTMLElement;
  const scrollWidth = el.scrollWidth;
  const clientWidth = el.clientWidth;
  
  if (scrollWidth <= clientWidth) {
    barWidth.value = 100;
    scrollProgress.value = 0;
    return;
  }
  
  // 1. Dynamic Bar Width (%)
  const ratio = clientWidth / scrollWidth;
  const currentBarWidth = ratio * 100;
  barWidth.value = currentBarWidth;

  // 2. Max Scrollable Distance (Pixels)
  const maxScroll = scrollWidth - clientWidth;
  
  // 3. Current Scroll Position
  const scrollLeft = el.scrollLeft;

  // Tolerance check: if close to end (within 5px), snap to end
  const isAtEnd = maxScroll - scrollLeft < 5;
  
  // Max left position (%)
  const maxLeft = 100 - currentBarWidth;

  if (isAtEnd) {
    scrollProgress.value = maxLeft;
  } else {
    // Current Left (%)
    // (scrollLeft / maxScroll) * maxLeft
    const progressRatio = scrollLeft / maxScroll;
    const currentLeft = progressRatio * maxLeft;
    scrollProgress.value = Math.max(0, Math.min(currentLeft, maxLeft));
  }
};

onMounted(() => {
  if (comparisonLayout.value) {
    comparisonLayout.value.addEventListener('scroll', handleScroll);
    // 초기 로드 시 한 번 실행하여 바 크기 설정
    // setTimeout을 사용하여 레이아웃이 안정된 후 실행
    setTimeout(() => {
      // Fake event
      const mockEvent = { target: comparisonLayout.value } as unknown as Event;
      handleScroll(mockEvent);
    }, 100);
  }
});

onUnmounted(() => {
  if (comparisonLayout.value) {
    comparisonLayout.value.removeEventListener('scroll', handleScroll);
  }
});

const openZoom = (url: string, title: string) => {
  activeZoomImage.value = url;
  zoomTitle.value = title;
  isZoomOpen.value = true;
  isExpanded.value = false; // 초기화
  document.body.style.overflow = 'hidden';
};

const closeZoom = () => {
  isZoomOpen.value = false;
  isExpanded.value = false;
  document.body.style.overflow = '';
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    showTooltip.value = true;
    setTimeout(() => {
      showTooltip.value = false;
    }, 2000);
  } catch (err) {
    console.error('Copy failed:', err);
  }
};

const toggleExpand = (e: MouseEvent) => {
  e.stopPropagation();
  isExpanded.value = !isExpanded.value;
};

/**
 * 작업을 완료한 결과 이미지를 브라우저로 다운로드합니다.
 */
const downloadImage = async (url: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `fitting-result-${route.params.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed:', error);
    // CORS 문제 등으로 실패할 경우 기존처럼 새 창에서 열기 시도
    window.open(url, '_blank');
  }
};
</script>

<style scoped>
.job-detail-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  align-items: start;
}

.job-detail-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .job-detail-page {
    /* background-color: #f7f9fb;  삭제 - 기본 테마 사용 */
    min-height: 50vh;
    margin: -1.5rem -1rem; /* 레이아웃 패딩 상쇄 */
    padding: 1.5rem 1rem;
    gap: 1rem;
  }
}

/* 글로벌 애니메이션 유틸리티 사용 ( main.css 참고 ) */

/* Header Info (Slimmer) */
.header-card {
  padding: 0;
}

@media (max-width: 768px) {
  .header-card {
    width: 82vw;
    margin: 0 auto;
    border-radius: 24px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  }
}

.header-info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
  padding: 1.25rem 1.5rem;
}

.header-divider {
  width: 1px;
  height: 24px;
  background: var(--color-border);
  opacity: 0.5;
}

.header-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.header-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.label-icon {
  opacity: 0.7;
}

.header-value-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-value {
  font-weight: 600;
  font-size: 0.9rem; /* Reduced from 1rem */
  color: var(--color-text-main);
  transition: all 0.2s;
}

.copy-container {
  position: relative;
  display: flex;
  align-items: center;
}

.copy-tooltip {
  position: absolute;
  top: -34px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary);
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  z-index: 100;
}

.copy-tooltip::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid var(--color-primary);
}

.fade-up-enter-active, .fade-up-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-up-enter-from {
  opacity: 0;
  transform: translate(-50%, 10px);
}
.fade-up-leave-to {
  opacity: 0;
  transform: translate(-50%, -5px);
}

.mono.clickable {
  cursor: pointer;
  text-decoration: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-main) !important; /* 모바일에서 클릭 시에도 색상 유지 */
}

.mono.clickable:hover {
  color: var(--color-primary-light, #818cf8);
  border-bottom-color: currentColor;
  transform: translateY(-1px);
}

@media (max-width: 900px) {
  .header-info-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding:  0.5rem 0.5rem;
    gap: 1rem;
  }

  .header-primary-row {
     display: flex;
     align-items: center;
     justify-content: space-between;
     width: 100%;
  }

  .header-secondary-row {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
    display: none; /* 기본 숨김 */
  }

  .header-info-container.is-expanded .header-secondary-row {
    display: flex;
    animation: slideDown 0.3s ease forwards;
  }

  .header-divider.mobile-hidden {
    display: none;
  }

  .header-toggle-btn.mobile-only {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0,0,0,0.05);
    color: var(--color-text-muted);
    z-index: 10; /* Ensure clickability */
    position: relative;
    cursor: pointer;
  }

  .toggle-icon {
    transition: transform 0.3s ease;
  }
  
  .toggle-icon.is-rotated {
    transform: rotate(180deg);
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
}

@media (min-width: 901px) {
  .header-info-container {
     display: flex;
     align-items: center;
     flex-wrap: wrap;
     gap: 1.5rem;
     padding: 0.5rem 0.5rem;
  }
  .header-primary-row, .header-secondary-row {
     display: contents; /* PC에서는 flex 구조 해제하고 부모 그리드 따름 */
  }
  .header-toggle-btn.mobile-only {
    display: none;
  }
}

/* Comparison Layout (Aligned) */
.comparison-layout {
  display: flex;
  align-items: stretch;
  gap: 1.5rem;
  width: 100%;
}

@media (max-width: 1100px) {
  .comparison-layout {
    flex-direction: column;
    height: auto;
    min-height: 0;
    gap: 1.5rem;
  }
  .flow-arrow {
    transform: rotate(180deg);
    padding: 1rem 0;
    margin: 0.5rem 0;
  }
}


.comparison-card {
  flex: 1;
  min-height: 0; /* flex 아이템 오버플로우 방지 */
  overflow: hidden;
}

.highlight {
  border: 2px solid var(--color-primary-light);
}

.input-comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  padding: 0.5rem;
  height: 100%;
}

@media (max-width: 768px) {
  .input-comparison-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

.comparison-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}

.item-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-main);
  background: rgba(255, 255, 255, 0.03);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  align-self: center;
  margin-top: 1rem;
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

.label-icon {
  color: var(--color-primary);
}

.label-icon.secondary {
  color: #10b981;
}

/* Flow Arrow - 중앙 정렬 */
.flow-arrow {
  color: var(--color-text-muted);
  opacity: 0.4;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  flex-shrink: 0;
}

/* Unused visibility classes removed */
/* The classes .desktop-only, .mobile-only, and .input-section were not found in the provided document. */

/* Gradient text styles for title-person and title-product */
/* These classes were not found in the provided document, so they are added here. */
.title-person {
  background: linear-gradient(to right, #6366f1, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent; /* Fallback for browsers that don't support -webkit-text-fill-color */
}

.title-product {
  background: linear-gradient(to right, #10b981, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent; /* Fallback for browsers that don't support -webkit-text-fill-color */
}

@media (max-width: 768px) {
  .comparison-layout {
    display: flex !important;
    flex-direction: row !important;
    overflow-x: auto !important;
    scroll-snap-type: x mandatory !important;
    gap: 1rem !important;
    scroll-snap-type: x mandatory !important;
    gap: 1rem !important;
    padding: 0 9vw 1.5rem !important; /* 양옆 패딩으로 첫번째/마지막 카드 중앙 정렬 유도 (100 - 82) / 2 */
    margin: 0 !important; /* 음수 마진 제거 */
    -webkit-overflow-scrolling: touch;
    height: auto;
    position: relative;
    scrollbar-width: none; /* Firefox */
  }
  .comparison-layout::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }

  .comparison-card {
    flex: 0 0 82vw !important; /* 가로 크기 강제 */
    width: 82vw !important;
    min-width: 82vw !important;
    scroll-snap-align: center;
    background: var(--color-bg-surface) !important;
    border-radius: 24px !important;
    flex-shrink: 0 !important;
  }

  .comparison-card :deep(.card-header) {
    border-bottom: none;
    padding: 1.25rem 1.5rem 1rem; /* 안쪽 여백 축소 및 통일 */
  }

  .comparison-card :deep(.card-title) {
    font-size: 1.6rem !important;
    font-weight: 800 !important;
    color: var(--color-text-main);
    letter-spacing: -0.03em;
  }

  .flow-arrow {
    display: none !important; /* 모바일에서 화살표 숨김 */
  }

  .flow-arrow svg {
    width: 20px;
  }

  .mobile-slide-indicator {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 0 1rem 1.2rem;
    z-index: 50;
    background: linear-gradient(to top, var(--color-bg-main) 80%, transparent);
  }

  .indicator-track {
    width: 82vw; /* 원래 너비(82vw)로 복원 */
    height: 4px; /* 4px 두께로 복합 */
    background: transparent; /* 트랙을 보이지 않게 처리 (사용자 요청) */
    border-radius: 4px;
    overflow: hidden;
    position: relative; /* Ensure absolute child follows this track */
    margin: 0 auto; /* 중앙 정렬 */
  }

  .indicator-bar {
    height: 100%; /* track height(4px)를 그대로 사용 */
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    border-radius: 4px;
    width: 33%; /* Default, overridden by inline style */
    position: absolute; /* left positioning requires absolute */
    top: 0;
    transition: left 0.1s linear, width 0.1s linear; 
  }
}

.image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 140%;
  background: transparent;
  border: none;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  overflow: visible;
  border-radius: 16px;
  background: var(--color-bg-alt);
}

@media (max-width: 768px) {
  .image-wrapper {
    border-width: 1.5px;
    padding-top: 130%; /* 모바일에서 약간 더 길게 */
  }
}

.image-wrapper :deep(.base-image) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  display: flex;
  align-items: flex-start; /* 상단 정렬 */
  justify-content: center;
}

.image-wrapper :deep(.actual-image) {
  max-height: 100%;
  max-width: 100%;
  width: auto;
  height: auto;
  object-fit: contain; /* 비율 유지하며 전체 노출 */
  border-radius: 12px;
  display: block;
}

.image-wrapper:hover {
  transform: translateY(-4px);
}

.image-wrapper:hover .zoom-btn {
  opacity: 1;
  transform: scale(1);
}

/* 확대 오버레이 */
.zoom-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  cursor: zoom-out;
}

.zoom-header {
  height: 70px;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(to bottom, rgba(0,0,0,0.5), transparent);
  color: white;
  pointer-events: none;
}

.zoom-title {
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.zoom-close {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.2s;
}

.zoom-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.zoom-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow: hidden;
}

.zoomed-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  box-shadow: 0 0 50px rgba(0,0,0,0.5);
  border-radius: 12px;
  cursor: zoom-in;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}

.zoomed-image.is-expanded {
  transform: scale(1.6);
  cursor: zoom-out;
}

/* Zoom Transition */
.zoom-enter-active,
.zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.zoom-enter-from,
.zoom-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

.zoom-enter-from .zoomed-image {
  transform: scale(0.9);
}


/* Result Content Display (Centered) */
.result-display {
  display: flex;
  flex-direction: column;
  gap: 1rem; /* 간격 축소 */
  padding: 0.5rem;
  flex: 1;
  justify-content: center; /* 수직 중앙 정렬 */
  align-items: center;
}

.main-result {
  width: 100%;
  margin: 0 auto;
  background: transparent;
  border: none;
  padding-top: 0; /* 결과 이미지는 고정 비율 박스 제거 */
  height: auto;
  display: flex;
  justify-content: center;
}

.main-result :deep(.base-image) {
  position: relative; /* absolute 제거하여 높이 자동 조절 */
  width: 100%;
  height: auto;
  background: transparent;
  overflow: visible; /* 확대 시 잘림 방지 */
}

.main-result :deep(.actual-image) {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
  border-radius: 12px;
}

.main-result {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: transform;
}

.main-result:hover {
  transform: scale(1.02);
}

.result-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 0; /* 이미지 바로 밑으로 밀착 */
  padding-top: 0.5rem;
}

@media (max-width: 768px) {
  .result-actions {
    display: none;
  }
}

.download-btn-header {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-left: auto; /* 우측 정렬 */
  transition: all 0.2s ease;
}

.download-btn-header:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: white;
}

.download-btn-header:active {
  transform: scale(0.95);
}

@media (max-width: 768px) {
  .download-btn-header {
    width: 32px;
    height: 32px;
  }
}



/* 결과 섹션 카드 본체 높이 채우기 */
.result-section :deep(.card-body) {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}


/* Utility */
.debug-info {
  font-size: 0.8rem;
  background: black;
  color: #0f0;
  padding: 1rem;
  border-radius: 8px;
  overflow: auto;
}

/* Flow Arrow - 실패 시 색상 변경 */
.flow-arrow-failed {
  color: var(--color-error, #ef4444) !important;
  opacity: 0.6;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 입력/실패 섹션 높이 맞춤 */
/* Failure Section Style */
.failure-section {
  border: 1px solid rgba(239, 68, 68, 0.25);
  background: var(--color-card-bg, #ffffff);
}

.failure-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 1.5rem;
  min-height: 0;
}

@media (max-width: 640px) {
  .failure-display {
    padding: 1rem;
  }
  .failure-message-box {
    padding: 1.5rem 1rem;
  }
}

/* 실패 메시지 박스 - 전체 컨텐츠 감싸기 */
.failure-message-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 2rem;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-radius: 16px;
  text-align: center;
  width: 100%;
  max-width: 400px;
}

/* 실패 아이콘 래퍼 */
.failure-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.failure-icon-bg {
  position: absolute;
  width: 70px;
  height: 70px;
  background: radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse-error 2s ease-in-out infinite;
}

@keyframes pulse-error {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.15); opacity: 0.3; }
}

.failure-icon {
  color: var(--color-error, #ef4444);
  position: relative;
  z-index: 1;
}

.failure-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-error, #ef4444);
  margin: 0;
}

.failure-text {
  font-size: 0.95rem;
  color: #1f2937;
  font-weight: 400;
  line-height: 1.6;
  margin: 0;
}

/* 재시도 안내 */
.failure-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #6b7280;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 20px;
}

.failure-hint svg {
  opacity: 0.6;
}
/* Fancy Result Styling */
.premium {
  border: 2px solid transparent;
  background-image: linear-gradient(var(--color-bg-surface), var(--color-bg-surface)), 
                    linear-gradient(to right, #6366f1, #a855f7, #ec4899);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  position: relative;
  overflow: visible;
}

.fancy-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 800;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.01em;
}

.sparkle-icon {
  color: #fbbf24;
  filter: drop-shadow(0 0 5px rgba(251, 191, 36, 0.6));
}

.emoji-prefix, .emoji-suffix {
  font-size: 1.2rem;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
  -webkit-text-fill-color: initial;
}

.result-section :deep(.card-header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.02);
}
.card-header-styled {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 800;
  font-size: 1.1rem;
  letter-spacing: -0.01em;
}

.title-person {
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-product {
  background: linear-gradient(135deg, #7c3aed, #db2777);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-icon {
  opacity: 1;
  -webkit-text-fill-color: initial; /* Gradient text fill 상쇄 */
  color: var(--color-primary); /* Default color for person icon */
}

.title-product .header-icon {
  color: #10b981; /* Green color for product icon */
}

.comparison-item.centered {
  justify-content: center;
}
</style>
