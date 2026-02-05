<!-- 
  AI 가상 피팅 작업 상세 페이지
  작업의 기본 정보와 결과 이미지를 보여주며, 이미지 다운로드 및 상세 리뷰 이동 기능을 제공합니다.
-->
<template>
  <div v-if="job" class="job-detail-page">
    <div class="breadcrumb">
      <BaseButton variant="ghost" size="sm" @click="$router.back()">← 목록으로 돌아가기</BaseButton>
    </div>

    <!-- Job Header Info -->
    <BaseCard class="header-card">
      <div class="header-info-grid">
        <div class="header-item">
          <span class="header-label">요청 ID</span>
          <span class="header-value mono">{{ job.requestId }}</span>
        </div>
        <div class="header-item">
          <span class="header-label">파트너</span>
          <span class="header-value">{{ job.owner }}</span>
        </div>
        <div class="header-item">
          <span class="header-label">사용자 ID</span>
          <span class="header-value">{{ job.userId }}</span>
        </div>
        <div class="header-item">
          <span class="header-label">상태</span>
          <StatusBadge :status="job.status" />
        </div>
        <div class="header-item">
          <span class="header-label">생성일</span>
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
    </BaseCard>

    <div class="comparison-layout">
      <!-- Input Section -->
      <BaseCard title="입력 이미지" class="comparison-card input-section">
        <div class="input-comparison-grid">
          <div v-if="job.personUrl" class="comparison-item">
            <span class="item-label">대상 사람</span>
            <div class="image-wrapper">
              <BaseImage :src="job.personUrl" alt="Person" />
              <button class="zoom-btn" @click="openZoom(job.personUrl, '대상 사람')" title="이미지 확대">
                <Maximize2 :size="16" />
              </button>
            </div>
          </div>
          <div v-if="job.productUrl" class="comparison-item">
            <span class="item-label">대상 상품</span>
            <div class="image-wrapper">
              <BaseImage :src="job.productUrl" alt="Product" />
              <button class="zoom-btn" @click="openZoom(job.productUrl, '대상 상품')" title="이미지 확대">
                <Maximize2 :size="16" />
              </button>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Flow Arrow (Visible on desktop) -->
      <div class="flow-arrow" v-if="job.status === 'DONE' || job.status === 'FAILED'" :class="{ 'flow-arrow-failed': job.status === 'FAILED' }">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </div>

      <BaseCard v-if="job.status === 'DONE' && job.url" title="가상 피팅 결과" class="comparison-card result-section highlight">
        <div class="result-display">
          <div class="image-wrapper main-result">
            <BaseImage :src="job.url" alt="Result" fit="contain" />
            <button class="zoom-btn" @click="openZoom(job.url, '가상 피팅 결과')" title="이미지 확대">
              <Maximize2 :size="18" />
            </button>
          </div>
          <div class="result-actions">
            <BaseButton variant="primary" @click="downloadImage(job.url)">
              이미지 다운로드
            </BaseButton>
            <NuxtLink :to="`/images/${job.requestId}`">
              <BaseButton variant="ghost">상세 리뷰</BaseButton>
            </NuxtLink>
          </div>
        </div>
      </BaseCard>

      <!-- 실패 이유 표시 섹션 -->
      <BaseCard v-if="job.status === 'FAILED'" title="작업 실패" class="comparison-card failure-section">
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
          <div class="zoom-content" @click.stop>
            <img :src="activeZoomImage" :alt="zoomTitle" class="zoomed-image" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { Maximize2, X } from 'lucide-vue-next';
import BaseCard from '~/components/ui/BaseCard.vue';
import BaseButton from '~/components/ui/BaseButton.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import BaseImage from '~/components/ui/BaseImage.vue';

definePageMeta({
  title: '작업 상세 정보'
});

// 페이지 진입 시 해당 ID의 작업 데이터를 조회합니다.
const route = useRoute();
const { data: job } = await useFetch<any>(`/api/jobs/${route.params.id}`);

// 이미지 확대 상태 관리
const isZoomOpen = ref(false);
const activeZoomImage = ref('');
const zoomTitle = ref('');

const openZoom = (url: string, title: string) => {
  activeZoomImage.value = url;
  zoomTitle.value = title;
  isZoomOpen.value = true;
  document.body.style.overflow = 'hidden';
};

const closeZoom = () => {
  isZoomOpen.value = false;
  document.body.style.overflow = '';
};

/**
 * 작업을 완료한 결과 이미지를 새 창에서 엽니다.
 */
const downloadImage = (url: string) => {
  window.open(url, '_blank');
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
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header Info (Slimmer) */
.header-card {
  padding: 0;
}

.header-info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: space-between;
  padding: 1rem 1.5rem;
}

.header-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.25rem 0;
}

.header-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.header-value {
  font-weight: 500;
  font-size: 0.95rem;
}

.mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.1);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

/* Comparison Layout (Aligned) */
.comparison-layout {
  display: flex;
  align-items: stretch;
  gap: 1.5rem;
  width: 100%;
  height: 800px; /* 고정 높이 */
}

@media (max-width: 1100px) {
  .comparison-layout {
    flex-direction: column;
    height: auto; /* 모바일에서는 자동 높이 */
    min-height: 800px;
  }
  .flow-arrow {
    transform: rotate(90deg);
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.comparison-card {
  flex: 1;
  min-height: 0; /* flex 아이템 오버플로우 방지 */
  overflow: hidden;
}

.highlight {
  border: 2px solid var(--color-primary-light);
  box-shadow: 0 0 30px rgba(var(--color-primary-rgb), 0.15);
}

.input-comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  padding: 0.5rem;
  height: 100%;
}

.comparison-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}

.item-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-align: center;
  flex-shrink: 0;
}

.image-wrapper {
  background: transparent;
  overflow: visible;
  border: none;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: flex-start; /* 상단 정렬 */
  justify-content: center;
  height: 550px; /* 이미지 높이 고정 */
  flex-shrink: 0;
}

.image-wrapper :deep(.base-image) {
  height: 550px; /* 고정 영역 높이 */
  width: 100%;
  background: transparent;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow: visible;
}

.image-wrapper :deep(.actual-image) {
  max-height: 100%; /* 고정 높이 내에서 최대 높이 */
  max-width: 100%;
  width: auto; /* 이미지 전체를 보여주기 위해 너비 자동 */
  height: auto; /* 이미지 전체를 보여주기 위해 높이 자동 */
  object-fit: contain; /* 잘림 방지 */
  border-radius: 12px; /* 이미지 외곽선에 라운드 적용 */
  display: block;
}

.image-wrapper:hover {
  transform: translateY(-4px);
}

.image-wrapper:hover .zoom-btn {
  opacity: 1;
  transform: scale(1);
}

/* 확대 버튼 */
.zoom-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(var(--color-bg-base-rgb), 0.6);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.zoom-btn:hover {
  background: var(--color-primary);
  color: white;
  transform: scale(1.1) !important;
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
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 0 50px rgba(0,0,0,0.5);
  border-radius: 8px;
  cursor: default;
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


/* Result Display */
.result-display {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0.5rem;
}

.main-result {
  max-width: 400px;
  margin: 0 auto;
  background: transparent;
  border: none;
}

.main-result :deep(.base-image) {
  background: transparent;
}

.result-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
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
.input-section,
.failure-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* flex 오버플로우 방지 */
  overflow: hidden;
}

/* 입력/실패 섹션 내부 card-body 높이 채우기 */
.input-section :deep(.card-body),
.failure-section :deep(.card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* 실패 섹션 스타일 - 흰색 배경 */
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
</style>
