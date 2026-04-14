<template>
  <div class="muse-list-page">
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

          <select v-model="sortBy" class="filter-select sort-select">
            <option value="latest">최신 등록순</option>
            <option value="oldest">과거 등록순</option>
            <option value="name_asc">이름 가나다순</option>
            <option value="name_desc">이름 역순</option>
          </select>

          <BaseInput 
            v-model="searchQuery" 
            placeholder="뮤즈 이름 검색..." 
            class="filter-input-sm search-input"
          />
          <select v-model="filters.ethnicity" class="filter-select heritage-select">
            <option value="">모든 인종</option>
            <option value="korean">한국인</option>
            <option value="japanese">일본인</option>
            <option value="chinese">중국인</option>
            <option value="nordic">노르딕</option>
            <option value="slavic">슬라빅 (동유럽)</option>
            <option value="french">프렌치</option>
          </select>
        </div>
        <div class="filter-actions">
          <BaseButton variant="primary" style="width: 100%;" @click="router.push('/muse/create')">
            <Plus :size="18" />
            새 뮤즈 생성
          </BaseButton>
        </div>
      </div>
    </div>

    <BaseCard class="animate-fade-in stagger-2">
      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="muse-grid">
        <div 
          v-for="muse in filteredMuses" 
          :key="muse.muse_id" 
          class="muse-item-card glass-panel"
        >
          <div class="thumb-wrapper" @click="router.push(`/muse/create?id=${muse.muse_id}`)">
            <img :src="muse.image_url" class="grid-thumb" />
            <div class="item-actions">
              <BaseButton size="sm" variant="ghost" class="action-btn" @click.stop="deleteMuse(muse.muse_id)">
                <Trash2 :size="16" />
              </BaseButton>
            </div>
          </div>
            <div class="item-info" @click="router.push(`/muse/create?id=${muse.muse_id}`)">
            <div class="name-row">
              <span class="muse-name">{{ muse.name }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-tag">{{ muse.meta_options?.ethnicity || 'Unknown' }}</span>
              <span class="meta-tag">{{ muse.meta_options?.hair_style || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- List View -->
      <BaseTable 
        v-else
        :columns="columns" 
        :data="filteredMuses"
        @row-click="row => router.push(`/muse/create?id=${row.muse_id}`)"
      >
        <template #image_url="{ row }">
          <img :src="row.image_url" class="list-thumb" />
        </template>
        <template #meta_options="{ row }">
          <div class="meta-badges">
            <span class="mini-badge">{{ row.meta_options?.ethnicity || 'Unknown' }}</span>
            <span class="mini-badge">{{ row.meta_options?.hair_style || 'N/A' }}</span>
          </div>
        </template>
        <template #actions="{ row }">
           <BaseButton size="sm" variant="ghost" @click="router.push(`/muse/create?id=${row.muse_id}`)">
             <Settings2 :size="16" />
           </BaseButton>
           <BaseButton size="sm" variant="ghost" @click="deleteMuse(row.muse_id)">
             <Trash2 :size="16" />
           </BaseButton>
        </template>
      </BaseTable>

      <div v-if="filteredMuses.length === 0" class="empty-state">
        <Sparkles :size="48" class="empty-icon" />
        <p>생성된 가상 뮤즈가 없습니다.</p>
        <BaseButton variant="ghost" @click="router.push('/muse/create')">첫 번째 뮤즈 만들기</BaseButton>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { LayoutGrid, List as ListIcon, Plus, Trash2, Sparkles, Settings2 } from 'lucide-vue-next';
import BaseCard from '~/components/ui/BaseCard.vue';
import BaseButton from '~/components/ui/BaseButton.vue';
import BaseInput from '~/components/ui/BaseInput.vue';
import BaseTable from '~/components/ui/BaseTable.vue';
import { useRuntimeConfig, useCookie } from '#app';

definePageMeta({
  title: '✨ 가상 뮤즈 라이브러리'
});

const router = useRouter();

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;
const ownerCookie = useCookie('ai_admin_owner');
const currentUserId = ownerCookie.value || 'dev';

const muses = ref<any[]>([]);

const fetchMuses = async () => {
  try {
    const res = await fetch(`${apiBase}/api/muse/muses?brandId=${currentUserId}`);
    if (res.ok) {
      muses.value = await res.json();
    }
  } catch (e) {
    console.error('Fetch error:', e);
  }
};

onMounted(() => {
  fetchMuses();
});

const viewMode = ref<'grid' | 'list'>('grid');
const searchQuery = ref('');
const sortBy = ref<'latest' | 'oldest' | 'name_asc' | 'name_desc'>('latest');
const filters = reactive({
  ethnicity: ''
});

const filteredMuses = computed(() => {
  let list = muses.value.filter(m => {
    const matchesSearch = (m.name || '').toLowerCase().includes(searchQuery.value.toLowerCase());
    const museEthnicity = m.meta_options?.heritage || m.meta_options?.ethnicity || m.options?.heritage || m.options?.ethnicity || '';
    const matchesEthnicity = !filters.ethnicity || museEthnicity === filters.ethnicity;
    return matchesSearch && matchesEthnicity;
  });

  // 정렬 적용
  list.sort((a, b) => {
    if (sortBy.value === 'latest') {
      return (b.sysRegDtm || '').localeCompare(a.sysRegDtm || '');
    } else if (sortBy.value === 'oldest') {
      return (a.sysRegDtm || '').localeCompare(b.sysRegDtm || '');
    } else if (sortBy.value === 'name_asc') {
      return (a.name || '').localeCompare(b.name || '');
    } else if (sortBy.value === 'name_desc') {
      return (b.name || '').localeCompare(a.name || '');
    }
    return 0;
  });

  return list;
});

const columns = [
  { key: 'image_url', label: '미리보기' },
  { key: 'name', label: '뮤즈 이름' },
  { key: 'meta_options', label: '속성' },
  { key: 'actions', label: '관리' }
];

const deleteMuse = (id: string) => {
  if (confirm('이 뮤즈를 삭제하시겠습니까?')) {
    muses.value = muses.value.filter(m => m.muse_id !== id);
  }
};
</script>

<style scoped>
.muse-list-page { display: flex; flex-direction: column; gap: 1.5rem; }
.filter-panel { display: flex; justify-content: space-between; align-items: flex-end; gap: 1.5rem; padding: 1rem; border: 1px solid var(--color-border); }
.filter-grid { display: flex; gap: 0.75rem; flex: 1; flex-wrap: wrap; }
.filter-input-sm { width: 200px; }

.view-toggles-integrated { display: flex; background: var(--color-bg-alt); padding: 3px; border-radius: 8px; border: 1px solid var(--color-border); gap: 2px; }
.toggle-btn-modern { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; color: var(--color-text-muted); border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.toggle-btn-modern.active { background: var(--color-primary); color: white; box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3); }

.muse-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.5rem; padding: 1.5rem; }
.muse-item-card { cursor: pointer; transition: all 0.2s; border: 1px solid transparent; display: flex; flex-direction: column; border-radius: 12px; overflow: hidden; background: var(--color-bg-surface); }
.muse-item-card:hover { transform: translateY(-4px); border-color: var(--color-primary); box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.2); }

.thumb-wrapper { aspect-ratio: 1/1; position: relative; background: #f0f0f0; overflow: hidden; }
.grid-thumb { width: 100%; height: 100%; object-fit: cover; }
.item-actions { position: absolute; top: 8px; right: 8px; opacity: 0; transition: opacity 0.2s; }
.muse-item-card:hover .item-actions { opacity: 1; }
.action-btn { background: rgba(0,0,0,0.4); color: white; backdrop-filter: blur(4px); }
.action-btn:hover { background: var(--color-danger); }

.item-info { padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.muse-name { font-weight: 700; color: var(--color-text-main); font-size: 1.1rem; }
.meta-row { display: flex; gap: 0.5rem; }
.meta-tag { font-size: 0.75rem; background: var(--color-bg-alt); padding: 2px 8px; border-radius: 4px; color: var(--color-text-muted); border: 1px solid var(--color-border); }

.card-footer-actions { margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.05); }

.list-thumb { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; }
.meta-badges { display: flex; gap: 0.4rem; }
.mini-badge { font-size: 0.7rem; background: var(--color-bg-alt); padding: 1px 6px; border-radius: 4px; }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; color: var(--color-text-muted); gap: 1rem; }
.empty-icon { opacity: 0.2; }

.filter-select { background: var(--color-bg-alt); color: var(--color-text-main); border: 1px solid var(--color-border); border-radius: 8px; padding: 0 10px; height: 40px; font-size: 0.9rem; cursor: pointer; }
.filter-select:hover { border-color: var(--color-primary); }

.sort-select { width: 140px; }
.search-input { width: 220px; }
.heritage-select { width: 150px; }
</style>
