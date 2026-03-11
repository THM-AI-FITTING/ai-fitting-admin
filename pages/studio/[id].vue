<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

onMounted(() => {
  const id = route.params.id;
  if (id) {
    router.replace(`/studio/upload?groupId=${id}`);
  } else {
    router.replace('/studio/upload');
  }
});

definePageMeta({ title: '스튜디오 작업 상세 (이동 중...)' });
</script>

<template>
  <div class="redirect-container">
    <div class="loader"></div>
    <p>상세 화면으로 이동 중입니다...</p>
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
  border: 4px solid #f3f3f3;
  border-top: 4px solid #111;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
