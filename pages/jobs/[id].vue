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
              <BaseImage :src="job.personUrl" alt="Person" fit="contain" />
            </div>
          </div>
          <div v-if="job.productUrl" class="comparison-item">
            <span class="item-label">대상 상품</span>
            <div class="image-wrapper">
              <BaseImage :src="job.productUrl" alt="Product" fit="contain" />
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Flow Arrow (Visible on desktop) -->
      <div class="flow-arrow" v-if="job.status === 'DONE'">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </div>

      <BaseCard v-if="job.status === 'DONE' && job.url" title="가상 피팅 결과" class="comparison-card result-section highlight">
        <div class="result-display">
          <div class="image-wrapper main-result">
            <BaseImage :src="job.url" alt="Result" fit="contain" />
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
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

/**
 * 작업을 완료한 결과 이미지를 브라우저에서 다운로드합니다.
 */
const downloadImage = (url: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = `fitting-result-${route.params.id}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
  align-items: stretch; /* Cards will have the same height */
  gap: 1.5rem;
  width: 100%;
}

@media (max-width: 1100px) {
  .comparison-layout {
    flex-direction: column;
  }
  .flow-arrow {
    transform: rotate(90deg);
  }
}

.comparison-card {
  flex: 1;
  height: 100%;
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
}

.comparison-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-align: center;
}

.image-wrapper {
  background: transparent;
  border-radius: var(--radius-lg);
  overflow: visible;
  border: none;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  aspect-ratio: 3/4;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 380px;
  width: 100%;
}

.image-wrapper :deep(.base-image) {
  background: transparent;
}

.image-wrapper:hover {
  transform: translateY(-4px);
}

/* Flow Arrow */
.flow-arrow {
  color: var(--color-text-muted);
  opacity: 0.3;
  display: flex;
  align-items: center;
  padding-top: 2rem; /* Align with image centerish */
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
</style>
