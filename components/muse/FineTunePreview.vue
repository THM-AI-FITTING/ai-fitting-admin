<template>
  <div class="fine-tune-preview glass-panel">
    <div class="pv-header">
      <div class="pv-title">
        <span class="status-dot pulsed"></span>
        AI Real-time Preview
      </div>
      <div class="pv-actions">
        <button 
          :class="['action-btn', { active: compareMode === 'side' }]"
          @click="toggleCompare('side')"
          title="Side-by-Side 비교"
        >
          <Columns2 :size="18" />
        </button>
        <button 
          :class="['action-btn', { active: compareMode === 'split' }]"
          @click="toggleCompare('split')"
          title="Split-View 비교"
        >
          <PanelLeft :size="18" />
        </button>
      </div>
    </div>

    <div class="viewer-container" ref="containerRef">
      <!-- Compare Mode: Side-by-Side -->
      <div v-if="compareMode === 'side'" class="compare-side">
        <div class="img-box">
          <img :src="originalUrl" alt="Original" class="main-img" />
          <span class="img-label">Before</span>
        </div>
        <div class="img-box">
          <img :src="currentUrl" alt="Current" class="main-img" />
          <span class="img-label">After</span>
        </div>
      </div>

      <!-- Compare Mode: Split-View -->
      <div v-else-if="compareMode === 'split'" class="compare-split" @mousemove="handleSplitMove" @touchmove="handleSplitMove">
        <img :src="currentUrl" alt="Current" class="main-img" />
        <div class="split-overlay" :style="{ width: splitPos + '%' }">
          <img :src="originalUrl" alt="Original" class="main-img-overlay" />
        </div>
        <div class="split-divider" :style="{ left: splitPos + '%' }">
          <div class="handle"></div>
        </div>
        <span class="img-label left">Original</span>
        <span class="img-label right">Edited</span>
      </div>

      <!-- Single View -->
      <div v-else class="single-view">
        <img :src="currentUrl" alt="Current" class="main-img" />
      </div>

      <!-- Loading Overlay -->
      <div v-if="isGenerating" class="generating-overlay">
        <div class="loader-circle"></div>
        <p>나노바나나 AI 엔진 처리 중...</p>
      </div>
    </div>

    <div class="pv-footer">
      <p class="stats">Resolution: 1024x1024 | Model: Nano Banana 2.1</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Columns2, PanelLeft } from 'lucide-vue-next';

const props = defineProps({
  originalUrl: { type: String, required: true },
  currentUrl: { type: String, required: true },
  isGenerating: { type: Boolean, default: false }
});

const compareMode = ref<null | 'side' | 'split'>(null);
const splitPos = ref(50);
const containerRef = ref<HTMLElement | null>(null);

const toggleCompare = (mode: 'side' | 'split') => {
  if (compareMode.value === mode) {
    compareMode.value = null;
  } else {
    compareMode.value = mode;
  }
};

const handleSplitMove = (e: MouseEvent | TouchEvent) => {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  let pos = ((clientX - rect.left) / rect.width) * 100;
  if (pos < 5) pos = 5;
  if (pos > 95) pos = 95;
  splitPos.value = pos;
};
</script>

<style scoped>
.fine-tune-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.pv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.pv-title {
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0,0,0,0.3);
  padding: 4px 12px;
  border-radius: 20px;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
}

.status-dot.pulsed {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.action-btn {
  background: transparent;
  border: none;
  color: var(--color-text-main);
  opacity: 0.5;
  cursor: pointer;
  transition: all 0.2s;
  padding: 6px;
  border-radius: 6px;
}

.action-btn:hover {
  opacity: 1;
  background: rgba(255,255,255,0.05);
}

.action-btn.active {
  opacity: 1;
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.1);
}

/* Viewer Container */
.viewer-container {
  flex: 1;
  background: #000;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-img {
  width: auto;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
}

.img-label {
  position: absolute;
  top: 1rem;
  background: rgba(0,0,0,0.5);
  color: #fff;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 0.7rem;
  text-transform: uppercase;
  z-index: 5;
}

/* Side-by-Side */
.compare-side {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  height: 100%;
  gap: 2px;
}

.img-box {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #0a0a0a;
}

.img-box .img-label {
  left: 50%;
  transform: translateX(-50%);
}

/* Split-View */
.compare-split {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.split-overlay {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  overflow: hidden;
  border-right: 1px solid rgba(255,255,255,0.2);
}

.main-img-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.split-divider {
  position: absolute;
  top: 0;
  height: 100%;
  width: 2px;
  background: #fff;
  pointer-events: none;
  z-index: 10;
}

.split-divider .handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 15px rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.split-divider .handle::after {
  content: '↔';
  color: #000;
  font-weight: bold;
}

.img-label.left { left: 1rem; }
.img-label.right { right: 1rem; }

/* Overlay */
.generating-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  z-index: 20;
}

.loader-circle {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255,255,255,0.1);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.pv-footer {
  padding: 0.75rem 0 0;
  text-align: center;
}

.stats {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
</style>
