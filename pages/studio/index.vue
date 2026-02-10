<template>
  <div class="studio-list-page">
    <div class="page-controls animate-fade-in stagger-1">
      <div class="filter-panel glass-panel">
        <div class="filter-grid">
          <BaseInput 
            v-model="searchQuery" 
            placeholder="상품명 또는 ID 검색..." 
            class="filter-input"
          />
          <select v-model="statusFilter" class="filter-select">
            <option value="all">모든 상태</option>
            <option value="DONE">완료</option>
            <option value="PROCESSING">진행 중</option>
          </select>
        </div>
        <div class="filter-actions">
          <BaseButton variant="primary" @click="refresh">검색</BaseButton>
        </div>
      </div>
    </div>

    <BaseCard class="animate-fade-in stagger-2">
      <template #header>
        <div class="card-header-actions">
          <span class="card-header-title">스튜디오 작업 내역 (Mock)</span>
          <div class="view-toggles">
            <button 
              :class="['toggle-btn', { active: viewMode === 'grid' }]"
              @click="viewMode = 'grid'"
            >
              <LayoutGrid :size="18" />
            </button>
            <button 
              :class="['toggle-btn', { active: viewMode === 'list' }]"
              @click="viewMode = 'list'"
            >
              <ListIcon :size="18" />
            </button>
          </div>
        </div>
      </template>

      <!-- List View -->
      <BaseTable 
        v-if="viewMode === 'list'"
        :columns="columns" 
        :data="mockJobs" 
        @row-click="goToDetail"
      >
        <template #status="{ row }">
          <StatusBadge :status="row.status" />
        </template>
        <template #poses="{ row }">
          <div class="pose-badges">
            <span v-for="pose in row.poses" :key="pose" class="mini-pose-badge">{{ pose }}</span>
          </div>
        </template>
      </BaseTable>

      <!-- Grid View -->
      <div v-else class="studio-grid">
        <div 
          v-for="job in mockJobs" 
          :key="job.id" 
          class="studio-item-card glass-panel"
          @click="goToDetail(job)"
        >
          <div class="thumb-wrapper">
            <BaseImage :src="job.thumbnail" :alt="job.name" fit="cover" />
            <div class="item-status">
              <StatusBadge :status="job.status" size="sm" />
            </div>
          </div>
          <div class="item-info">
            <div class="item-id">{{ job.id }}</div>
            <div class="item-name">{{ job.name }}</div>
            <div class="item-footer">
              <span class="item-date">{{ job.date }}</span>
              <span class="item-poses">{{ job.poses.length }} Poses</span>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { LayoutGrid, List as ListIcon } from 'lucide-vue-next';
import BaseCard from '~/components/ui/BaseCard.vue';
import BaseButton from '~/components/ui/BaseButton.vue';
import BaseInput from '~/components/ui/BaseInput.vue';
import BaseTable from '~/components/ui/BaseTable.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import BaseImage from '~/components/ui/BaseImage.vue';

definePageMeta({
  title: '스튜디오 작업 목록'
});

const router = useRouter();
const viewMode = ref<'grid' | 'list'>('grid');
const searchQuery = ref('');
const statusFilter = ref('all');

const columns = [
  { key: 'id', label: '작업 ID' },
  { key: 'name', label: '상품명' },
  { key: 'status', label: '상태' },
  { key: 'poses', label: '생성 포즈' },
  { key: 'date', label: '생성일' },
];

const mockJobs = [
  { 
    id: 'ST-2026-001', 
    name: '베이직 오버핏 맨투맨', 
    status: 'DONE', 
    poses: ['A', 'B', 'C', 'D'], 
    date: '2026-02-10',
    thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400'
  },
  { 
    id: 'ST-2026-002', 
    name: '슬림핏 데님 팬츠', 
    status: 'DONE', 
    poses: ['A', 'B'], 
    date: '2026-02-09',
    thumbnail: 'https://images.unsplash.com/photo-1539109132304-391e55030f9a?w=400'
  },
  { 
    id: 'ST-2026-003', 
    name: '울 캐시미어 코트', 
    status: 'PROCESSING', 
    poses: ['A', 'B', 'C', 'D'], 
    date: '2026-02-10',
    thumbnail: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'
  },
];

const refresh = () => {
  // Mock refresh
};

const goToDetail = (job: any) => {
  router.push(`/studio/${job.id}`);
};
</script>

<style scoped>
.studio-list-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.filter-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
  border: 1px solid var(--color-border);
}

.filter-grid {
  display: flex;
  gap: 1rem;
  flex: 1;
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
}

.card-header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.card-header-title {
  font-weight: 700;
  opacity: 0.8;
}

.view-toggles {
  display: flex;
  background: rgba(0, 0, 0, 0.1);
  padding: 4px;
  border-radius: 8px;
  gap: 4px;
}

.toggle-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: var(--color-primary);
  color: white;
}

.studio-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

.studio-item-card {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.studio-item-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-primary);
  box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.4);
}

.thumb-wrapper {
  aspect-ratio: 3/4;
  position: relative;
  background: var(--color-bg-main);
}

.item-status {
  position: absolute;
  top: 10px;
  right: 10px;
  transform: scale(0.9);
}

.item-info {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-id {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-primary);
  font-family: monospace;
}

.item-name {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-footer {
  margin-top: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.pose-badges {
  display: flex;
  gap: 4px;
}

.mini-pose-badge {
  background: rgba(var(--color-primary-rgb), 0.1);
  color: var(--color-primary);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
}
</style>
