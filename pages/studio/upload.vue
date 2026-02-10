<template>
  <div class="studio-upload-page">
    <div class="upload-grid animate-fade-in stagger-1">
      <!-- Image Upload Section -->
      <BaseCard class="upload-card">
        <template #header>
          <div class="card-header">
            <h3 class="card-title">의상 사진 업로드</h3>
            <p class="card-subtitle">전면 사진은 필수이며, 후면 사진 업로드 시 추가 포즈가 활성화됩니다.</p>
          </div>
        </template>

        <div class="upload-areas">
          <!-- Front Photo -->
          <div class="upload-item">
            <label class="upload-label">전면 의상 사진 (필수)</label>
            <div 
              class="drop-zone" 
              :class="{ 'has-image': frontImage }"
              @click="$refs.frontInput.click()"
            >
              <input 
                type="file" 
                ref="frontInput" 
                hidden 
                accept="image/*" 
                @change="handleFileUpload($event, 'front')"
              >
              <template v-if="frontImage">
                <img :src="frontImage" class="preview-img" alt="Front Preview">
                <button class="remove-btn" @click.stop="frontImage = null">
                  <X :size="16" />
                </button>
              </template>
              <div v-else class="upload-placeholder">
                <Upload :size="32" />
                <span>사진을 선택하거나 드래그하세요</span>
              </div>
            </div>
          </div>

          <!-- Back Photo -->
          <div class="upload-item">
            <label class="upload-label">후면 의상 사진 (선택)</label>
            <div 
              class="drop-zone" 
              :class="{ 'has-image': backImage }"
              @click="$refs.backInput.click()"
            >
              <input 
                type="file" 
                ref="backInput" 
                hidden 
                accept="image/*" 
                @change="handleFileUpload($event, 'back')"
              >
              <template v-if="backImage">
                <img :src="backImage" class="preview-img" alt="Back Preview">
                <button class="remove-btn" @click.stop="backImage = null">
                  <X :size="16" />
                </button>
              </template>
              <div v-else class="upload-placeholder">
                <Upload :size="32" />
                <span>사진을 선택하거나 드래그하세요</span>
              </div>
            </div>
          </div>
        </div>

        <div class="upload-footer">
          <BaseButton 
            variant="primary" 
            size="lg" 
            block 
            :disabled="!frontImage"
            :loading="generating"
            @click="generatePoses"
          >
            <Sparkles :size="20" />
            {{ frontImage && backImage ? '4개 포즈 생성하기' : '2개 포즈 생성하기' }}
          </BaseButton>
        </div>
      </BaseCard>

      <!-- Pose Guide Section -->
      <BaseCard class="guide-card">
        <template #header>
          <div class="card-header">
            <h3 class="card-title">포즈 가이드</h3>
            <span class="badge" :class="backImage ? 'badge-success' : 'badge-warning'">
              {{ backImage ? '모든 포즈 가능' : '전면 포즈만 가능' }}
            </span>
          </div>
        </template>

        <div class="guide-grid">
          <div 
            v-for="pose in poses" 
            :key="pose.id" 
            class="pose-item"
            :class="{ disabled: pose.type === 'back' && !backImage }"
          >
            <div class="pose-thumb">
              <div class="pose-overlay" v-if="pose.type === 'back' && !backImage">
                <Lock :size="24" />
                <span>후면 사진 필요</span>
              </div>
              <!-- Pose Placeholder Silhouette -->
              <div class="silhouette-placeholder">
                <User :size="48" class="silhouette-icon" />
              </div>
              <div class="pose-label">{{ pose.id }}</div>
            </div>
            <div class="pose-info">
              <span class="pose-name">{{ pose.name }}</span>
              <span class="pose-desc">{{ pose.desc }}</span>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Result Section (Mock) -->
    <Transition name="fade-slide">
      <div v-if="showResults" class="results-section animate-fade-in">
        <div class="section-header">
          <h2 class="section-title">생성 결과</h2>
          <BaseButton variant="ghost" @click="downloadAll">
            <Download :size="18" />
            전체 다운로드 (.zip)
          </BaseButton>
        </div>

        <div class="results-grid">
          <div v-for="res in results" :key="res.id" class="result-card glass-panel">
            <div class="result-img-wrapper">
              <BaseImage :src="res.url" :alt="res.id" />
              <div class="result-tag">{{ res.id }}</div>
            </div>
            <div class="result-actions">
              <BaseButton size="sm" variant="ghost" title="다운로드">
                <Download :size="16" />
              </BaseButton>
              <BaseButton size="sm" variant="ghost" title="확대보기">
                <MaximizeIcon :size="16" />
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Upload, X, Sparkles, Download, MaximizeIcon, User, Lock } from 'lucide-vue-next';
import BaseCard from '~/components/ui/BaseCard.vue';
import BaseButton from '~/components/ui/BaseButton.vue';
import BaseImage from '~/components/ui/BaseImage.vue';

