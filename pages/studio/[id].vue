<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  Upload, 
  Sparkles, 
  Trash2, 
  Search, 
  Check, 
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  X,
  ChevronDown,
  ImageIcon
} from 'lucide-vue-next';

interface PoseState {
  id: string;
  name: string;
  type: 'front' | 'back';
  gender: string;
  status: 'idle' | 'pending' | 'processing' | 'done' | 'error';
  requestId: string | null;
  resultUrl: string | null;
}

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const apiBase = config.public.apiBase;
const jobId = route.params.id as string;

// --- State Management ---
const currentGender = ref<string>('female');
const selectedProductType = ref<string>('base');
const promptText = ref('');
const topImage = ref<string | null>(null);
const bottomImage = ref<string | null>(null);
const viewingPoseId = ref<string | null>(null);
const viewingHistoryUrl = ref<string | null>(null);
const isImageViewerOpen = ref(false);
const isLoadingData = ref(true);
const userIdValue = ref('-');
const regDtm = ref('-');
const statusValue = ref('-');

const genderTabs = [
  { id: 'female', name: '여성' },
  { id: 'male', name: '남성' },
  { id: 'mannequin', name: '마네킹' }
];

const productTypeOptions = [
  { label: '전체의상', value: 'base' },
  { label: '상의', value: 'top' },
  { label: '하의', value: 'bottom' }
];

const poseStates = reactive<PoseState[]>([
  { id: 'A', name: '여성 A', type: 'front', gender: 'female', status: 'idle', requestId: null, resultUrl: null },
  { id: 'B', name: '여성 B', type: 'front', gender: 'female', status: 'idle', requestId: null, resultUrl: null },
  { id: 'C', name: '여성 C', type: 'back', gender: 'female', status: 'idle', requestId: null, resultUrl: null },
  { id: 'D', name: '여성 D', type: 'back', gender: 'female', status: 'idle', requestId: null, resultUrl: null },
  { id: 'A', name: '남성 A', type: 'front', gender: 'male', status: 'idle', requestId: null, resultUrl: null },
  { id: 'B', name: '남성 B', type: 'front', gender: 'male', status: 'idle', requestId: null, resultUrl: null },
  { id: 'C', name: '남성 C', type: 'back', gender: 'male', status: 'idle', requestId: null, resultUrl: null },
  { id: 'D', name: '남성 D', type: 'back', gender: 'male', status: 'idle', requestId: null, resultUrl: null },
  { id: 'A', name: '마네킹 A', type: 'front', gender: 'mannequin', status: 'idle', requestId: null, resultUrl: null },
  { id: 'B', name: '마네킹 B', type: 'front', gender: 'mannequin', status: 'idle', requestId: null, resultUrl: null },
  { id: 'C', name: '마네킹 C', type: 'back', gender: 'mannequin', status: 'idle', requestId: null, resultUrl: null },
  { id: 'D', name: '마네킹 D', type: 'back', gender: 'mannequin', status: 'idle', requestId: null, resultUrl: null },
]);

const selectedPoseIds = ref<string[]>([]);
const poseGroupId = ref(jobId);
const cumulativeHistory = ref<{poseId: string, gender: string, url: string, requestId: string}[]>([]);
const logs = ref<any[]>([]);

// --- Computed ---
const filteredPoses = computed(() => poseStates.filter((p: PoseState) => p.gender === currentGender.value));
const allGenerating = computed(() => poseStates.some((p: PoseState) => p.status === 'pending' || p.status === 'processing'));

const displayImageUrl = computed(() => {
  if (viewingHistoryUrl.value) return viewingHistoryUrl.value;
  const currentPose = filteredPoses.value.find((p: PoseState) => p.id === viewingPoseId.value);
  return currentPose?.resultUrl || null;
});

const historyList = computed(() => {
  return cumulativeHistory.value
    .filter((h: any) => h.poseId === viewingPoseId.value && h.gender === currentGender.value)
    .map((h: any) => ({
      url: h.url,
      requestId: h.requestId,
      current: viewingHistoryUrl.value ? viewingHistoryUrl.value === h.url : h.url === filteredPoses.value.find((p: PoseState) => p.id === h.poseId)?.resultUrl
    })).reverse();
});

