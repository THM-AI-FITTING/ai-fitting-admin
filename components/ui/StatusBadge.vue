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
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.inactive, .failed {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.start, .pending {
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-primary);
  border: 1px solid rgba(99, 102, 241, 0.2);
}
</style>
