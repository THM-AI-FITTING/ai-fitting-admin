<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

onMounted(() => {
  const id = route.params.id;
  if (id) {
    router.replace(`/muse/create?id=${id}`);
  } else {
    router.replace('/muse');
  }
});

definePageMeta({
  title: '뮤즈 미세조정 (이동 중...)'
});
</script>

<template>
  <div class="redirect-container">
    <div class="loader"></div>
    <p>스튜디오 상세 화면으로 이동 중입니다...</p>
  </div>
</template>

<style scoped>
.redirect-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: 1rem;
}
.loader {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
