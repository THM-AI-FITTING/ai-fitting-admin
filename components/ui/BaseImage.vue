<template>
  <div class="base-image" :class="{ 'has-error': hasError || !src, 'no-radius': !rounded }">
    <div v-if="!src || hasError" class="image-placeholder">
      <div class="placeholder-icon-wrapper">
        <ImageOff :size="placeholderSize * 1.2" class="placeholder-icon" />
      </div>
      <span class="placeholder-text">{{ hasError ? '이미지 로드 실패' : fallbackText }}</span>
    </div>
    <div v-else class="image-wrapper">
      <div class="inner-image-wrapper">
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ImageOff, Search } from 'lucide-vue-next';

interface Props {
  src?: string | null;
  alt?: string;
  fit?: 'cover' | 'contain';
  placeholderSize?: number;
  fallbackText?: string;
  showZoom?: boolean;
  zoomIconSize?: number;
  rounded?: boolean; // Prop to control border radius
}

const props = withDefaults(defineProps<Props>(), {
  src: null,
  alt: 'Image',
  fit: 'cover',
  placeholderSize: 32,
  fallbackText: '이미지 없음',
  showZoom: false,
  zoomIconSize: 18,
  rounded: true // Standalone images are rounded by default
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
  position: relative;
  border-radius: 12px;
}

.base-image.no-radius {
  border-radius: 0;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-bg-alt) 0%, var(--color-bg-main) 100%);
  color: var(--color-text-muted);
}

.placeholder-icon-wrapper {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--color-primary-rgb), 0.05);
  border-radius: 50%;
  color: var(--color-primary);
  opacity: 0.6;
}

.placeholder-text {
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  opacity: 0.7;
}

.image-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.inner-image-wrapper {
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
  display: block;
  object-fit: inherit;
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
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: white !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  opacity: 0;
  transform: scale(0.9) translateY(5px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

@media (max-width: 768px) {
  .zoom-btn {
    opacity: 1 !important;
    transform: scale(1) translateY(0) !important;
  }
}

.image-wrapper:hover .zoom-btn {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.zoom-btn:hover {
  background: white !important;
  color: var(--color-primary) !important;
  transform: scale(1.1) !important;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

:root[data-theme="dark"] .image-placeholder {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
}

:root[data-theme="dark"] .placeholder-icon-wrapper {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-muted);
}
</style>
