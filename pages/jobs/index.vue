<!-- 
  AI 가상 피팅 작업 목록 페이지
  목록형(Table)과 그리드형(Card) 보기 모드를 지원하며, 필터링 및 더보기 기능을 포함합니다.
-->
<template>
  <div class="jobs-page">
    <div class="page-controls animate-fade-in stagger-1">
      <div class="filter-panel glass-panel">
        <div class="filter-grid">
          <BaseInput 
            v-model="filters.owner" 
            placeholder="파트너명..." 
            class="filter-input-sm"
          />
          <BaseInput 
            v-model="filters.userId" 
            placeholder="사용자 ID..." 
            class="filter-input-sm"
          />
          <select v-model="filters.status" class="filter-select">
            <option value="">모든 상태</option>
            <option value="START">진행 중 (START)</option>
            <option value="DONE">완료 (DONE)</option>
            <option value="FAILED">실패 (FAILED)</option>
          </select>
          
          <select v-model="sortOrder" class="filter-select">
            <option value="desc">최신순</option>
            <option value="asc">등록순</option>
          </select>
        </div>
        <BaseButton variant="primary" class="search-btn" @click="refresh">검색</BaseButton>
      </div>

      <div class="view-actions-standalone" v-if="selectedJobs.length > 0">
        <BaseButton 
          variant="danger" 
          size="sm" 
          class="delete-btn animate-fade-in"
          :loading="deleting"
          @click="deleteSelectedJobs"
        >
          <Trash2 :size="16" />
          {{ selectedJobs.length }}개 삭제
        </BaseButton>
      </div>
    </div>

    <BaseCard class="animate-fade-in stagger-2">
      <template #header>
        <div class="card-header-actions">
          <span class="card-header-title">작업 내역</span>
          <div class="view-toggles-integrated">
            <button 
              :class="['toggle-btn-modern', { active: viewMode === 'grid' }]"
              @click="viewMode = 'grid'"
              title="그리드 보기"
            >
              <LayoutGrid :size="18" />
            </button>
            <button 
              :class="['toggle-btn-modern', { active: viewMode === 'list' }]"
              @click="viewMode = 'list'"
              title="목록 보기"
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
        :data="visibleJobs" 
        :show-no="true"
        :show-checkbox="true"
        v-model:selected-items="selectedJobs"
        :loading="pending"
        @row-click="goToDetail"
      >
        <template #requestId="{ row }">
          <div class="request-id-cell">
            <span class="id-text">{{ row.requestId }}</span>
            <BaseButton 
              v-if="row.status === 'DONE' && row.url"
              size="sm" 
              variant="ghost" 
              class="preview-btn"
              @click.stop="togglePreview($event, row.url)"
              title="미리보기"
            >
              <ImageIcon :size="16" />
            </BaseButton>
          </div>
        </template>

        <template #status="{ row }">
          <StatusBadge :status="row.status" />
        </template>
        
        <template #sysRegDtm="{ row }">
          {{ new Date(row.sysRegDtm).toLocaleString('ko-KR', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false 
          }) }}
        </template>
      </BaseTable>

      <!-- Grid View -->
      <div v-else class="jobs-grid">
        <div 
          v-for="job in visibleJobs" 
          :key="job.requestId" 
          class="job-thumb-card glass-panel"
          :class="{ selected: isSelected(job) }"
          @click="goToDetail(job)"
        >
          <div class="thumb-container">
            <BaseImage :src="job.url" :alt="job.requestId" fit="cover" />
            <div class="thumb-status">
              <StatusBadge :status="job.status" size="sm" />
            </div>
            <div class="thumb-checkbox" @click.stop>
              <BaseCheckbox 
                :model-value="isSelected(job)" 
                @change="toggleSelection(job)" 
              />
            </div>
          </div>
          <div class="thumb-info">
            <div class="requestId-row">
              <div class="copy-container">
                <span class="mono text-truncate clickable" @click.stop="copyToClipboard(job.requestId)">{{ job.requestId }}</span>
                <Transition name="fade-up">
                  <div v-if="activeTooltipId === job.requestId" class="copy-tooltip">복사 완료!</div>
                </Transition>
              </div>
              <button class="copy-btn" @click.stop="copyToClipboard(job.requestId)" title="ID 복사">
                <Copy :size="12" />
              </button>
            </div>
            <div class="info-row">
              <User :size="12" class="info-icon" />
              <span class="owner text-truncate">{{ job.owner }}</span>
            </div>
            <div class="info-row">
              <Clock :size="12" class="info-icon" />
              <span class="date">{{ formatSimpleDate(job.sysRegDtm) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasMore" class="load-more">
        <BaseButton variant="ghost" @click="pageSize += 15">더보기</BaseButton>
      </div>
    </BaseCard>

    <!-- Floating Preview -->
    <div 
      v-if="previewUrl" 
      class="image-preview-overlay"
      @click="previewUrl = null"
    >
      <div class="preview-backdrop"></div>
      <div 
        class="preview-content glass-panel" 
        :style="{ top: previewPos.y + 'px', left: previewPos.x + 'px' }"
        @click.stop
      >
        <div class="preview-img-wrapper">
          <BaseImage :src="previewUrl" alt="Result Preview" fit="contain" />
        </div>
        <BaseButton size="sm" variant="ghost" class="close-preview" @click="previewUrl = null">
          <X :size="16" />
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ImageIcon, X, List as ListIcon, LayoutGrid, Trash2, Copy, User, Clock } from 'lucide-vue-next';

// 전역 상태 사용 (사용자 입력 필터, 페이지 크기, 보기 모드 유지)
const { filters, pageSize, viewMode } = useJobsState();

import BaseCard from '~/components/ui/BaseCard.vue';
import BaseButton from '~/components/ui/BaseButton.vue';
import BaseInput from '~/components/ui/BaseInput.vue';
import BaseTable from '~/components/ui/BaseTable.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import BaseImage from '~/components/ui/BaseImage.vue';
import BaseCheckbox from '~/components/ui/BaseCheckbox.vue';

definePageMeta({
  title: 'AI 피팅 작업 목록'
});

const config = useRuntimeConfig();
const { data: jobs, pending, refresh: originalRefresh } = await useFetch(`${config.public.apiBase}/api/jobs`, {
  query: filters
});

const visibleJobs = computed(() => {
  const sorted = [...(jobs.value || [])].sort((a, b) => {
    const dateA = new Date(a.sysRegDtm).getTime();
    const dateB = new Date(b.sysRegDtm).getTime();
    return sortOrder.value === 'desc' ? dateB - dateA : dateA - dateB;
  });
  return sorted.slice(0, pageSize.value);
});
const hasMore = computed(() => (jobs.value || []).length > pageSize.value);

const refresh = () => {
  pageSize.value = 15;
  selectedJobs.value = [];
  originalRefresh();
};

const sortOrder = ref('desc'); // 최신순이 기본값

const previewUrl = ref<string | null>(null);
const previewPos = reactive({ x: 0, y: 0 });

const togglePreview = (event: MouseEvent, url: string) => {
  if (previewUrl.value === url) {
    previewUrl.value = null;
    return;
  }
  
  previewUrl.value = url;
};

const columns = [
  { key: 'requestId', label: '요청 ID' },
  { key: 'owner', label: '파트너' },
  { key: 'userId', label: '사용자 ID' },
  { key: 'status', label: '상태' },
  { key: 'sysRegDtm', label: '요청 시간' },
];

// Selection State
const selectedJobs = ref<any[]>([]);
const deleting = ref(false);

const isSelected = (job: any) => {
  return selectedJobs.value.some(item => item.requestId === job.requestId);
};

const toggleSelection = (job: any) => {
  const index = selectedJobs.value.findIndex(item => item.requestId === job.requestId);
  if (index > -1) {
    selectedJobs.value.splice(index, 1);
  } else {
    selectedJobs.value.push(job);
  }
};

const deleteSelectedJobs = async () => {
  if (!confirm(`${selectedJobs.value.length}개의 항목을 삭제하시겠습니까?`)) return;
  
  deleting.value = true;
  try {
    const deletePromises = selectedJobs.value.map(job => 
      $fetch(`${config.public.apiBase}/api/jobs/${job.requestId}`, {
        method: 'DELETE'
      })
    );
    
    await Promise.all(deletePromises);
    alert('삭제되었습니다.');
    refresh();
  } catch (err) {
    console.error('Delete failed:', err);
    alert('삭제 중 오류가 발생했습니다.');
  } finally {
    deleting.value = false;
  }
};

const router = useRouter();
const goToDetail = (row: any) => {
  router.push(`/jobs/${row.requestId}`);
};

const activeTooltipId = ref<string | null>(null);

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    activeTooltipId.value = text;
    setTimeout(() => {
      activeTooltipId.value = null;
    }, 2000);
  } catch (err) {
    console.error('Copy failed:', err);
  }
};

const formatSimpleDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};
</script>

<style scoped>
.jobs-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-controls {
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-panel {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  flex: 1;
  align-items: flex-end;
  border: 1px solid var(--color-border);
}

.filter-grid {
  display: flex;
  gap: 0.75rem;
  flex: 1;
  flex-wrap: wrap;
}

.card-header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.card-header-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text-main);
  opacity: 0.8;
  letter-spacing: -0.01em;
}

.view-toggles-integrated {
  display: flex;
  background: rgba(0, 0, 0, 0.1);
  padding: 3px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  gap: 2px;
}

.toggle-btn-modern {
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
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.toggle-btn-modern:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-main);
}

.toggle-btn-modern.active {
  background: var(--color-primary);
  color: white;
  box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
}

.view-actions-standalone {
  display: flex;
  align-items: center;
}

.jobs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

@media (max-width: 640px) {
  .jobs-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    padding: 0.75rem;
  }
  
  .page-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .filter-panel {
    flex-direction: column;
    align-items: stretch;
    padding: 1rem;
    gap: 1rem;
  }

  .filter-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    width: 100%;
  }
  
  .filter-input-sm {
    width: 100% !important;
  }
  
  .filter-select {
    width: 100% !important;
  }
  
  .search-btn {
    width: 100%;
    height: 44px;
    font-weight: 600;
  }

  .view-actions-standalone {
    width: 100%;
  }

  .view-toggles-integrated {
    display: none !important;
  }
  
  .delete-btn {
    width: 100%;
    margin-right: 0;
    justify-content: center;
    height: 40px;
  }
}

