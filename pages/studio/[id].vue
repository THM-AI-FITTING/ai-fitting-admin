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
        
        <div class="slider-container-mobile">
          <div class="horizontal-slider" ref="inputSlider">
            <div class="scroll-spacer mobile-only"></div>
            <div v-for="(input, idx) in mockData.inputs" :key="idx" class="product-card glass-panel">
              <div class="product-thumb-vertical">
                <BaseImage :src="input.url" :alt="input.type" />
                <div class="product-tag">{{ input.type }}</div>
              </div>
            </div>
            <div class="scroll-spacer mobile-only"></div>
          </div>
          
          <!-- 슬라이드 인디케이터 (모바일 전용) -->
          <div class="mobile-slide-indicator">
            <div class="indicator-track">
              <div class="indicator-bar" :style="{ width: `${inputScroll.barWidth}%`, left: `${inputScroll.progress}%` }"></div>
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

        <div class="slider-container-mobile">
          <div class="horizontal-slider" ref="resultSlider">
            <div class="scroll-spacer mobile-only"></div>
            <div v-for="res in mockData.results" :key="res.pose" class="result-item glass-panel">
              <div class="result-thumb-vertical">
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
            <div class="scroll-spacer mobile-only"></div>
          </div>

          <!-- 슬라이드 인디케이터 (모바일 전용) -->
          <div class="mobile-slide-indicator">
            <div class="indicator-track">
              <div class="indicator-bar" :style="{ width: `${resultScroll.barWidth}%`, left: `${resultScroll.progress}%` }"></div>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
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

// Scroll Logic for Mobile Sliders
const inputSlider = ref<HTMLElement | null>(null);
const resultSlider = ref<HTMLElement | null>(null);

const inputScroll = reactive({ progress: 0, barWidth: 50 });
const resultScroll = reactive({ progress: 0, barWidth: 25 });

const handleScroll = (el: HTMLElement, state: { progress: number, barWidth: number }) => {
  const scrollWidth = el.scrollWidth;
  const clientWidth = el.clientWidth;
  
  if (scrollWidth <= clientWidth) {
    state.barWidth = 100;
    state.progress = 0;
    return;
  }
  
  const ratio = clientWidth / scrollWidth;
  state.barWidth = ratio * 100;

  const maxScroll = scrollWidth - clientWidth;
  const scrollLeft = el.scrollLeft;
  const maxLeft = 100 - state.barWidth;

  const progressRatio = scrollLeft / maxScroll;
  state.progress = Math.max(0, Math.min(progressRatio * maxLeft, maxLeft));
};

onMounted(() => {
  if (inputSlider.value) {
    inputSlider.value.addEventListener('scroll', () => handleScroll(inputSlider.value!, inputScroll));
    setTimeout(() => handleScroll(inputSlider.value!, inputScroll), 100);
  }
  if (resultSlider.value) {
    resultSlider.value.addEventListener('scroll', () => handleScroll(resultSlider.value!, resultScroll));
    setTimeout(() => handleScroll(resultSlider.value!, resultScroll), 100);
  }
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
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

.product-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.product-thumb-vertical {
  aspect-ratio: 3/4;
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

.result-thumb-vertical {
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
}

.mobile-only {
  display: none;
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
    grid-template-columns: 1fr 1fr;
  }
}

/* PC Grid Styles */
.horizontal-slider {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  width: 100%;
}

@media (max-width: 1280px) {
  .horizontal-slider {
    grid-template-columns: repeat(2, 1fr);
  }
}

.product-thumb-vertical, .result-thumb-vertical {
  aspect-ratio: 3/4;
  position: relative;
  background: var(--color-bg-main);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem; /* PC Padding */
  overflow: hidden;
  border-radius: var(--radius-md);
}

.product-thumb-vertical img, .result-thumb-vertical img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Mobile Styles */
@media (max-width: 640px) {
  .horizontal-slider {
    display: flex !important;
    gap: 1rem !important;
    scrollbar-width: none !important;
    -webkit-overflow-scrolling: touch;
    overflow-x: auto !important;
    scroll-snap-type: x mandatory !important;
    width: 100% !important;
    scroll-behavior: smooth;
    grid-template-columns: none; /* Reset grid */
  }

  .horizontal-slider::-webkit-scrollbar {
    display: none;
  }

  .mobile-only {
    display: block !important;
  }
  
  .scroll-spacer {
    flex: 0 0 15vw !important;
    width: 15vw !important;
    min-width: 15vw !important;
  }

  .product-card, .result-item {
    flex: 0 0 70vw !important;
    width: 70vw !important;
    min-width: 70vw !important;
    scroll-snap-align: center;
    border-radius: 28px;
    margin: 0;
  }

  .product-thumb-vertical, .result-thumb-vertical {
    padding: 0 !important; /* Mobile Full Fill */
    max-height: 48vh !important;
  }

  .product-thumb-vertical img, .result-thumb-vertical img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }

  .mobile-slide-indicator {
    position: absolute;
    bottom: 1.2rem;
    left: 0;
    width: 100%;
    z-index: 10;
  }

  .indicator-track {
    width: 70vw;
    height: 4px;
    background: rgba(var(--color-primary-rgb), 0.1);
    border-radius: 4px;
    margin: 0 auto;
    overflow: hidden;
    position: relative;
  }

  .indicator-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), #818cf8);
    border-radius: 4px;
    position: absolute;
    top: 0;
    transition: left 0.1s linear;
  }
}
</style>
