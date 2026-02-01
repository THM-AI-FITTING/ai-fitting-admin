<!-- 
  공통 카드(Card) 컴포넌트
  콘텐츠를 감싸는 유리 질감(Glassmorphism) 스타일의 컨테이너입니다. 
  헤더, 바디, 푸터 슬롯을 지원합니다.
-->
<template>
  <div class="glass-panel base-card">
    <div v-if="$slots.header || title" class="card-header">
      <h3 v-if="title" class="card-title">{{ title }}</h3>
      <slot name="header" />
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<style scoped>
.base-card {
  padding: 0;
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
}

.card-body {
  padding: 1.5rem;
}

.card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-border);
  background: rgba(0, 0, 0, 0.05);
}
</style>
