<!-- 
  공통 입력 필드(Input) 컴포넌트
  라벨, 아이콘, 포커스 효과를 지원하며 v-model로 양방향 바인딩이 가능합니다.
-->
<template>
  <div class="base-input-wrapper">
    <label v-if="label" class="input-label">{{ label }}</label>
    <div class="input-container" :class="{ 'has-icon': !!icon, 'is-focused': isFocused }">
      <component v-if="icon" :is="icon" class="input-icon" size="18" />
      <input 
        v-bind="$attrs"
        v-model="modelValue"
        class="base-input"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Component } from 'vue';

const props = defineProps<{
  label?: string;
  icon?: Component;
  modelValue?: string | number;
}>();

const emit = defineEmits(['update:modelValue']);

const modelValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const isFocused = ref(false);
</script>

<style scoped>
.base-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.input-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--color-bg-main);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.input-container:hover {
  border-color: var(--color-text-muted);
}

.input-container.is-focused {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: var(--color-text-muted);
}

.base-input {
  width: 100%;
  height: 40px;
  background: transparent;
  border: none;
  padding: 0 1rem;
  color: var(--color-text-main);
  font-family: inherit;
  font-size: 0.95rem;
  outline: none;
}

.has-icon .base-input {
  padding-left: 2.75rem;
}
</style>
