<template>
  <div class="base-image" :class="{ 'has-error': hasError || !src }">
    <div v-if="!src || hasError" class="image-placeholder">
      <ImageIcon :size="placeholderSize" />
      <span class="placeholder-text">{{ fallbackText }}</span>
    </div>
    <img 
      v-else
      :src="src" 
      :alt="alt" 
      :style="{ objectFit: fit }"
      class="actual-image"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ImageIcon } from 'lucide-vue-next';

interface Props {
  src?: string | null;
  alt?: string;
  fit?: 'cover' | 'contain';
  placeholderSize?: number;
  fallbackText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  src: null,
  alt: 'Image',
  fit: 'cover',
  placeholderSize: 32,
  fallbackText: '이미지 없음'
});

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
}

.actual-image {
  width: 100%;
  height: 100%;
  transition: opacity 0.3s;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  width: 100%;
  height: 100%;
  background: var(--color-bg-alt);
}

.placeholder-text {
  font-size: 0.8rem;
}
</style>
