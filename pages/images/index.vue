<template>
  <div class="images-page">
    <BaseCard title="실행 결과 목록">
      <div class="image-grid">
        <div 
          v-for="(img, index) in visibleImages" 
          :key="img.requestId" 
          class="image-item glass-panel"
        >
          <div class="image-no">No. {{ index + 1 }}</div>
          <div class="image-preview" @click="goToDetail(img.requestId)">
            <BaseImage :src="img.url" alt="Result" fit="cover" />
          </div>
          <div class="image-info">
            <span class="owner">{{ img.owner }}</span>
            <span class="date">{{ new Date(img.sysModDtm).toLocaleDateString('ko-KR') }}</span>
          </div>
          <BaseButton 
            size="sm" 
            variant="outline" 
            class="view-btn"
            @click="goToDetail(img.requestId)"
          >
            상세 보기
          </BaseButton>
        </div>
      </div>

      <div v-if="hasMore" class="load-more">
        <BaseButton variant="ghost" @click="pageSize += 15">더보기</BaseButton>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ImageIcon } from 'lucide-vue-next';
import BaseCard from '~/components/ui/BaseCard.vue';
import BaseButton from '~/components/ui/BaseButton.vue';
import BaseImage from '~/components/ui/BaseImage.vue';

definePageMeta({
  title: '실행 결과 조회'
});

const config = useRuntimeConfig();
const { data: images } = await useFetch('/api/images', {
  baseURL: config.public.apiBase
});

const pageSize = ref(15);
const visibleImages = computed(() => (images.value || []).slice(0, pageSize.value));
const hasMore = computed(() => (images.value || []).length > pageSize.value);

const router = useRouter();
const goToDetail = (id: string) => {
  router.push(`/images/${id}`);
};
</script>

<style scoped>
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.image-item {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.2s;
  position: relative;
}

.image-no {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  z-index: 10;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.image-item:hover {
  transform: translateY(-4px);
}

.image-preview {
  aspect-ratio: 3/4;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
}


.image-info {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.view-btn {
  margin: 0 1rem 1rem;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 2rem;
  margin-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
</style>
