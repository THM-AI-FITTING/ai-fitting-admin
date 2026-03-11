<template>
  <div class="studio-list-page">
    <div class="page-controls animate-fade-in stagger-1">
      <div class="filter-panel glass-panel">
        <div class="filter-grid">
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
            <option value="DONE">완료 (DONE)</option>
            <option value="PROCESSING">진행 중 (PROCESSING)</option>
            <option value="FAILED">실패 (FAILED)</option>
          </select>
          <select v-model="sortOrder" class="filter-select">
            <option value="desc">최신순</option>
            <option value="asc">등록순</option>
          </select>
        </div>
        <div class="filter-actions">
          <Transition name="fade-slide">
            <BaseButton 
              v-if="selectedGroups.length > 0"
              variant="danger" 
              class="delete-btn"
              :loading="deleting"
              @click="deleteSelectedGroups"
            >
              <Trash2 :size="18" />
              {{ selectedGroups.length }}개 삭제
            </BaseButton>
          </Transition>
          <BaseButton variant="ghost" @click="refresh()" title="새로고침">
            <RefreshCw :size="18" :class="{ 'spin': pending }" />
          </BaseButton>
          <BaseButton variant="primary" @click="router.push('/studio/upload')">
            <Sparkles :size="18" />
            새 작업
          </BaseButton>
        </div>
      </div>
    </div>

    <BaseCard class="animate-fade-in stagger-2">


      <div v-if="pending && !jobs.length" class="loading-state">
        <div class="loader"></div>
        <p>데이터를 불러오는 중입니다...</p>
      </div>

      <!-- List View -->
      <BaseTable 
        v-else-if="viewMode === 'list'"
        :columns="columns" 
        :data="visibleJobs" 
        :show-checkbox="true"
        v-model:selected-items="selectedGroups"
        @row-click="goToDetail"
      >
        <template #poseGroupId="{ row }">
          <div class="id-cell">
            <span class="id-text" @click.stop="copyToClipboard(row.poseGroupId)">{{ row.poseGroupId.split('-')[0] }}</span>
            <BaseButton 
              v-if="row.thumbnailUrl"
              size="sm" 
              variant="ghost" 
              class="preview-btn"
              @click.stop="togglePreview($event, row.thumbnailUrl)"
            >
              <ImageIcon :size="16" />
            </BaseButton>
          </div>
        </template>
        <template #status="{ row }">
          <StatusBadge :status="row.status" />
        </template>
        <template #poses="{ row }">
          <div class="pose-badges">
             <span v-if="row.slots" class="mini-pose-badge">{{ row.slots.length }} Poses</span>
          </div>
        </template>
        <template #createdAt="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </BaseTable>

      <!-- Grid View -->
      <div v-else class="studio-grid">
        <div 
          v-for="job in visibleJobs" 
          :key="job.poseGroupId" 
          class="studio-item-card glass-panel"
          :class="{ selected: isSelected(job) }"
          @click="goToDetail(job)"
        >
          <div class="thumb-wrapper">
             <img v-if="job.thumbnailUrl" :src="job.thumbnailUrl" class="grid-thumb" />
             <div v-else class="thumb-placeholder"><ImageIcon :size="32" /></div>
            <div class="item-status">
              <StatusBadge :status="job.status" size="sm" />
            </div>
            <div class="thumb-checkbox" @click.stop>
              <BaseCheckbox 
                :model-value="isSelected(job)" 
                @change="toggleSelection(job)" 
              />
            </div>
          </div>
          <div class="item-info">
            <div class="item-footer">
              <span class="item-date">{{ formatDate(job.createdAt) }}</span>
              <span class="item-poses">{{ job.slots?.length || 0 }} Poses</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasMore" class="load-more">
        <BaseButton variant="ghost" @click="pageSize += 12">더보기</BaseButton>
      </div>
    </BaseCard>

    <!-- Floating Preview -->
    <div v-if="previewUrl" class="image-preview-overlay" @click="previewUrl = null">
      <div class="preview-backdrop"></div>
      <div class="preview-content glass-panel" @click.stop>
        <img :src="previewUrl" alt="Preview" />
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
import { LayoutGrid, List as ListIcon, Sparkles, ImageIcon, Trash2, X } from 'lucide-vue-next';
import BaseCard from '~/components/ui/BaseCard.vue';
import BaseButton from '~/components/ui/BaseButton.vue';
import BaseInput from '~/components/ui/BaseInput.vue';
import BaseTable from '~/components/ui/BaseTable.vue';
import StatusBadge from '~/components/ui/StatusBadge.vue';
import BaseCheckbox from '~/components/ui/BaseCheckbox.vue';

definePageMeta({
  title: '스튜디오 작업 목록'
});

const router = useRouter();
const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

// States
const viewMode = ref<'grid' | 'list'>('grid');
const pageSize = ref(12);
const sortOrder = ref('desc');
const filters = reactive({
  owner: '',
  userId: '',
  status: ''
});

const { data: rawJobs, pending, refresh: originalRefresh } = await useFetch<any[]>(`${apiBase}/api/studio/groups`);

const jobs = computed(() => {
  if (!rawJobs.value) return [];
  let list = [...rawJobs.value];
  
  // Apply Filters
  if (filters.owner) list = list.filter(j => j.owner?.includes(filters.owner));
  if (filters.userId) list = list.filter(j => j.userId?.includes(filters.userId));
  if (filters.status) list = list.filter(j => j.status === filters.status);
  // Apply Sort
  return list.sort((a,b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder.value === 'desc' ? dateB - dateA : dateA - dateB;
  });
});

