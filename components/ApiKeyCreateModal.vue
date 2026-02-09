<template>
  <BaseModal v-model="isOpen" title="API 키 생성">
    <div v-if="!generatedKey" class="create-form">
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

      <div class="mb-4">
        <label class="input-label">상태</label>
        <select v-model="form.status" class="status-select">
          <option value="ACTIVE">활성 (ACTIVE)</option>
          <option value="INACTIVE">비활성 (INACTIVE)</option>
        </select>
      </div>
    </div>

    <div v-else class="success-view">
      <div class="success-icon">
        <CheckCircle :size="48" />
      </div>
      <h3>API 키 생성 완료</h3>
      <p class="warning-text">
        아래 키를 복사해서 안전한 곳에 보관하세요. 창을 닫으면 다시 확인할 수 없습니다.
      </p>
      
      <div class="key-display">
        <code class="key-text">{{ generatedKey }}</code>
        <BaseButton size="sm" variant="ghost" @click="copyKey">
          <Copy :size="16" />
        </BaseButton>
      </div>
    </div>

    <template #footer>
      <template v-if="!generatedKey">
        <BaseButton variant="ghost" @click="close">취소</BaseButton>
        <BaseButton :loading="loading" @click="createKey" :disabled="!form.owner">키 생성</BaseButton>
      </template>
      <template v-else>
        <BaseButton @click="close">완료</BaseButton>
      </template>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue';
import { CheckCircle, Copy, Calendar } from 'lucide-vue-next';
import BaseModal from '~/components/ui/BaseModal.vue';
import BaseInput from '~/components/ui/BaseInput.vue';
import BaseButton from '~/components/ui/BaseButton.vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'created']);

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// Default dates
const today = new Date().toISOString().split('T')[0];
const oneMonthLater = new Date();
oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
const nextMonth = oneMonthLater.toISOString().split('T')[0];

const form = reactive({
  owner: '',
  createdAt: today,
  expiredAt: nextMonth,
  status: 'ACTIVE' // 기본값은 활성
});

const loading = ref(false);
const generatedKey = ref('');

const createKey = async () => {
  if (!form.owner) return;
  
  try {
    const res = await $fetch<{ apiKey: string }>('/api/keys', {
      method: 'POST',
      body: {
        owner: form.owner,
        createdAt: new Date(form.createdAt).toISOString(),
        expiredAt: form.expiredAt ? new Date(form.expiredAt).toISOString() : null,
        status: form.status
      }
    });
    if (res && res.apiKey) {
      generatedKey.value = res.apiKey;
    }
    emit('created');
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const copyKey = () => {
  navigator.clipboard.writeText(generatedKey.value);
};

const close = () => {
  isOpen.value = false;
  setTimeout(() => {
    generatedKey.value = '';
    form.owner = '';
    form.createdAt = today;
    form.expiredAt = nextMonth;
    form.status = 'ACTIVE';
  }, 300);
};
</script>

<style scoped>
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

:deep(.bright-icon .input-icon) {
  color: var(--color-text-main) !important;
  opacity: 0.9;
}

.input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--color-text-main);
}

.status-select {
  width: 100%;
  background: var(--color-bg-main);
  border: 1px solid var(--color-border);
  color: var(--color-text-main);
  padding: 0.625rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s;
}

.status-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

.success-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem 0;
}

.success-icon {
  color: var(--color-success);
  margin-bottom: 1rem;
}

.warning-text {
  color: var(--color-warning);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.key-display {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.key-text {
  word-break: break-all;
  color: var(--color-primary);
}
</style>