.job-thumb-card {
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.job-thumb-card.selected {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.05);
}

.job-thumb-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-primary);
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.3);
}

.thumb-container {
  aspect-ratio: 3/4;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-md);
  overflow: hidden;
  position: relative;
}

.thumb-checkbox {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
  display: flex;
  padding: 2px;
}

:root[data-theme="dark"] .thumb-checkbox {
  background: rgba(0, 0, 0, 0.6);
}

.delete-btn {
  margin-right: 0.5rem;
  gap: 0.4rem;
}


.thumb-status {
  position: absolute;
  bottom: 0.5rem; /* 하단으로 이동 */
  right: 0.5rem;  /* 우측으로 이동 */
  background: rgba(0, 0, 0, 0.7);
  padding: 0;
  border-radius: 999px;
  display: flex;
  transform: scale(0.8);
  transform-origin: bottom right; /* 하단 우측 기준 스케일 */
}

.thumb-status :deep(.status-badge) {
  border: none; /* Remove badge internal border for cleaner look */
}

.thumb-info {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--color-bg-surface);
}

@media (max-width: 640px) {
  .thumb-info {
    padding: 0.75rem;
    gap: 0.35rem;
  }
  
  .requestId-row {
    margin-bottom: 0.1rem;
  }
  
  .mono {
    font-size: 0.75rem;
  }
  
  .info-row {
    font-size: 0.7rem;
  }
}

.requestId-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.2rem;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-btn {
  padding: 4px;
  border-radius: 4px;
  color: var(--color-text-muted);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.copy-btn:hover {
  background: rgba(var(--color-primary-rgb), 0.1);
  color: var(--color-primary);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.info-icon {
  opacity: 0.6;
  flex-shrink: 0;
}

.copy-container {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.copy-tooltip {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
  z-index: 100;
}

.copy-tooltip::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid var(--color-primary);
}

.fade-up-enter-active, .fade-up-leave-active {
  transition: all 0.2s ease-out;
}
.fade-up-enter-from {
  opacity: 0;
  transform: translate(-50%, 5px);
}
.fade-up-leave-to {
  opacity: 0;
  transform: translate(-50%, -3px);
}

.mono {
  color: var(--color-primary);
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: -0.02em;
  transition: all 0.2s;
}

.mono.clickable {
  cursor: pointer;
}

.mono.clickable:hover {
  text-decoration: underline;
  color: var(--color-primary-light, #818cf8);
}

.owner {
  font-weight: 500;
  color: var(--color-text-main);
}

.date {
  font-size: 0.75rem;
  opacity: 0.8;
}
.text-muted { color: var(--color-text-muted); }

.filter-input-sm {
  width: 200px;
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
.load-more {
  display: flex;
  justify-content: center;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.request-id-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-btn {
  padding: 0;
  width: 28px;
  height: 28px;
  color: var(--color-primary);
}

.image-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.preview-content {
  position: relative;
  z-index: 1001;
  padding: 0.4rem;
  border-radius: var(--radius-lg);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  display: flex;
  max-width: 95vw;
  max-height: 95vh;
}

.preview-img-wrapper {
  max-width: 100%;
  max-height: calc(95vh - 0.8rem); /* 0.8rem for padding */
  width: auto;
  height: auto;
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
}

.close-preview {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  padding: 0;
  color: white;
  transition: all 0.2s;
}

.close-preview:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}
</style>
