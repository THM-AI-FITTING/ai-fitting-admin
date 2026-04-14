<template>
  <div class="base-slider-container">
    <div class="label-row">
      <span class="label-text">{{ label }}</span>
      <input 
        type="number" 
        :value="modelValue" 
        @input="onInputChange" 
        class="value-input"
        :min="min"
        :max="max"
      />
    </div>
    <div class="slider-wrapper">
      <input 
        type="range" 
        :min="min" 
        :max="max" 
        :step="step"
        :value="modelValue"
        @input="onSliderChange"
        @dblclick="resetValue"
        class="custom-range"
      />
      <div class="range-markers">
        <span class="marker">{{ minLabel || min }}</span>
        <span class="marker center">0</span>
        <span class="marker">{{ maxLabel || max }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  label: { type: String, required: true },
  modelValue: { type: Number, default: 0 },
  min: { type: Number, default: -100 },
  max: { type: Number, default: 100 },
  minLabel: { type: String, default: '' },
  maxLabel: { type: String, default: '' },
  step: { type: Number, default: 1 }
});

const emit = defineEmits(['update:modelValue', 'change']);

const onSliderChange = (e: Event) => {
  const value = parseFloat((e.target as HTMLInputElement).value);
  emit('update:modelValue', value);
  emit('change', value);
};

const onInputChange = (e: Event) => {
  let value = parseFloat((e.target as HTMLInputElement).value);
  if (isNaN(value)) return;
  if (value < props.min) value = props.min;
  if (value > props.max) value = props.max;
  emit('update:modelValue', value);
  emit('change', value);
};

const resetValue = () => {
  emit('update:modelValue', 0);
  emit('change', 0);
};
</script>

<style scoped>
.base-slider-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-main);
  opacity: 0.8;
}

.value-input {
  width: 60px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-main);
  font-size: 0.8rem;
  padding: 2px 4px;
  text-align: right;
  outline: none;
}

.value-input:focus {
  border-color: var(--color-primary);
}

/* Slider Style */
.slider-wrapper {
  position: relative;
  padding-bottom: 1rem;
}

.custom-range {
  -webkit-appearance: none;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  outline: none;
  transition: all 0.2s;
}

.custom-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  box-shadow: 0 0 10px rgba(var(--color-primary-rgb), 0.4);
  border: 2px solid white;
}

.custom-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  border: 2px solid white;
}

.range-markers {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  opacity: 0.4;
  font-size: 10px;
  pointer-events: none;
}

.marker.center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
</style>
