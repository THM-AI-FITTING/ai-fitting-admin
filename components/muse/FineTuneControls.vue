<template>
  <div class="fine-tune-controls glass-panel">
    <div class="controls-header">
      <h4>{{ categoryName }} 설정</h4>
      <div class="header-actions">
        <button class="reset-btn" @click="$emit('reset-category')">초기화</button>
      </div>
    </div>

    <div class="controls-body scrollbar-v2">
      <div v-for="opt in currentOptions" :key="opt.key" class="option-item">
        <template v-if="opt.type === 'slider'">
          <BaseSlider 
            :label="opt.label"
            :min="opt.min"
            :max="opt.max"
            v-model="modelValue[opt.key]"
            @change="val => $emit('update-option', opt.key, val)"
          />
        </template>
        <template v-else-if="opt.type === 'color'">
          <div class="color-picker-group">
            <span class="label">{{ opt.label }}</span>
            <div class="picker-row">
              <input 
                type="color" 
                v-model="modelValue[opt.key]"
                @change="val => $emit('update-option', opt.key, (val.target as HTMLInputElement).value)"
                class="base-color-input"
              />
              <span class="hex-value">{{ modelValue[opt.key] }}</span>
            </div>
          </div>
        </template>
        <template v-else-if="opt.type === 'select'">
           <div class="select-group">
            <span class="label">{{ opt.label }}</span>
            <select 
              v-model="modelValue[opt.key]" 
              @change="val => $emit('update-option', opt.key, (val.target as HTMLSelectElement).value)"
              class="base-select"
            >
              <option v-for="o in opt.options" :key="o.value" :value="o.value">{{ o.text }}</option>
            </select>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseSlider from '~/components/ui/BaseSlider.vue';

const props = defineProps({
  category: { type: String, required: true },
  modelValue: { type: Object, required: true }
});

const emit = defineEmits(['update-option', 'reset-category']);

const config = {
  face: {
    name: '얼굴 골격',
    options: [
      { key: 'face_shape', label: '얼굴형 (Sharpness)', type: 'slider', min: -100, max: 100 },
      { key: 'cheekbone', label: '광대뼈 돌출', type: 'slider', min: -100, max: 100 },
      { key: 'face_width', label: '얼굴 너비', type: 'slider', min: -100, max: 100 },
      { key: 'jawline', label: '턱선 각도', type: 'slider', min: -100, max: 100 }
    ]
  },
  eyes: {
    name: '눈매 및 시선',
    options: [
      { key: 'eye_tilt', label: '눈매 각도 (Tilt)', type: 'slider', min: -100, max: 100 },
      { key: 'eye_distance', label: '미간 거리', type: 'slider', min: -100, max: 100 },
      { key: 'eyelid_thickness', label: '눈꺼풀 두께', type: 'slider', min: -100, max: 100 },
      { key: 'eye_color', label: '동공 색상', type: 'color' }
    ]
  },
  'nose-lips': {
    name: '코와 입술',
    options: [
      { key: 'nose_tip', label: '코끝 모양', type: 'slider', min: -100, max: 100 },
      { key: 'nose_bridge', label: '콧대 높이', type: 'slider', min: -100, max: 100 },
      { key: 'lip_volume_top', label: '윗입술 볼륨', type: 'slider', min: -100, max: 100 },
      { key: 'lip_volume_bottom', label: '아랫입술 볼륨', type: 'slider', min: -100, max: 100 },
      { key: 'cupids_bow', label: '입술 산 선명도', type: 'slider', min: -100, max: 100 }
    ]
  },
  hair: {
    name: '헤어 스타일',
    options: [
      { key: 'hair_texture', label: '헤어 윤기 (Texture)', type: 'slider', min: -100, max: 100 },
      { key: 'baby_hair', label: '잔머리 밀도', type: 'slider', min: -100, max: 100 },
      { key: 'hair_color_base', label: '베이스 컬러', type: 'color' },
      { key: 'hair_color_highlight', label: '하이라이트(브릿지) 컬러', type: 'color' }
    ]
  },
  skin: {
    name: '피부 및 특성',
    options: [
      { key: 'skin_undertone', label: '피부 언더톤 (Warm/Cool)', type: 'slider', min: -100, max: 100 },
      { key: 'skin_texture', label: '모공/피부결 가시성', type: 'slider', min: -100, max: 100 },
      { key: 'freckles', label: '주근깨 밀도', type: 'slider', min: -100, max: 100 },
      { key: 'blush', label: '홍조 강도', type: 'slider', min: -100, max: 100 },
      { key: 'beauty_mark_pos', label: '매력점 위치', type: 'select', options: [
        { value: 'none', text: '없음' },
        { value: 'eye_left', text: '왼쪽 눈 밑' },
        { value: 'eye_right', text: '오른쪽 눈 밑' },
        { value: 'nose', text: '코 옆' },
        { value: 'lip', text: '입술 옆' }
      ]}
    ]
  }
};

const categoryName = computed(() => (config as any)[props.category]?.name || '설정');
const currentOptions = computed(() => (config as any)[props.category]?.options || []);
</script>

<style scoped>
.fine-tune-controls {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.controls-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.controls-header h4 {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0;
}

.reset-btn {
  background: transparent;
  border: none;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  cursor: pointer;
  text-decoration: underline;
}

.reset-btn:hover {
  color: var(--color-primary);
}

.controls-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.option-item {
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 1.5rem;
}

.option-item:last-child {
  border-bottom: none;
}

/* Color Picker */
.color-picker-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.color-picker-group .label {
  font-size: 0.85rem;
  font-weight: 600;
  opacity: 0.8;
}

.picker-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.base-color-input {
  -webkit-appearance: none;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  background: transparent;
}

.base-color-input::-webkit-color-swatch-wrapper { padding: 0; }
.base-color-input::-webkit-color-swatch { border: 2px solid rgba(255,255,255,0.2); border-radius: 50%; }

.hex-value {
  font-family: monospace;
  font-size: 0.85rem;
  opacity: 0.6;
}

/* Select */
.select-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.select-group .label {
  font-size: 0.85rem;
  font-weight: 600;
  opacity: 0.8;
}

.base-select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-main);
  padding: 0.65rem 1rem;
  outline: none;
  cursor: pointer;
}

.base-select:focus {
  border-color: var(--color-primary);
}
</style>