const visibleJobs = computed(() => jobs.value.slice(0, pageSize.value));
const hasMore = computed(() => jobs.value.length > pageSize.value);

const refresh = () => {
  pageSize.value = 12;
  selectedGroups.value = [];
  originalRefresh();
};

// Selection
const selectedGroups = ref<any[]>([]);
const deleting = ref(false);
const isSelected = (job: any) => selectedGroups.value.some(g => g.poseGroupId === job.poseGroupId);
const toggleSelection = (job: any) => {
  const idx = selectedGroups.value.findIndex(g => g.poseGroupId === job.poseGroupId);
  if (idx > -1) selectedGroups.value.splice(idx, 1);
  else selectedGroups.value.push(job);
};

const deleteSelectedGroups = async () => {
  if (!confirm(`${selectedGroups.value.length}개의 항목을 삭제하시겠습니까?`)) return;
  deleting.value = true;
  try {
    for (const group of selectedGroups.value) {
      await $fetch(`${apiBase}/api/studio/groups/${group.poseGroupId}`, { method: 'DELETE' });
    }
    alert('삭제가 완료되었습니다.');
    selectedGroups.value = [];
    refresh();
  } catch (e) {
    console.error('삭제 오류:', e);
    alert('삭제 중 오류가 발생했습니다.');
  } finally {
    deleting.value = false;
  }
};

// Preview & Copy
const previewUrl = ref<string | null>(null);
const activeTooltipId = ref<string | null>(null);
const togglePreview = (event: MouseEvent, url: string) => {
  previewUrl.value = previewUrl.value === url ? null : url;
};
const copyToClipboard = async (text: string) => {
  await navigator.clipboard.writeText(text);
  activeTooltipId.value = text;
  setTimeout(() => { activeTooltipId.value = null; }, 2000);
};

const columns = [
  { key: 'poseGroupId', label: '그룹 ID' },
  { key: 'prompt', label: '상품명/프롬프트' },
  { key: 'status', label: '상태' },
  { key: 'poses', label: '포즈' },
  { key: 'createdAt', label: '생성일' },
];

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
};

const goToDetail = (job: any) => {
  router.push(`/studio/${job.poseGroupId}`);
};
</script>

<style scoped>
.studio-list-page { display: flex; flex-direction: column; gap: 1.5rem; }
.filter-panel { display: flex; justify-content: space-between; align-items: flex-end; gap: 1.5rem; padding: 1.5rem; border-bottom: 1px solid var(--color-border); }
.filter-grid { display: flex; gap: 0.75rem; flex: 1; flex-wrap: wrap; }
.filter-input-sm { width: 150px; }
.filter-actions { display: flex; gap: 0.75rem; }

.card-header-actions { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.view-toggles-integrated { display: flex; background: var(--color-bg-alt); padding: 3px; border-radius: 8px; border: 1px solid var(--color-border); gap: 2px; }
.toggle-btn-modern { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; color: var(--color-text-muted); border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.toggle-btn-modern.active { background: var(--color-primary); color: white; box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3); }

.studio-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1.5rem; padding: 1.5rem; }
.studio-item-card { cursor: pointer; transition: all 0.2s; border: 1px solid transparent; display: flex; flex-direction: column; border-radius: 12px; overflow: hidden; background: var(--color-bg-surface); }
.studio-item-card:hover { transform: translateY(-4px); border-color: var(--color-primary); box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.2); }
.studio-item-card.selected { border-color: var(--color-primary); background: rgba(var(--color-primary-rgb), 0.05); }

.thumb-wrapper { aspect-ratio: 3/4; position: relative; background: #eee; overflow: hidden; }
.grid-thumb { width: 100%; height: 100%; object-fit: cover; }
.thumb-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #ccc; }
.item-status { position: absolute; bottom: 8px; right: 8px; }
.thumb-checkbox { position: absolute; top: 8px; right: 8px; border-radius: 4px; padding: 2px; }

.item-info { padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.item-name { font-weight: 600; font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-footer { display: flex; justify-content: space-between; font-size: 0.75rem; color: #888; margin-top: 4px; }

.id-cell { display: flex; align-items: center; gap: 0.5rem; }
.id-text { color: var(--color-primary); font-weight: 700; cursor: pointer; }
.preview-btn { padding: 0; width: 28px; height: 28px; color: var(--color-primary); }

.load-more { display: flex; justify-content: center; padding: 1.5rem; border-top: 1px solid #f0f0f0; }

.image-preview-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
.preview-content { position: relative; max-width: 90vw; max-height: 90vh; background: #fff; padding: 4px; border-radius: 12px; }
.preview-content img { max-width: 100%; max-height: 85vh; border-radius: 8px; display: block; }
.close-preview { position: absolute; top: -40px; right: 0; color: #fff; }

.filter-select { background: var(--color-bg-alt); color: var(--color-text-main); border: 1px solid var(--color-border); border-radius: 8px; padding: 0 10px; height: 40px; font-size: 0.9rem; }
.filter-select option { background: var(--color-bg-surface); color: var(--color-text-main); }

.spin { animation: spin 1s linear infinite; }
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
