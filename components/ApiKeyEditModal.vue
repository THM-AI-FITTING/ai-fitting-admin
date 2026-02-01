<template>
  <BaseModal v-model="isOpen" title="API 키 수정">
    <div class="edit-form">
      <BaseInput 
        :model-value="apiKey" 
        label="API 키 (수정 불가)" 
        readonly
        class="mb-4 readonly-input"
      />

      <BaseInput 
        v-model="form.owner" 
        label="파트너/소유자 명" 
        placeholder="예: Partner A" 
        class="mb-4"
      />

      <div class="grid-2 mb-4">
        <BaseInput 
          v-model="form.createdAt" 
          label="생성일" 
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
import { Calendar } from 'lucide-vue-next';
import BaseModal from '~/components/ui/BaseModal.vue';
import BaseInput from '~/components/ui/BaseInput.vue';
import BaseButton from '~/components/ui/BaseButton.vue';

interface ApiKeyItem {
  apiKey: string;
  owner?: string;
  status: string;
  createdAt: number;
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

watch(() => props.item, (newItem) => {
  if (newItem) {
    form.owner = newItem.owner || '';
    form.status = newItem.status;
    form.createdAt = new Date(newItem.createdAt).toISOString().split('T')[0];
    form.expiredAt = newItem.expiredAt ? new Date(newItem.expiredAt).toISOString().split('T')[0] : '';
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
        createdAt: new Date(form.createdAt).getTime(),
        expiredAt: form.expiredAt ? new Date(form.expiredAt).getTime() : null
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
