<!-- 
  공통 체크박스(Checkbox) 컴포넌트
  둥근 디자인의 현대적인 체크박스입니다.
-->
<template>
  <label class="base-checkbox" :class="{ disabled }">
    <input 
      type="checkbox" 
      :checked="modelValue" 
      :disabled="disabled"
      @change="handleChange"
    >
    <span class="checkmark">
      <Check v-if="modelValue" :size="14" stroke-width="3" />
    </span>
    <span v-if="$slots.default" class="label-text">
      <slot></slot>
    </span>
  </label>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next';

defineProps<{
  modelValue: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'change']);

const handleChange = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked;
  emit('update:modelValue', checked);
  emit('change', checked);
};
</script>

<style scoped>
.base-checkbox {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  gap: 0.5rem;
}

.base-checkbox.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

input {
  display: none;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px; /* 둥근네모 디자인 */
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

input:checked + .checkmark {
  background: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
}

.base-checkbox:hover .checkmark {
  background: white !important;
  border-color: #6366f1 !important; /* 푸른계열 테두리 */
  color: #6366f1;
}

:root[data-theme="dark"] .checkmark {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.1);
}

.label-text {
  font-size: 0.9rem;
  color: var(--color-text-main);
}
</style>
