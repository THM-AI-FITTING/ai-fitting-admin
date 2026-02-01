<!-- 
  이미지 상세 리뷰 페이지
  고해상도 이미지를 화면 전체에 꽉 차게 보여주며,Presigned URL의 유효 시간 정보를 제공합니다.
-->
<template>
  <div class="image-detail-page">
    <div class="breadcrumb">
      <BaseButton variant="ghost" size="sm" @click="$router.back()">← 뒤로가기</BaseButton>
    </div>

    <div class="preview-container glass-panel">
      <div v-if="pending" class="loading">
        <span class="spinner"></span>
        이미지 URL 생성 중...
      </div>
      
      <div v-else-if="error" class="error">
        이미지를 불러올 수 없습니다.
      </div>
      
      <img 
        v-else 
        :src="data.url" 
        class="result-image" 
        alt="Result" 
      />
      
      <div class="actions-bar">
        <div class="info">
          <h3>결과 이미지: {{ $route.params.id }}</h3>
          <span class="expires">URL은 1시간 동안 유효합니다.</span>
        </div>
        
        <BaseButton icon="Download" @click="download">
          다운로드 (새창)
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Download } from 'lucide-vue-next';
import BaseButton from '~/components/ui/BaseButton.vue';

definePageMeta({
  title: '이미지 리뷰'
});

// 라우트 파라미터에서 ID를 가져와 이미지 전용 Presigned URL을 요청합니다.
const route = useRoute();
const { data, pending, error } = await useFetch(`/api/images/${route.params.id}/url`);

/**
 * 이미지를 원래 크기로 확인하거나 저장하기 위해 새 탭에서 엽니다.
 */
const download = () => {
  if (data.value?.url) {
    window.open(data.value.url, '_blank');
  }
};
</script>

<style scoped>
.image-detail-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: calc(100vh - 140px);
}

.preview-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  background: black;
  overflow: hidden;
}

.result-image {
  max-width: 100%;
  max-height: calc(100% - 80px);
  object-fit: contain;
}

.actions-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info h3 {
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.expires {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--color-primary);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
