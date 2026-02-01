<template>
  <div class="api-keys-page">
    <div class="page-controls">
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

    <BaseCard>
      <BaseTable 
        :columns="columns" 
        :data="visibleKeys" 
        :show-no="true"
        :loading="pending"
        @row-click="openEditModal"
      >
        <template #maskedKey="{ row }">
          <div class="key-cell">
            <span class="key-text">{{ row.revealed ? row.apiKey : row.maskedKey }}</span>
            <BaseButton 
              size="sm" 
              variant="ghost" 
              class="reveal-btn"
              @click.stop="toggleKeyReveal(row)"
            >
              <Eye :size="16" v-if="!row.revealed" />
              <EyeOff :size="16" v-else />
            </BaseButton>
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
      :item="selectedItem"
      @updated="refreshKeys"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import { Search, Plus, Power, Trash2, Eye, EyeOff, Edit } from 'lucide-vue-next';
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
const showCreateModal = ref(false);
const showEditModal = ref(false);
const selectedItem = ref<any>(null);
const page = ref(1);
const limit = 15;

const { data: rawKeys, pending, refresh } = await useFetch('/api/keys', {
  query: { 
    q: searchQuery,
    page,
    limit
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
  { key: 'createdAt', label: '생성일' },
  { key: 'expiredAt', label: '만료일' },
  { key: 'actions', label: '관리', width: '100px' }
];

const pageSize = ref(15);

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

const openEditModal = (item: any) => {
  selectedItem.value = item;
  showEditModal.value = true;
};

const toggleStatus = async (row: any) => {
  const newStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const actionName = newStatus === 'ACTIVE' ? '활성화' : '비활성화';
  if (!confirm(`정말로 상태를 ${actionName} 하시겠습니까?`)) return;

  await $fetch(`/api/keys/${row.apiKey}`, {
    method: 'PUT',
    body: { 
      status: newStatus,
      owner: row.owner,
      createdAt: row.createdAt,
      expiredAt: row.expiredAt
    }
  });
  refresh();
};

const deleteKey = async (apiKey: string) => {
  if (!confirm('정말로 이 API Key를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
  
  await $fetch(`/api/keys/${apiKey}`, {
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
  return date.toLocaleDateString('ko-KR');
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
  font-family: monospace;
  font-size: 0.9rem;
}

.reveal-btn {
  padding: 0;
  width: 28px;
  height: 28px;
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
