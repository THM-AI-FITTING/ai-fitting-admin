<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from '~/composables/useTheme';

const { theme } = useTheme();

// 전역 테마 동기화: 모든 페이지(로그인 포함)에서 body class를 관리합니다.
useHead({
  bodyAttrs: {
    class: computed(() => theme.value === 'light' ? 'light-mode' : '')
  }
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