const hasHistoryOrIsDone = (poseId: string) => {
  const pose = poseStates.find((p: PoseState) => p.id === poseId && p.gender === currentGender.value);
  if (pose?.status === 'done') return true;
  return cumulativeHistory.value.some((h: any) => h.poseId === poseId && h.gender === currentGender.value);
};

// --- Data Fetching ---
const loadJobData = async () => {
  try {
    isLoadingData.value = true;
    const res = await fetch(`${apiBase}/api/studio/jobs/${jobId}`);
    if (res.ok) {
      const data = await res.json();
      const jobList = data.jobs || [];
      logs.value = data.logs || [];

      if (jobList.length > 0) {
        const first = jobList[0];
        currentGender.value = first.gender || 'female';
        selectedProductType.value = first.productType || 'base';
        promptText.value = first.prompt || '';
        userIdValue.value = first.userId || '-';
        regDtm.value = first.sysRegDtm || '-';
        
        // Calculate group status
        const statuses = jobList.map((j: any) => j.status?.toUpperCase());
        if (statuses.some((s: string) => s === 'PROCESSING' || s === 'PENDING')) statusValue.value = 'PROCESSING';
        else if (statuses.every((s: string) => s === 'SUCCESS' || s === 'DONE' || s === 'COMPLETED')) statusValue.value = 'DONE';
        else if (statuses.some((s: string) => s === 'ERROR' || s === 'FAILED')) statusValue.value = 'ERROR';
        else statusValue.value = statuses[0] || '-';

        // Set initial viewing pose if none selected
        if (!viewingPoseId.value && first.slot) {
          viewingPoseId.value = first.slot;
        }

        // Reconstruct pose states and history
        jobList.forEach((job: any) => {
          // If job gender is null, default to the detected group gender
          const jobGender = job.gender || currentGender.value;
          const pose = poseStates.find((p: PoseState) => 
            p.id === job.slot && 
            p.gender.toLowerCase() === jobGender.toLowerCase()
          );
          
          // Populate input product images (move outside pose check to ensure visibility)
          if (job.productImageUrl) {
            if (job.slot === 'A' || job.slot === 'B') topImage.value = job.productImageUrl;
            if (job.slot === 'C' || job.slot === 'D') bottomImage.value = job.productImageUrl;
          }

          if (pose) {
            const s = job.status?.toLowerCase();
            if (s === 'success' || s === 'done' || s === 'completed') {
               pose.status = 'done';
            } else if (s === 'error' || s === 'failed' || s === 'blocked') {
               pose.status = 'error';
            } else {
               pose.status = 'processing';
            }
            pose.resultUrl = job.resultUrl;
            pose.requestId = job.requestId;
            
            if (job.resultUrl && !cumulativeHistory.value.find((h: any) => h.requestId === job.requestId)) {
              cumulativeHistory.value.push({
                 poseId: pose.id,
                 gender: pose.gender,
                 url: job.resultUrl,
                 requestId: job.requestId
              });
            }
          }
        });
        
        // Set initial view
        const firstDone = poseStates.find((p: PoseState) => p.gender === currentGender.value && p.status === 'done');
        if (firstDone) viewingPoseId.value = firstDone.id;
        else if (filteredPoses.value.length > 0) viewingPoseId.value = filteredPoses.value[0].id;
      }
    }
  } catch (e) {
    console.error('Failed to load job data:', e);
  } finally {
    isLoadingData.value = false;
  }
};

onMounted(() => {
  loadJobData();
});

// --- Actions ---
const togglePoseSelection = (id: string) => {
  const idx = selectedPoseIds.value.indexOf(id);
  if (idx > -1) selectedPoseIds.value.splice(idx, 1);
  else selectedPoseIds.value.push(id);
};

const getSampleImageUrl = (poseId: string) => {
  const pose = filteredPoses.value.find((p: PoseState) => p.id === poseId);
  const typeStr = pose?.type === 'front' ? 'front' : 'rear';
  return `https://ai-fitting-studio-images.s3.ap-northeast-2.amazonaws.com/sample/${currentGender.value}-${selectedProductType.value}-${typeStr}_${poseId.toLowerCase()}.jpg`;
};