definePageMeta({
  title: '스튜디오 업로드'
});

const frontImage = ref<string | null>(null);
const backImage = ref<string | null>(null);
const generating = ref(false);
const showResults = ref(false);

const poses = [
  { id: 'Pose A', name: '정면 기본', desc: '모델이 정면을 응시하는 기본 포즈', type: 'front' },
  { id: 'Pose B', name: '정면 측면', desc: '몸을 약간 틀어 역동성을 준 포즈', type: 'front' },
  { id: 'Pose C', name: '후면 기본', desc: '뒷모습을 보여주는 기본 포즈', type: 'back' },
  { id: 'Pose D', name: '후면 디테일', desc: '등판 디테일을 강조한 포즈', type: 'back' },
];

const handleFileUpload = (event: Event, type: 'front' | 'back') => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'front') frontImage.value = e.target?.result as string;
      else backImage.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const generatePoses = () => {
  generating.value = true;
  // 시뮬레이션
  setTimeout(() => {
    generating.value = false;
    showResults.value = true;
  }, 2000);
};

const results = computed(() => {
  const list = [
    { id: 'Pose A', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400' },
    { id: 'Pose B', url: 'https://images.unsplash.com/photo-1539109132304-391e55030f9a?w=400' },
  ];
  
  if (backImage.value) {
    list.push(
      { id: 'Pose C', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400' },
      { id: 'Pose D', url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400' }
    );
  }
  
  return list;
});

const downloadAll = () => {
  alert('준비 중인 기능입니다.');
};
</script>

<style scoped>
.studio-upload-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding-bottom: 3rem;
}

.upload-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .upload-grid {
    grid-template-columns: 1fr;
  }
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
}

.card-subtitle {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.badge {
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.badge-warning {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.upload-areas {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
}

.upload-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.upload-label {
  font-size: 0.9rem;
  font-weight: 600;
}

.drop-zone {
  aspect-ratio: 16/9;
  border: 4px dashed var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  transition: all 0.2s;
}

.drop-zone:hover {
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.05);
}

.drop-zone.has-image {
  border-style: solid;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: var(--color-bg-main);
}

.remove-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.guide-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  padding: 1.5rem;
}

.pose-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pose-item.disabled {
  opacity: 0.5;
}

.pose-thumb {
  aspect-ratio: 3/4;
  background: var(--color-bg-main);
  border-radius: var(--radius-md);
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.silhouette-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.1), rgba(var(--color-primary-rgb), 0.02));
}

.silhouette-icon {
  opacity: 0.2;
}

.pose-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.pose-label {
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

.pose-info {
  display: flex;
  flex-direction: column;
}

.pose-name {
  font-size: 0.95rem;
  font-weight: 600;
}

.pose-desc {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.results-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 800;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
}

.result-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
}

.result-img-wrapper {
  aspect-ratio: 3/4;
  position: relative;
}

.result-tag {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  color: white;
  padding: 20px 15px 10px;
  font-weight: 700;
}

.result-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0.75rem 1rem;
  gap: 0.5rem;
  background: var(--color-bg-surface);
}

.upload-footer {
  padding: 0 1.5rem 1.5rem;
}
</style>
