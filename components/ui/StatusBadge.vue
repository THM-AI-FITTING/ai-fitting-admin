<!-- 
  상태 표시 배지 컴포넌트
  작업의 상태(DONE, START, FAILED 등)를 유색 배지와 텍스트로 표시합니다.
-->
<template>
  <span :class="['status-badge', status.toLowerCase()]">
    <span class="dot"></span>
    {{ label || status }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  status: string;
  label?: string;
}>();
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* Status Variants */
.active, .done {
  background: rgba(16, 185, 129, 0.15);
  color: var(--color-success);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.inactive, .failed {
  background: rgba(239, 68, 68, 0.15);
  color: var(--color-danger);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.start, .pending, .processing {
  background: rgba(99, 102, 241, 0.15);
  color: var(--color-primary);
  border: 1px solid rgba(99, 102, 241, 0.3);
}
</style>
