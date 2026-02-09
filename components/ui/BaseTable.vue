<!-- 
  공통 테이블(Table) 컴포넌트
  데이터 배열을 받아 정해진 컬럼 형식으로 렌더링합니다.
  로딩 상태 및 데이터 없음 상태를 처리하며 행 클릭 이벤트를 발생시킵니다.
-->
<template>
  <div class="base-table-container">
    <table class="base-table">
      <thead>
        <tr>
          <th v-if="showCheckbox" class="col-checkbox">
            <BaseCheckbox 
              :model-value="isAllSelected" 
              @change="toggleSelectAll" 
            />
          </th>
          <th v-if="showNo" class="col-no">No.</th>
          <th v-for="col in columns" :key="col.key" :style="{ width: col.width }">
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading" class="loading-row">
          <td :colspan="(showNo ? 1 : 0) + columns.length">
            <div class="loading-state">
              <span class="spinner"></span>
              데이터 로딩 중...
            </div>
          </td>
        </tr>
        <tr v-else-if="data.length === 0" class="empty-row">
          <td :colspan="(showNo ? 1 : 0) + columns.length">
            <div class="empty-state">
              데이터가 없습니다.
            </div>
          </td>
        </tr>
        <tr v-else v-for="(row, index) in data" :key="index" @click="$emit('row-click', row)" class="data-row" :class="{ selected: isSelected(row) }">
          <td v-if="showCheckbox" class="col-checkbox" @click.stop>
            <BaseCheckbox 
              :model-value="isSelected(row)" 
              @change="toggleSelection(row)" 
            />
          </td>
          <td v-if="showNo" class="col-no">{{ index + 1 + itemOffset }}</td>
          <td v-for="col in columns" :key="col.key">
            <slot :name="col.key" :row="row" :index="index">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseCheckbox from './BaseCheckbox.vue';

export interface TableColumn {
  key: string;
  label: string;
  width?: string;
}

const props = withDefaults(defineProps<{
  columns: TableColumn[];
  data: any[];
  loading?: boolean;
  showNo?: boolean;
  showCheckbox?: boolean;
  selectedItems?: any[];
  idKey?: string;
  itemOffset?: number;
}>(), {
  loading: false,
  showNo: false,
  showCheckbox: false,
  selectedItems: () => [],
  idKey: 'requestId',
  itemOffset: 0
});

const emit = defineEmits(['row-click', 'update:selectedItems']);

const isSelected = (row: any) => {
  return props.selectedItems.some(item => item[props.idKey] === row[props.idKey]);
};

const isAllSelected = computed(() => {
  return props.data.length > 0 && props.data.every(row => isSelected(row));
});

const toggleSelection = (row: any) => {
  const newSelection = [...props.selectedItems];
  const index = newSelection.findIndex(item => item[props.idKey] === row[props.idKey]);
  
  if (index > -1) {
    newSelection.splice(index, 1);
  } else {
    newSelection.push(row);
  }
  emit('update:selectedItems', newSelection);
};

const toggleSelectAll = (checked: boolean) => {
  if (checked) {
    emit('update:selectedItems', [...props.data]);
  } else {
    emit('update:selectedItems', []);
  }
};
</script>

<style scoped>
.base-table-container {
  width: 100%;
  overflow-x: auto;
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.base-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}

th {
  text-align: left;
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.05); /* Neutral dark for both themes */
  color: var(--color-text-muted);
  font-weight: 500;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--color-border);
}

td {
  padding: 1rem 1.5rem;
  color: var(--color-text-main);
  border-bottom: 1px solid var(--color-border);
  font-size: 0.95rem;
}

.col-checkbox {
  width: 40px;
  text-align: center;
  padding: 0 0 0 1.5rem;
}

.col-no {
  width: 60px;
  text-align: center;
  color: var(--color-text-muted);
}

.data-row {
  cursor: pointer;
  transition: background 0.2s;
}

.data-row:hover {
  background: rgba(0, 0, 0, 0.02);
}

.data-row.selected {
  background: rgba(99, 102, 241, 0.05);
}

.data-row:last-child td {
  border-bottom: none;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--color-text-muted);
  gap: 1rem;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