// --- Generation Logic (Similar to upload.vue) ---
let pollTimer: any = null;
const startPolling = () => { if (!pollTimer) pollTimer = setInterval(fetchJobStatuses, 3000); };
const stopPolling = () => { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } };

const fetchJobStatuses = async () => {
  const pendingPoses = poseStates.filter((p: PoseState) => p.requestId && (p.status === 'pending' || p.status === 'processing'));
  if (pendingPoses.length === 0) return stopPolling();

  try {
    const res = await fetch(`${apiBase}/api/studio/jobs/${poseGroupId.value}`);
    if (res.ok) {
      const data = await res.json();
      data.forEach((job: any) => {
        const pose = poseStates.find((p: PoseState) => p.requestId === job.requestId);
        if (pose) {
          const s = job.status.toLowerCase();
          if (s === 'success' || s === 'completed' || s === 'done') {
            pose.status = 'done';
            if (job.resultUrl) {
              pose.resultUrl = job.resultUrl;
              if (!cumulativeHistory.value.find((h: any) => h.requestId === job.requestId)) {
                cumulativeHistory.value.push({
                   poseId: pose.id,
                   gender: pose.gender,
                   url: job.resultUrl,
                   requestId: job.requestId
                });
              }
              if (viewingPoseId.value === pose.id) viewingHistoryUrl.value = null;
            }
          } else if (s === 'error' || s === 'failed') {
            pose.status = 'error';
          } else {
            pose.status = 'processing';
          }
        }
      });
    }
  } catch (e) { console.error('Polling error:', e); }
};

const generateAgain = async () => {
  if (selectedPoseIds.value.length === 0) return;
  // Re-generation logic would typically need the original product image.
  // Since we are in the detail view, we might not have the File object unless we re-upload.
  // For now, we inform that re-generation from detail requires original image context or server-side reuse.
  alert('상세보기에서의 재생성 기능은 현재 준비 중입니다. 업로드 페이지를 이용해 주세요.');
};

const formatDate = (dateStr: string) => {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const d = new Date(dateStr.replace(' ', 'T'));
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}. ${pad(d.getMonth() + 1)}. ${pad(d.getDate())}. ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch (e) {
    return dateStr;
  }
};

definePageMeta({
  title: '스튜디오 작업 상세'
});
</script>

