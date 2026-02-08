<template>
  <div class="base-image" :class="{ 'has-error': hasError || !src }">
    <div v-if="!src || hasError" class="image-placeholder">
      <ImageIcon :size="placeholderSize" />
      <span class="placeholder-text">{{ fallbackText }}</span>
    </div>
    <div v-else class="image-wrapper">
      <img 
        :src="src" 
        :alt="alt" 
        :style="{ objectFit: fit }"
        class="actual-image"
        @error="handleError"
      />
      <BaseButton 
        v-if="showZoom" 
        class="zoom-btn" 
        variant="ghost" 
        size="sm"
        @click.stop="$emit('zoom', src)"
        title="이미지 확대"
      >
        <Search :size="18" />
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ImageIcon, Search } from 'lucide-vue-next';

interface Props {
  src?: string | null;
  alt?: string;
  fit?: 'cover' | 'contain';
  placeholderSize?: number;
  fallbackText?: string;
  showZoom?: boolean;
  zoomIconSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  src: null,
  alt: 'Image',
  fit: 'cover',
  placeholderSize: 32,
  fallbackText: '이미지 없음',
  showZoom: false,
  zoomIconSize: 18
});

defineEmits(['zoom']);

const hasError = ref(false);

const handleError = () => {
  hasError.value = true;
};
</script>

<style scoped>
.base-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 12px; /* 전체 둥근 모서리 추가 */
}

.image-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  max-height: 100%;
}

.actual-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  display: block;
  border-radius: 12px; /* 실제 이미지에도 라운딩 적용 */
}

.zoom-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 38px;
  height: 38px;
  min-width: 38px;
  padding: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.15) !important;
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: white !important;
  display: flex !important; /* 중앙 정렬 강제 */
  align-items: center !important;
  justify-content: center !important;
  opacity: 0;
  transform: scale(0.9) translateY(5px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

/* BaseButton 내부 콘텐츠 정중앙 정렬 보정 */
.zoom-btn :deep(.content) {
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.image-wrapper:hover .zoom-btn {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.zoom-btn:hover {
  background: rgba(255, 255, 255, 0.8) !important;
  color: #0284c7 !important;
  transform: scale(1.1) !important;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.6) !important;
}

:root[data-theme="dark"] .zoom-btn {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.05);
}

:root[data-theme="dark"] .zoom-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #0f172a;
}
</style>
