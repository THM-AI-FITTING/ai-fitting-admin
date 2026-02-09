<template>
  <BaseModal v-model="isOpen" title="API 키 수정">
    <div class="edit-form">
      <div class="key-field">
        <BaseInput 
          :model-value="apiKey" 
          label="API 키 (수정 불가)" 
          readonly
          class="readonly-input flex-1"
        />
        <div class="key-action-wrapper">
          <BaseButton 
            size="sm" 
            variant="ghost" 
            class="copy-btn"
            title="복사"
            @click="copyToClipboard"
          >
            <Copy :size="18" />
          </BaseButton>
          <Transition name="fade-up">
            <div v-if="showTooltip" class="copy-tooltip-modal">복사 완료!</div>
          </Transition>
        </div>
      </div>

      <BaseInput 
        v-model="form.owner" 
        label="파트너/소유자 명" 
        placeholder="예: Partner A" 
        class="mb-4"
      />

      <div class="grid-2 mb-4">
        <BaseInput 
          v-model="form.createdAt" 
          label="시작일" 
          type="date"
          :icon="Calendar"
          class="bright-icon"
        />
        
        <BaseInput 
          v-model="form.expiredAt" 
          label="만료일" 
          type="date"
          :icon="Calendar"
          class="bright-icon"
        />
      </div>

      <div class="status-select">
        <label class="input-label">상태</label>
        <select v-model="form.status" class="base-select">
          <option value="ACTIVE">활성 (ACTIVE)</option>
          <option value="INACTIVE">비활성 (INACTIVE)</option>
        </select>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="ghost" @click="close">취소</BaseButton>
      <BaseButton :loading="loading" @click="updateKey" :disabled="!form.owner">저장</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { Calendar, Copy } from 'lucide-vue-next';
import BaseModal from '~/components/ui/BaseModal.vue';
import BaseInput from '~/components/ui/BaseInput.vue';
import BaseButton from '~/components/ui/BaseButton.vue';

interface ApiKeyItem {
  apiKey: string;
  owner?: string;
  status: string;
  createdAt: number;
  sysRegDtm: number;
  expiredAt: number | null;
}

const props = defineProps<{
  modelValue: boolean;
  item: ApiKeyItem | null;
}>();

const emit = defineEmits(['update:modelValue', 'updated']);

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const apiKey = computed(() => props.item?.apiKey || '');

const form = reactive({
  owner: '',
  createdAt: '',
  expiredAt: '',
  status: 'ACTIVE'
});

const loading = ref(false);
const showTooltip = ref(false);

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(apiKey.value);
    showTooltip.value = true;
    setTimeout(() => {
      showTooltip.value = false;
    }, 2000);
  } catch (err) {
    console.error('Copy failed:', err);
  }
};

const formatDateForInput = (val: any) => {
  if (!val) return '';
  const date = new Date(val);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

watch(() => props.item, (newItem) => {
  if (newItem) {
    form.owner = newItem.owner || '';
    form.status = newItem.status || 'ACTIVE';
    form.createdAt = formatDateForInput(newItem.createdAt);
    form.expiredAt = formatDateForInput(newItem.expiredAt);
  }
}, { immediate: true });

const updateKey = async () => {
  if (!form.owner || !props.item) return;
  
  loading.value = true;
  try {
    await $fetch(`/api/keys/${props.item.apiKey}`, {
      method: 'PUT',
      body: {
        owner: form.owner,
        status: form.status,
        createdAt: new Date(form.createdAt).toISOString(),
        sysRegDtm: props.item.sysRegDtm,
        expiredAt: form.expiredAt ? new Date(form.expiredAt).toISOString() : null
      }
    });
    emit('updated');
    close();
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const close = () => {
  isOpen.value = false;
};
</script>

<style scoped>
.mb-4 { margin-bottom: 1rem; }

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.readonly-input {
  opacity: 0.7;
}

.key-field {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.flex-1 { flex: 1; }

.key-action-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.copy-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  background: var(--color-bg-main);
  border: 1px solid var(--color-border);
}

.copy-tooltip-modal {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary);
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  z-index: 100;
}

.copy-tooltip-modal::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid var(--color-primary);
}

.fade-up-enter-active, .fade-up-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-up-enter-from {
  opacity: 0;
  transform: translate(-50%, 10px);
}
.fade-up-leave-to {
  opacity: 0;
  transform: translate(-50%, -5px);
}

:deep(.bright-icon .input-icon) {
  color: var(--color-text-main) !important;
  opacity: 0.9;
}

.status-select {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.base-select {
  width: 100%;
  height: 40px;
  background: var(--color-bg-main);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0 1rem;
  color: var(--color-text-main);
  font-family: inherit;
  font-size: 0.95rem;
  outline: none;
  cursor: pointer;
  transition: all 0.2s;
}

.base-select:hover {
  border-color: var(--color-text-muted);
}

.base-select:focus {
  border-color: var(--color-primary);
}
</style>
