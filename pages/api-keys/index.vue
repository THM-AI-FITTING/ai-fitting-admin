<template>
  <div class="api-keys-page">
    <div class="page-controls animate-fade-in stagger-1">
      <div class="filters">
        <BaseInput 
          v-model="filters.owner" 
          placeholder="파트너명 검색..." 
          :icon="Search"
          class="filter-input"
        />
        <select v-model="filters.status" class="filter-select">
          <option value="">모든 상태</option>
          <option value="ACTIVE">활성 (ACTIVE)</option>
          <option value="INACTIVE">비활성 (INACTIVE)</option>
        </select>
      </div>
      
      <BaseButton :icon="Plus" @click="showCreateModal = true">
        API 키 생성
      </BaseButton>
    </div>

    <BaseCard class="animate-fade-in stagger-2">
      <!-- Desktop Table View -->
      <div class="hidden-mobile">
        <BaseTable 
          :columns="columns" 
          :data="visibleKeys" 
          :show-no="true"
          :loading="pending"
          @row-click="openEditModal"
        >
          <template #maskedKey="{ row }">
            <div class="key-cell">
              <div class="copy-container">
                <span 
                  class="key-text clickable" 
                  title="클릭하여 복사"
                  @click.stop="copyToClipboard(row.revealed ? row.apiKey : row.maskedKey, row.apiKey)"
                >
                  {{ row.revealed ? row.apiKey : row.maskedKey }}
                </span>
                <Transition name="fade-up">
                  <div v-if="copiedId === row.apiKey" class="copy-tooltip">복사 완료!</div>
                </Transition>
              </div>
              <div class="key-actions-row">
                <BaseButton 
                  size="sm" 
                  variant="ghost" 
                  class="action-btn"
                  title="복사"
                  @click.stop="copyToClipboard(row.apiKey, row.apiKey)"
                >
                  <Copy :size="16" />
                </BaseButton>
                <BaseButton 
                  size="sm" 
                  variant="ghost" 
                  class="reveal-btn action-btn"
                  title="보기/정체"
                  @click.stop="toggleKeyReveal(row)"
                >
                  <Eye :size="16" v-if="!row.revealed" />
                  <EyeOff :size="16" v-else />
                </BaseButton>
              </div>
            </div>
          </template>

          <template #status="{ row }">
            <StatusBadge :status="row.status" />
          </template>
          
          <template #createdAt="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
          
          <template #expiredAt="{ row }">
            {{ row.expiredAt ? formatDate(row.expiredAt) : '무제한' }}
          </template>
          
          <template #actions="{ row }">
            <div class="actions">
              <BaseButton 
                size="sm" 
                variant="ghost" 
                @click.stop="toggleStatus(row)"
                :title="row.status === 'ACTIVE' ? '비활성화' : '활성화'"
              >
                <Power :size="16" :class="{ 'text-danger': row.status === 'ACTIVE', 'text-success': row.status === 'INACTIVE' }" />
              </BaseButton>
              
              <BaseButton 
                size="sm" 
                variant="ghost" 
                title="수정"
                @click.stop="openEditModal(row)"
              >
                <Edit :size="16" />
              </BaseButton>

              <BaseButton 
                size="sm" 
                variant="ghost" 
                class="text-danger"
                @click.stop="deleteKey(row.apiKey)"
                title="삭제"
              >
                <Trash2 :size="16" />
              </BaseButton>
            </div>
          </template>
        </BaseTable>
      </div>

      <!-- Mobile Card List View -->
      <div class="mobile-only api-key-list-mobile">
        <div 
          v-for="row in visibleKeys" 
          :key="row.apiKey"
          class="mobile-key-card"
          @click="openEditModal(row)"
        >
          <div class="key-card-header">
            <div class="key-info">
              <div class="copy-container">
                <span 
                  class="key-text mono clickable" 
                  :class="{ 'full-key': row.revealed }"
                  @click.stop="copyToClipboard(row.revealed ? row.apiKey : row.maskedKey, row.apiKey)"
                >
                  {{ row.revealed ? row.apiKey : formatKeyForMobile(row.maskedKey) }}
                </span>
                <Transition name="fade-up">
                  <div v-if="copiedId === row.apiKey" class="copy-tooltip">복사 완료!</div>
                </Transition>
              </div>
              <div class="key-actions-row-mobile">
                <BaseButton 
                  size="sm" 
                  variant="ghost" 
                  class="action-btn-mobile"
                  @click.stop="copyToClipboard(row.apiKey, row.apiKey)"
                >
                  <Copy :size="14" />
                </BaseButton>
                <BaseButton 
                  size="sm" 
                  variant="ghost" 
                  class="reveal-btn-mobile action-btn-mobile"
                  @click.stop="toggleKeyReveal(row)"
                >
                  <Eye :size="14" v-if="!row.revealed" />
                  <EyeOff :size="14" v-else />
                </BaseButton>
              </div>
            </div>
            <StatusBadge :status="row.status" size="sm" />
          </div>
          
          <div class="key-card-body">
            <div class="info-row">
              <span class="info-label">파트너:</span>
              <span class="info-value">{{ row.owner }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">시작일:</span>
              <span class="info-value">{{ formatDate(row.createdAt) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">만료일:</span>
              <span class="info-value">{{ row.expiredAt ? formatDate(row.expiredAt) : '무제한' }}</span>
            </div>
          </div>

          <div class="key-card-actions" @click.stop>
            <BaseButton 
              size="sm" 
              variant="ghost" 
              @click.stop="toggleStatus(row)"
              class="mobile-action-btn"
            >
              <Power :size="16" :class="{ 'text-danger': row.status === 'ACTIVE', 'text-success': row.status === 'INACTIVE' }" />
              <span>{{ row.status === 'ACTIVE' ? '비활성' : '활성' }}</span>
            </BaseButton>
            
            <BaseButton 
              size="sm" 
              variant="ghost" 
              @click.stop="openEditModal(row)"
              class="mobile-action-btn"
            >
              <Edit :size="16" />
              <span>수정</span>
            </BaseButton>

            <BaseButton 
              size="sm" 
              variant="ghost" 
              class="text-danger mobile-action-btn"
              @click.stop="deleteKey(row.apiKey)"
            >
              <Trash2 :size="16" />
              <span>삭제</span>
            </BaseButton>
          </div>
        </div>
      </div>

      <div v-if="hasMore" class="load-more">
        <BaseButton variant="ghost" @click="pageSize += 15">더보기</BaseButton>
      </div>
    </BaseCard>

    <!-- Modals -->
    <ApiKeyCreateModal 
      v-model="showCreateModal" 
      @created="refreshKeys" 
    />

    <ApiKeyEditModal
      v-model="showEditModal"
      :item="editingKey"
      @updated="refresh"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { Search, Plus, Power, Trash2, Eye, EyeOff, Edit, Copy } from 'lucide-vue-next';
import BaseCard from '~/components/ui/BaseCard.vue';
import BaseButton from '~/components/ui/BaseButton.vue';
import BaseInput from '~/components/ui/BaseInput.vue';
import BaseTable from '~/components/ui/BaseTable.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import ApiKeyCreateModal from '~/components/ApiKeyCreateModal.vue';
import ApiKeyEditModal from '~/components/ApiKeyEditModal.vue';

definePageMeta({
  title: 'API 키 관리'
});

// State
const searchQuery = ref('');
const showEditModal = ref(false);
const showCreateModal = ref(false);
const editingKey = ref<any>(null);
const copiedId = ref<string | null>(null);
const page = ref(1);
const limit = ref(15);
const pageSize = ref(15);

const config = useRuntimeConfig();
const { data: rawKeys, pending, refresh } = await useFetch('/api/keys', {
  baseURL: config.public.apiBase,
  query: { 
    q: searchQuery,
    page: page.value,
    limit: limit.value
  }
});
const keys = ref<any[]>([]);

watch(rawKeys, (newVal) => {
  if (newVal) {
    const items = Array.isArray(newVal) ? newVal : [];
    keys.value = items.map((k: any) => ({
      ...k,
      revealed: false,
      loading: false,
      fullKey: null
    }));
  }
}, { immediate: true });

const filters = reactive({
  owner: '',
  status: ''
});

const columns = [
  { key: 'maskedKey', label: 'API Key' },
  { key: 'owner', label: '파트너' },
  { key: 'status', label: '상태' },
  { key: 'createdAt', label: '시작일' },
  { key: 'expiredAt', label: '만료일(종료일)' },
  { key: 'actions', label: '관리', width: '100px' }
];

const filteredKeys = computed(() => {
  if (!keys.value) return [];
  return keys.value.filter((k: any) => {
    const matchOwner = !filters.owner || k.owner.toLowerCase().includes(filters.owner.toLowerCase());
    const matchStatus = !filters.status || k.status === filters.status;
    return matchOwner && matchStatus;
  });
});

const visibleKeys = computed(() => filteredKeys.value.slice(0, pageSize.value));
const hasMore = computed(() => filteredKeys.value.length > pageSize.value);

const refreshKeys = () => {
  refresh();
};

const openEditModal = (row: any) => {
  editingKey.value = { ...row };
  showEditModal.value = true;
};

const toggleStatus = async (row: any) => {
  const newStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const actionName = newStatus === 'ACTIVE' ? '활성화' : '비활성화';
  if (!confirm(`정말로 상태를 ${actionName} 하시겠습니까?`)) return;

  await $fetch(`${config.public.apiBase}/api/keys/${row.apiKey}`, {
    method: 'PUT',
    body: { 
      status: newStatus,
      owner: row.owner,
      createdAt: row.createdAt,
      sysRegDtm: row.sysRegDtm,
      expiredAt: row.expiredAt
    }
  });
  refresh();
};

const deleteKey = async (apiKey: string) => {
  if (!confirm('정말로 이 API Key를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
  
  await $fetch(`${config.public.apiBase}/api/keys/${apiKey}`, {
    method: 'DELETE'
  });
  refresh();
};

const toggleKeyReveal = (row: any) => {
  row.revealed = !row.revealed;
};

const formatDate = (ts: any) => {
  if (!ts) return '-';
  const date = new Date(ts);
  if (isNaN(date.getTime())) return '-';
  // ISO string is already yyyy-MM-dd... but we'll use ko-KR for consistent UI
  return date.toLocaleDateString('ko-KR');
};

const formatDateTime = (ts: any) => {
  if (!ts) return '-';
  const date = new Date(ts);
  if (isNaN(date.getTime())) return '-';
  // Use locale string to show both date and time clearly
  return date.toLocaleString('ko-KR');
};

const formatKeyForMobile = (key: string) => {
  if (!key) return '';
  if (key.length <= 16) return key;
  return key.substring(0, 16) + '...';
};

const copyToClipboard = async (text: string, id: string) => {
  try {
    await navigator.clipboard.writeText(text);
    copiedId.value = id;
    setTimeout(() => {
      if (copiedId.value === id) {
        copiedId.value = null;
      }
    }, 2000);
  } catch (err) {
    console.error('Copy failed:', err);
  }
};
</script>

<style scoped>
.api-keys-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.filters {
  display: flex;
  gap: 1rem;
  flex: 1;
  max-width: 600px;
}

.filter-input {
  max-width: 300px;
}

.filter-select {
  background: var(--color-bg-main);
  border: 1px solid var(--color-border);
  color: var(--color-text-main);
  padding: 0 1rem;
  border-radius: var(--radius-md);
  height: 40px;
  outline: none;
}

.mobile-only {
  display: none !important;
}

@media (max-width: 768px) {
  .page-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters {
    flex-direction: column;
    max-width: none;
  }
  
  .filter-input {
    max-width: none;
    width: 100%;
  }
  
  .filter-select {
    width: 100%;
  }

  .hidden-mobile {
    display: none !important;
  }

  .mobile-only {
    display: block !important;
  }
}

.api-key-list-mobile {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding: 1.5rem 0;
}

.mobile-key-card {
  background: var(--color-bg-card, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  margin-bottom: 1rem;
}

.mobile-key-card:active {
  background: rgba(255, 255, 255, 0.08);
  transform: scale(0.98);
}

.key-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.key-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
}

.key-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.info-label {
  color: var(--color-text-muted);
}

.info-value {
  color: var(--color-text-main);
  font-weight: 500;
}

.key-card-actions {
  display: flex;
  gap: 0.5rem;
  border-top: 1px solid var(--color-border);
  padding-top: 1rem;
}

.mobile-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.02);
}

.reveal-btn-mobile {
  padding: 0;
  width: 24px;
  height: 24px;
  color: var(--color-primary);
  flex-shrink: 0;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.key-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.key-text {
  font-size: 0.9rem;
  transition: all 0.2s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.key-text.clickable {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}

.key-text.clickable:hover {
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-primary);
}

.key-text.full-key {
  word-break: break-all;
  white-space: normal;
  line-height: 1.4;
  text-align: left;
}

.copy-container {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.copy-tooltip {
  position: absolute;
  top: -34px;
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

.copy-tooltip::after {
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

.reveal-btn {
  color: var(--color-primary);
}

.key-actions-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.action-btn {
  padding: 0;
  width: 28px;
  height: 28px;
  color: var(--color-text-muted);
}

.action-btn:hover {
  color: var(--color-primary);
}

.key-actions-row-mobile {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.action-btn-mobile {
  padding: 0;
  width: 24px;
  height: 24px;
  color: var(--color-text-muted);
}

.action-btn-mobile:hover {
  color: var(--color-primary);
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.text-danger { color: var(--color-danger); }
.text-success { color: var(--color-success); }
</style>
