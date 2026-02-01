<!-- 
  공통 버튼(Button) 컴포넌트
  다양한 크기(sm, md, lg)와 스타일(primary, outline, ghost 등)을 지원합니다.
  로딩 상태 표시 및 아이콘 삽입이 가능합니다.
-->
<template>
  <button 
    :class="[
      'base-btn', 
      `btn-${variant}`, 
      `btn-${size}`,
      { 'is-loading': loading, 'is-disabled': disabled }
    ]"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <span v-if="loading" class="spinner"></span>
    <span v-else class="content">
      <component v-if="icon" :is="icon" :size="iconSize" class="btn-icon" />
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const props = withDefaults(defineProps<{
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: Component;
}>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false
});

const iconSize = computed(() => {
  switch (props.size) {
    case 'sm': return 16;
    case 'lg': return 20;
    default: return 18;
  }
});
</script>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Sizes */
.btn-sm {
  height: 32px;
  padding: 0 0.75rem;
  font-size: 0.875rem;
}

.btn-md {
  height: 40px;
  padding: 0 1rem;
  font-size: 0.95rem;
}

.btn-lg {
  height: 48px;
  padding: 0 1.5rem;
  font-size: 1.125rem;
}

/* Variants */
.btn-primary {
  background: var(--gradient-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}
.btn-primary:not(:disabled):hover {
  filter: brightness(1.1);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
}

.btn-secondary {
  background: var(--color-bg-surface);
  color: var(--color-text-main);
  border: 1px solid var(--color-border);
}
.btn-secondary:not(:disabled):hover {
  background: rgba(0, 0, 0, 0.05);
  border-color: var(--color-text-muted);
}

.btn-outline {
  background: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}
.btn-outline:not(:disabled):hover {
  background: rgba(99, 102, 241, 0.1);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}
.btn-danger:not(:disabled):hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn-ghost {
  background: transparent;
  color: var(--color-text-muted);
}
.btn-ghost:not(:disabled):hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-text-main);
}

/* Loading Spinner */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