<template>
  <div class="studio-redesign-container">
    <!-- Sidebar: Controls -->
    <aside class="studio-sidebar-v2">
      <div class="sidebar-header-v2">
        <button class="back-list-btn" @click="router.push('/studio')">
           <ArrowLeft :size="16" /> 목록
        </button>
      </div>

      <div class="sidebar-content-v2">
        <!-- Metadata at top -->
        <section class="control-group metadata-section">
          <div class="metadata-header">
            <span class="group-title">기본 정보</span>
          </div>
          <div class="info-item">
            <span class="label">사용자 ID:</span>
            <span class="value">{{ userIdValue }}</span>
          </div>
          <div class="info-item">
            <span class="label">생성일:</span>
            <span class="value">{{ formatDate(regDtm) }}</span>
          </div>
          <div class="info-item">
            <span class="label">상태:</span>
            <span class="value status-text" :class="statusValue.toLowerCase()">{{ statusValue }}</span>
          </div>
        </section>

        <!-- Clothing Display Row (Read-only for detail view) -->
        <section class="control-group">
          <div class="group-header">
            <label class="group-title">의류 이미지 (입력)</label>
          </div>
          
          <div class="upload-slots-row">
            <!-- Top Image Display -->
            <div class="upload-area-v2 static">
              <template v-if="topImage">
                <div class="image-preview-v2">
                  <img :src="topImage" class="preview-img" />
                </div>
              </template>
              <div v-else class="upload-placeholder-v2">
                <div class="placeholder-icon"><ImageIcon :size="20" /></div>
                <span>전면 이미지 없음</span>
              </div>
            </div>

            <!-- Bottom Image Display -->
            <div class="upload-area-v2 static">
              <template v-if="bottomImage">
                <div class="image-preview-v2">
                  <img :src="bottomImage" class="preview-img" />
                </div>
              </template>
              <div v-else class="upload-placeholder-v2">
                <div class="placeholder-icon"><ImageIcon :size="20" /></div>
                <span>후면 이미지 없음</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Product & Gender Selection -->
        <section class="control-group selection-group">
          <div class="group-header flex-row-header">
            <label class="group-title">피팅 모델 및 부위</label>
            <div class="modern-select-wrapper narrow">
              <select v-model="selectedProductType" class="modern-select-v2">
                <option v-for="opt in productTypeOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <ChevronDown class="select-icon-v2" :size="14" />
            </div>
          </div>
          
          <div class="selection-tabs-row">
            <div class="pose-tabs-v2 thin">
              <button v-for="t in genderTabs" :key="t.id"
                      class="pose-tab" :class="{ active: currentGender === t.id }"
                      @click="currentGender = t.id">
                {{ t.name }}
              </button>
            </div>
          </div>

          <div class="pose-grid-v2">
            <div 
              v-for="p in filteredPoses" 
              :key="p.id" 
              class="pose-card-v2"
              :class="{ 
                'active': selectedPoseIds.includes(p.id),
                'has-result': p.status === 'done'
              }"
              @click="togglePoseSelection(p.id)"
            >
              <div class="pose-thumb-v2">
                <img :src="getSampleImageUrl(p.id)" :alt="p.name" />
                <div v-if="p.status === 'done'" class="pose-done-check">
                  <Check :size="16" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Removed: Logs Section -->

        <!-- Prompt Display -->
        <section class="control-group prompt-group">
          <div class="group-header">
            <label class="group-title">생성 옵션 (프롬프트)</label>
          </div>
          <textarea 
            readonly
            v-model="promptText" 
            class="modern-textarea read-only" 
            placeholder="프롬프트 없음"
          ></textarea>
        </section>
      </div>

      <div class="sidebar-footer-v2">
        <button 
          class="generate-action-btn"
          :disabled="selectedPoseIds.length === 0"
          @click="generateAgain"
        >
          <span>지금 생성</span>
        </button>
      </div>
    </aside>

    <!-- Main Content: Preview & History -->
    <main class="studio-main-v2">
      <div class="main-layout-v2">
        <div class="preview-stage-v2">
          <div class="preview-card-v2 shadow-premium" :class="{ 'generating-vibe': allGenerating }">
            <!-- Inline Pose View Selector (Inside the card) -->
            <div class="pose-view-selector-v2">
              <button 
                v-for="p in filteredPoses" 
                :key="p.id"
                class="view-tab"
                :class="{ active: viewingPoseId === p.id }"
                :disabled="!hasHistoryOrIsDone(p.id)"
                @click="viewingPoseId = p.id; viewingHistoryUrl = null"
              >
                {{ p.id }}
              </button>
            </div>

            <div v-if="isLoadingData" class="loading-overlay">
               <div class="loader"></div>
               <p>작업 데이터를 불러오는 중...</p>
            </div>

            <div v-else-if="displayImageUrl" class="result-image-wrapper">
              <div class="img-inner-wrap">
                <img :src="displayImageUrl" class="result-img animate-scale-up" />
                <button class="hover-zoom-btn" @click="isImageViewerOpen = true">
                  <Search :size="18" />
                </button>
              </div>
            </div>

            <div v-else class="empty-preview-v2">
              <div class="empty-overlay">
                <p class="empty-hint">생성된 이미지가 없습니다</p>
              </div>
            </div>
          </div>
        </div>

        <!-- History Gallery -->
        <div class="results-gallery-v2 shadow-premium">
          <div class="gallery-scroller-v2" :class="{ 'centered': historyList.length === 0 }">
            <div v-for="(item, idx) in historyList" :key="idx" 
                 class="gallery-item-v2" 
                 :class="{ active: item.current }" 
                 @click="viewingHistoryUrl = item.url">
              <img :src="item.url" />
              <div v-if="item.current" class="latest-dot"></div>
            </div>
            <div v-if="historyList.length === 0" class="empty-gallery-msg">
              이 포즈의 생성 내역이 없습니다.
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Image Viewer Modal -->
    <div v-if="isImageViewerOpen" class="image-zoom-overlay" @click="isImageViewerOpen = false">
      <div class="zoom-content" @click.stop>
        <img :src="displayImageUrl || ''" class="zoom-img" />
        <button class="zoom-close-btn" @click="isImageViewerOpen = false"><X /></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.studio-redesign-container {
  display: flex;
  height: calc(100vh - 120px);
  background: transparent;
  color: #333;
  overflow: hidden;
}

