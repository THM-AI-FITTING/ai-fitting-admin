<!-- 
  AI 가상 피팅 작업 상세 페이지
  작업의 기본 정보와 결과 이미지를 보여주며, 이미지 다운로드 및 상세 리뷰 이동 기능을 제공합니다.
-->
<template>
  <div v-if="job" class="job-detail-page">
    <div class="breadcrumb">
      <BaseButton variant="ghost" size="sm" @click="$router.back()">← 목록으로 돌아가기</BaseButton>
    </div>

    <div class="detail-grid">
      <!-- Main Info -->
      <BaseCard title="작업 정보">
        <div class="info-list">
          <div class="info-item">
            <span class="label">요청 ID</span>
            <span class="value mono">{{ job.requestId }}</span>
          </div>
          <div class="info-item">
            <span class="label">상태</span>
            <StatusBadge :status="job.status" />
          </div>
          <div class="info-item">
            <span class="label">파트너</span>
            <span class="value">{{ job.owner }}</span>
          </div>
          <div class="info-item">
            <span class="label">사용자 ID</span>
            <span class="value">{{ job.userId }}</span>
          </div>
        </div>
      </BaseCard>

      <!-- Result Image -->
      <BaseCard v-if="job.status === 'DONE' && job.url" title="결과 이미지">
        <div class="result-image-container">
          <img :src="job.url" alt="Fitting Result" class="result-image" />
          <div class="image-actions">
            <BaseButton variant="primary" size="sm" @click="downloadImage(job.url)">
              이미지 다운로드
            </BaseButton>
            <NuxtLink :to="`/images/${job.requestId}`">
              <BaseButton variant="ghost" size="sm">
                상세보기
              </BaseButton>
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
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.result-image-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-image {
  width: auto;
  max-width: 100%;
  max-height: 400px; /* Constrain height for FHD fit */
  border-radius: var(--radius-lg);
  display: block;
  margin: 0 auto;
  border: 1px solid var(--color-border);
}

.image-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}


.info-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.value {
  font-weight: 500;
}

.mono {
  font-family: monospace;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.text-sm {
  font-size: 0.85rem;
}

.value-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.link-btn {
  color: var(--color-primary);
  font-size: 0.9rem;
}

.link-btn:hover {
  text-decoration: underline;
}

.error-box {
  margin-top: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-md);
  padding: 1rem;
}

.error-label {
  color: var(--color-danger);
  font-weight: 600;
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.error-text {
  margin: 0;
  color: #fca5a5;
}
</style>
