<template>
  <div class="studio-detail-page">
    <!-- Header -->
    <div class="detail-header animate-fade-in stagger-1">
      <BaseButton variant="ghost" size="sm" @click="router.back()">
        <ArrowLeft :size="18" />
        목록으로 돌아가기
      </BaseButton>
      <div class="header-main">
        <div class="header-titles">
          <h2 class="job-id">{{ jobId }}</h2>
          <h1 class="job-name">{{ mockData.name }}</h1>
        </div>
        <StatusBadge :status="mockData.status" />
      </div>
    </div>

    <!-- Main Content -->
    <div class="detail-content animate-fade-in stagger-2">
      <!-- Input Products Section -->
      <BaseCard class="section-card">
        <template #header>
          <div class="card-header">
            <h3 class="card-title">의상 원본 사진</h3>
            <span class="card-count">{{ mockData.inputs.length }} Images</span>
          </div>
        </template>
        
        <div class="products-grid">
          <div v-for="(input, idx) in mockData.inputs" :key="idx" class="product-card glass-panel">
            <div class="product-thumb">
              <BaseImage :src="input.url" :alt="input.type" />
              <div class="product-tag">{{ input.type }}</div>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Generation Results Section -->
      <BaseCard class="section-card">
        <template #header>
          <div class="card-header">
            <h3 class="card-title">생성 결과물 (A, B, C, D)</h3>
            <div class="header-actions">
              <BaseButton variant="ghost" size="sm">
                <Download :size="16" />
                전체 다운로드
              </BaseButton>
            </div>
          </div>
        </template>

        <div class="results-grid">
          <div v-for="res in mockData.results" :key="res.pose" class="result-item glass-panel">
            <div class="result-thumb">
              <BaseImage :src="res.url" :alt="res.pose" />
              <div class="pose-tag">{{ res.pose }}</div>
            </div>
            <div class="result-info">
              <span class="pose-name">{{ res.name }}</span>
              <div class="result-btns">
                <BaseButton size="sm" variant="ghost">
                  <Download :size="14" />
                </BaseButton>
                <BaseButton size="sm" variant="ghost">
                  <Maximize :size="14" />
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Download, Maximize } from 'lucide-vue-next';
import BaseCard from '~/components/ui/BaseCard.vue';
import BaseButton from '~/components/ui/BaseButton.vue';
import BaseImage from '~/components/ui/BaseImage.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';

const route = useRoute();
const router = useRouter();
const jobId = route.params.id as string;

definePageMeta({
  title: '스튜디오 작업 상세'
});

const mockData = {
  name: '베이직 오버핏 맨투맨',
  status: 'DONE',
  inputs: [
    { type: 'FRONT', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600' },
    { type: 'BACK', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600' },
  ],
  results: [
    { pose: 'Pose A', name: '정면 기본', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600' },
    { pose: 'Pose B', name: '정면 측면', url: 'https://images.unsplash.com/photo-1539109132304-391e55030f9a?w=600' },
    { pose: 'Pose C', name: '후면 기본', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600' },
    { pose: 'Pose D', name: '후면 디테일', url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600' },
  ]
};
</script>

<style scoped>
.studio-detail-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 3rem;
}

.detail-header {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.header-main {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.job-id {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-primary);
  font-family: monospace;
  margin-bottom: 0.25rem;
}

.job-name {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
}

.card-count {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 8px;
  border-radius: 99px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

.product-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.product-thumb {
  aspect-ratio: 16/10;
  position: relative;
  background: var(--color-bg-main);
}

.product-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

.result-item {
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
}

.result-thumb {
  aspect-ratio: 3/4;
  position: relative;
  background: var(--color-bg-main);
}

.pose-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  background: var(--color-primary);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
}

.result-info {
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-bg-surface);
}

.pose-name {
  font-size: 0.9rem;
  font-weight: 600;
}

.result-btns {
  display: flex;
  gap: 0.25rem;
}

@media (max-width: 640px) {
  .job-name {
    font-size: 1.5rem;
  }
  
  .products-grid, .results-grid {
    padding: 1rem;
    gap: 1rem;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