.studio-sidebar-v2 {
  width: 500px;
  flex-shrink: 0;
  z-index: 5;
  background: #ffffff;
  border-radius: 20px;
  margin-right: 1.5rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

.sidebar-header-v2 { padding: 1.5rem; display: flex; align-items: center; border-bottom: 1px solid #f5f5f5; gap: 1rem; }
.back-list-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 0.85rem; font-weight: 600; color: #666; background: transparent; border: none; cursor: pointer; border-radius: 8px; transition: all 0.2s; }
.back-list-btn:hover { background: #f5f5f5; color: #111; }

.header-title {
  font-weight: 800;
  font-size: 1.1rem;
}

.sidebar-content-v2 {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.control-group { background: #fafafa; padding: 1.25rem; border-radius: 16px; }
.group-header { margin-bottom: 1rem; }
.group-title { font-size: 0.95rem; font-weight: 800; display: block; }
.group-subtitle { font-size: 0.75rem; color: #888; margin-top: 2px; display: block; }

.info-item { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.9rem; }
.info-item .label { color: #888; font-weight: 600; min-width: 80px; }
.info-item .value { font-weight: 700; color: #111; }
.info-item .value.status-text { font-weight: 800; }
.info-item .value.status-text.processing { color: #f59e0b; }
.info-item .value.status-text.done { color: #10b981; }
.info-item .value.status-text.error { color: #ef4444; }

.metadata-section { background: #fefefe; padding: 1rem; border-radius: 12px; border: 1px solid #f0f0f0; }
.metadata-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
.flex-row-header { display: flex; justify-content: space-between; align-items: center; }

.upload-slots-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.5rem; }
.upload-area-v2 { aspect-ratio: 1/1.1; background: #fafafa; border: 2px dashed #eee; border-radius: 14px; position: relative; overflow: hidden; }
.upload-area-v2.static { cursor: default; border-style: solid; background: #fff; }
.image-preview-v2 { width: 100%; height: 100%; }
.preview-img { width: 100%; height: 100%; object-fit: cover; }
.upload-placeholder-v2 { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; color: #bbb; font-size: 0.75rem; font-weight: 600; }
.placeholder-icon { color: #ddd; }

.selection-tabs-row { display: flex; align-items: center; gap: 8px; margin-bottom: 1rem; }
.pose-tabs-v2.thin { flex: 1; margin-bottom: 0; }
.modern-select-wrapper.narrow { width: 110px; margin-bottom: 0; }
.modern-select-v2 { appearance: none; background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 6px 28px 6px 10px; font-size: 0.8rem; font-weight: 700; color: #333; width: 100%; cursor: pointer; outline: none; opacity: 1; }
.select-icon-v2 { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: #888; pointer-events: none; }

.pose-tabs-v2 { display: flex; background: #f0f0f0; padding: 4px; border-radius: 10px; gap: 4px; }
.pose-tab { flex: 1; padding: 8px 6px; font-size: 0.8rem; font-weight: 700; color: #888; border-radius: 8px; transition: all 0.2s; background: transparent; border: none; cursor: pointer; }
.pose-tab.active { background: #fff; color: #111; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }

.pose-grid-v2 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.pose-card-v2 { aspect-ratio: 1/1.4; border-radius: 10px; overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; position: relative; }
.pose-card-v2.active { border-color: #5c7cfa; transform: scale(1.02); }
.pose-thumb-v2 { width: 100%; height: 100%; background: #eee; }
.pose-thumb-v2 img { width: 100%; height: 100%; object-fit: cover; }
.pose-done-check { position: absolute; bottom: 6px; right: 6px; background: #5c7cfa; color: #fff; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }

.prompt-group { margin-top: 1rem; }
.modern-textarea { background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 1rem; font-size: 0.9rem; resize: none; min-height: 120px; transition: all 0.2s; outline: none; line-height: 1.5; color: #444; width: 100%; box-sizing: border-box; }
.modern-textarea.read-only { background: #f9f9f9; color: #666; cursor: default; }

.sidebar-footer-v2 { padding: 1.5rem 2rem; border-top: 1px solid #f5f5f5; background: #ffffff; }
.generate-action-btn { width: 100%; height: 52px; background: #ccc; color: #fff; border-radius: 12px; font-size: 1rem; font-weight: 800; display: flex; align-items: center; justify-content: center; border: none; transition: background 0.2s; }
.generate-action-btn:not(:disabled) { background: #111; cursor: pointer; }

.studio-main-v2 { flex: 1; padding: 0 1.5rem; display: flex; flex-direction: column; overflow: hidden; }
.main-layout-v2 { display: flex; flex-direction: column; gap: 1.5rem; width: 100%; max-width: 1200px; margin: 0 auto; height: 100%; }

.preview-stage-v2 { flex: 1; display: flex; flex-direction: column; padding-top: 10px; min-height: 0; }
.preview-card-v2 { width: 100%; flex: 1; background: #fff; border-radius: 20px; position: relative; display: flex; align-items: center; justify-content: center; z-index: 1; min-height: 0; }
.generating-vibe::before { content: ''; position: absolute; inset: -3px; background: linear-gradient(45deg, #ff4d4f, #5c7cfa, #00d2ff, #7e5bef, #ff4d4f); background-size: 400% 400%; z-index: -1; border-radius: 23px; animation: border-gradient-wave 3s ease infinite; filter: blur(2px); }
.generating-vibe::after { content: ''; position: absolute; inset: 1px; background: #fff; z-index: -1; border-radius: 19px; }

.pose-view-selector-v2 { position: absolute; top: 1.5rem; right: 1.5rem; display: flex; gap: 6px; z-index: 10; padding: 4px; background: rgba(255,255,255,0.8); backdrop-filter: blur(8px); border-radius: 12px; border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
.view-tab { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 900; color: #888; border-radius: 8px; border: none; background: transparent; cursor: pointer; transition: all 0.2s; }
.view-tab.active { background: #111; color: #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
.view-tab:disabled { opacity: 0.3; cursor: not-allowed; }

.result-image-wrapper { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 2rem; box-sizing: border-box; }
.img-inner-wrap { position: relative; height: 100%; }
.result-img { height: 100%; width: auto; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
.hover-zoom-btn { position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.8); border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }

.results-gallery-v2 { height: 180px; background: #fff; border-radius: 20px; padding: 1rem; margin-bottom: 1.5rem; }
.gallery-scroller-v2 { height: 100%; display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; }
.gallery-item-v2 { flex-shrink: 0; width: 110px; height: 100%; border-radius: 12px; overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; position: relative; }
.gallery-item-v2.active { border-color: #5c7cfa; }
.gallery-item-v2 img { width: 100%; height: 100%; object-fit: cover; }
.latest-dot { position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; border: 2px solid #fff; }
.gallery-scroller-v2.centered { justify-content: center; align-items: center; }
.empty-gallery-msg { color: #888; font-size: 0.9rem; font-weight: 600; width: 100%; text-align: center; }

.shadow-premium {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.03) !important;
}

.image-zoom-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.zoom-content { position: relative; max-width: 90vw; max-height: 90vh; }
.zoom-img { max-width: 100%; max-height: 90vh; object-fit: contain; }
.zoom-close-btn { position: absolute; top: -40px; right: 0; color: #fff; font-size: 2rem; }

.loading-overlay { display: flex; flex-direction: column; align-items: center; gap: 1rem; color: #888; }
.loader { border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 2s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.empty-preview-v2 { color: #ccc; text-align: center; }
</style>
