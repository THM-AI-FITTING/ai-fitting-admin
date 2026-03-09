<template>
  <div class="studio-redesign-container">
    
    <!-- Left Sidebar: Controls -->
    <aside class="studio-sidebar-v2">
      <div class="sidebar-content-v2">
        <!-- Clothing Upload Row (Top & Bottom) -->
        <section class="control-group">
          <div class="group-header">
            <label class="group-title">의류 업로드</label>
          </div>
          
          <div class="upload-slots-row">
            <!-- Top Upload -->
            <div class="upload-area-v2" @click="topImage ? null : topInput?.click()">
              <input type="file" ref="topInput" hidden accept="image/*" @change="handleFileUpload($event, 'top')">
              <template v-if="topImage">
                <div class="image-preview-v2">
                  <img :src="topImage" class="preview-img" />
                  <button class="remove-btn-v2" @click.stop="removeImage('top')"><X :size="14" /></button>
                </div>
              </template>
              <div v-else class="upload-placeholder-v2">
                <div class="placeholder-icon"><Upload :size="20" /></div>
                <span>전면 사진 업로드</span>
              </div>
            </div>

            <!-- Bottom Upload -->
            <div class="upload-area-v2" @click="bottomImage ? null : bottomInput?.click()">
              <input type="file" ref="bottomInput" hidden accept="image/*" @change="handleFileUpload($event, 'bottom')">
              <template v-if="bottomImage">
                <div class="image-preview-v2">
                  <img :src="bottomImage" class="preview-img" />
                  <button class="remove-btn-v2" @click.stop="removeImage('bottom')"><X :size="14" /></button>
                </div>
              </template>
              <div v-else class="upload-placeholder-v2">
                <div class="placeholder-icon"><Upload :size="20" /></div>
                <span>후면 사진 업로드</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Model Pose Selection -->
        <section class="control-group">
          <div class="group-header custom-header-row">
            <label class="group-title">모델 포즈 선택</label>
            <div class="modern-select-wrapper">
              <select v-model="selectedProductType" class="modern-select-v2">
                <option v-for="opt in productTypeOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <ChevronDown class="select-icon-v2" :size="14" />
            </div>
          </div>

          <div class="pose-tabs-v2">
            <button v-for="t in genderTabs" :key="t.id"
                    class="pose-tab" :class="{ active: currentGender === t.id }"
                    @click="currentGender = t.id">
              {{ t.name }}
            </button>
          </div>

          <div class="pose-grid-v2">
            <div 
              v-for="p in filteredPoses" 
              :key="p.id" 
              class="pose-card-v2"
              :class="{ 
                'active': selectedPoseIds.includes(p.id),
                'disabled-card': !isPoseClickable(p.type)
              }"
              @click="isPoseClickable(p.type) ? togglePoseSelection(p.id) : null"
            >
              <div class="pose-thumb-v2">
                <img :src="getSampleImageUrl(p.id)" :alt="p.name" />
                <div v-if="p.status === 'processing' || p.status === 'pending'" class="pose-loading-overlay">
                  <div class="mini-spinner"></div>
                </div>
                <div v-if="p.status === 'done'" class="pose-done-check">
                  <Check :size="16" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Prompt Input -->
        <section class="control-group prompt-group">
          <div class="group-header">
            <label class="group-title">생성 옵션 (프롬프트)</label>
          </div>
          <textarea 
            v-model="promptText" 
            class="modern-textarea" 
            placeholder="예: 실크 소재의 느낌을 살려줘, 배경을 더 밝게 해줘 등"
          ></textarea>
        </section>
      </div>

      <div class="sidebar-footer-v2">
        <button 
          class="generate-action-btn"
          :disabled="(!topImage && !bottomImage) || selectedPoseIds.length === 0 || allGenerating"
          @click="generateAllPoses"
        >
          <span>지금 생성</span>
        </button>
      </div>
    </aside>

    <!-- Right Main Content -->
    <main class="studio-main-v2">
      <div class="main-layout-v2">
        <!-- Result Preview (Top) -->
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
                @click="viewingPoseId = p.id"
              >
                {{ p.id }}
              </button>
            </div>

            <div v-if="displayImageUrl" class="result-image-wrapper">
              <div class="img-inner-wrap">
                <img v-if="viewingHistoryUrl || displayImageUrl" :src="viewingHistoryUrl || displayImageUrl || undefined" class="result-img animate-scale-up" />
                <!-- Hover Zoom Button -->
                <button class="hover-zoom-btn" @click="isImageViewerOpen = true">
                  <Search :size="18" />
                </button>
              </div>
            </div>
            <div v-else-if="allGenerating" class="processing-vibe">
              <div class="radiant-loader"></div>
              <p>AI가 당신의 스타일을 디자인하고 있습니다...</p>
            </div>
            <div v-else class="empty-preview-v2">
              <div class="empty-overlay">
                <p class="empty-hint">비어 있음</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Generated Results Gallery (Bottom) -->
        <div class="results-gallery-v2 shadow-premium">
          <div class="gallery-scroller-v2">
            <div v-for="(item, idx) in historyList" :key="idx" 
                 class="gallery-item-v2" 
                 :class="{ active: item.current }" 
                 @click="viewingHistoryUrl = item.url">
              <img :src="item.url" />
              <div v-if="item.current" class="latest-dot"></div>
            </div>
            <div v-if="historyList.length === 0" class="empty-gallery-msg">
              생성된 결과가 여기에 표시됩니다
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Image Viewer Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isImageViewerOpen" class="image-viewer-overlay" @click="isImageViewerOpen = false">
          <div class="image-viewer-content" @click.stop>
            <button class="viewer-close-btn" @click="isImageViewerOpen = false"><X :size="24" /></button>
            <img v-if="viewingHistoryUrl || displayImageUrl" :src="viewingHistoryUrl || displayImageUrl || undefined" class="viewer-img" />
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Alerts -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="alertModal.show" class="alert-overlay-modern" @click="alertModal.show = false">
          <div class="alert-content-modern" @click.stop>
            <div class="alert-icon-box" :class="alertModal.type">
              <AlertCircle v-if="alertModal.type === 'error'" :size="32" />
              <Check v-else :size="32" />
            </div>
            <h3>{{ alertModal.title }}</h3>
            <p>{{ alertModal.message }}</p>
            <button class="alert-close-btn" @click="alertModal.show = false">확인</button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast Notification -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toastVisible" class="modern-toast">
          <div class="toast-icon">
            <Check :size="16" />
          </div>
          <span class="toast-text">{{ toastMsg }}</span>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, watch } from 'vue';
import { 
  Upload, X, Sparkles, Download, History, ChevronRight, 
  ChevronLeft, ChevronDown, Check, AlertCircle, ImageIcon, Search
} from 'lucide-vue-next';
import { useRuntimeConfig, useCookie } from '#app';

definePageMeta({ title: 'AI 스튜디오' });

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;
const ownerCookie = useCookie('ai_admin_owner');
const currentUserId = computed(() => ownerCookie.value || 'dev');

// --- State ---
const currentGender = ref('female');
const promptText = ref('');
const poseGroupId = ref(crypto.randomUUID());

const topImage = ref<string | null>(null);
const bottomImage = ref<string | null>(null);
const selectedFiles = reactive<{ top: File | null, bottom: File | null }>({ top: null, bottom: null });

const selectedPoseIds = ref<string[]>([]);
const viewingPoseId = ref('A');
const viewingHistoryUrl = ref<string | null>(null);
const isImageViewerOpen = ref(false);

interface HistoryItem {
  poseId: string;
  gender: string;
  url: string;
  requestId: string;
}
const cumulativeHistory = ref<HistoryItem[]>([]);

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

const selectedProductType = ref('base');

// --- Toast Notification ---
const toastVisible = ref(false);
const toastMsg = ref('');
let toastTimer: any = null;

const showToast = (msg: string) => {
  toastMsg.value = msg;
  toastVisible.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastVisible.value = false;
  }, 3000);
};

const alertModal = reactive({
  show: false,
  type: 'info' as 'info' | 'error',
  title: '',
  message: '',
});

type JobStatus = 'idle' | 'pending' | 'processing' | 'done' | 'error' | 'failed';

interface PoseState {
  id: string;
  name: string;
  type: 'front' | 'back';
  gender: string;
  status: JobStatus;
  resultUrl: string | null;
  requestId: string | null;
}

// 4 Poses (A, B, C, D) for each gender
const poseStates = reactive<PoseState[]>([
  { id: 'A', name: '여성 A', type: 'front', gender: 'female', status: 'idle', resultUrl: null, requestId: null },
  { id: 'B', name: '여성 B', type: 'front', gender: 'female', status: 'idle', resultUrl: null, requestId: null },
  { id: 'C', name: '여성 C', type: 'back', gender: 'female', status: 'idle', resultUrl: null, requestId: null },
  { id: 'D', name: '여성 D', type: 'back', gender: 'female', status: 'idle', resultUrl: null, requestId: null },
  { id: 'A', name: '남성 A', type: 'front', gender: 'male', status: 'idle', resultUrl: null, requestId: null },
  { id: 'B', name: '남성 B', type: 'front', gender: 'male', status: 'idle', resultUrl: null, requestId: null },
  { id: 'C', name: '남성 C', type: 'back', gender: 'male', status: 'idle', resultUrl: null, requestId: null },
  { id: 'D', name: '남성 D', type: 'back', gender: 'male', status: 'idle', resultUrl: null, requestId: null },
  { id: 'A', name: '마네킹 A', type: 'front', gender: 'mannequin', status: 'idle', resultUrl: null, requestId: null },
  { id: 'B', name: '마네킹 B', type: 'front', gender: 'mannequin', status: 'idle', resultUrl: null, requestId: null },
  { id: 'C', name: '마네킹 C', type: 'back', gender: 'mannequin', status: 'idle', resultUrl: null, requestId: null },
  { id: 'D', name: '마네킹 D', type: 'back', gender: 'mannequin', status: 'idle', resultUrl: null, requestId: null },
]);

const topInput = ref<HTMLInputElement | null>(null);
const bottomInput = ref<HTMLInputElement | null>(null);

// --- Computed ---
const filteredPoses = computed(() => poseStates.filter(p => p.gender === currentGender.value));
const selectedPose = computed(() => filteredPoses.value.find(p => p.id === viewingPoseId.value) || filteredPoses.value[0]);

const historyList = computed(() => {
  return cumulativeHistory.value
    .filter(h => h.poseId === viewingPoseId.value && h.gender === currentGender.value)
    .map(h => ({ 
      url: h.url, 
      current: viewingHistoryUrl.value 
        ? h.url === viewingHistoryUrl.value 
        : h.url === displayImageUrl.value 
    }))
    .reverse();
});

const displayImageUrl = computed(() => {
  if (selectedPose.value?.status === 'done') return selectedPose.value.resultUrl;
  return null;
});

const allGenerating = computed(() => poseStates.some(p => p.status === 'pending' || p.status === 'processing'));

const isReadyForPoseSelection = computed(() => !!topImage.value || !!bottomImage.value);

const isPoseClickable = (poseType: 'front' | 'back') => {
  if (poseType === 'front') return !!topImage.value;
  if (poseType === 'back') return !!bottomImage.value;
  return false;
};

// Returns true if the user has history (either done or in cumulative string)
const hasHistoryOrIsDone = (poseId: string) => {
  const pose = filteredPoses.value.find(p => p.id === poseId);
  if (pose?.status === 'done' || pose?.resultUrl) return true;
  return cumulativeHistory.value.some(h => h.poseId === poseId && h.gender === currentGender.value);
};

// --- Watchers ---
watch(currentGender, () => {
  const firstPose = filteredPoses.value[0];
  selectedPoseIds.value = [];
  viewingPoseId.value = firstPose.id;
  viewingHistoryUrl.value = null;
});

watch(viewingPoseId, () => {
  viewingHistoryUrl.value = null;
});

// --- Actions ---
const handleFileUpload = (event: Event, type: 'top' | 'bottom') => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    if (type === 'top') selectedFiles.top = file;
    else selectedFiles.bottom = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'top') topImage.value = e.target?.result as string;
      else bottomImage.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const removeImage = (type: 'top' | 'bottom') => {
  if (type === 'top') { topImage.value = null; selectedFiles.top = null; }
  else { bottomImage.value = null; selectedFiles.bottom = null; }
};

const togglePoseSelection = (id: string) => {
  const pose = filteredPoses.value.find(p => p.id === id);
  if (!pose || !isPoseClickable(pose.type)) return;
  
  const idx = selectedPoseIds.value.indexOf(id);
  if (idx > -1) {
    selectedPoseIds.value.splice(idx, 1);
  } else {
    selectedPoseIds.value.push(id);
  }
};

const getSampleImageUrl = (poseId: string) => {
  const pose = filteredPoses.value.find(p => p.id === poseId);
  const typeStr = pose?.type === 'front' ? 'front' : 'rear';
  return `https://ai-fitting-studio-images.s3.ap-northeast-2.amazonaws.com/sample/${currentGender.value}-${selectedProductType.value}-${typeStr}_${poseId.toLowerCase()}.jpg`;
};

// --- API Logic ---
let pollTimer: any = null;
const startPolling = () => { if (!pollTimer) pollTimer = setInterval(fetchJobStatuses, 3000); };
const stopPolling = () => { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } };

const fetchJobStatuses = async () => {
  const pendingPoses = poseStates.filter(p => p.requestId && (p.status === 'pending' || p.status === 'processing'));
  if (pendingPoses.length === 0) return stopPolling();

  // Track if this is the first success in the current polling cycle
  let isFirstSuccessInCycle = false;

  try {
    const res = await fetch(`${apiBase}/api/studio/jobs/${poseGroupId.value}`);
    if (res.ok) {
      const data = await res.json();
      const jobs = data.jobs || [];
      jobs.forEach((job: any) => {
        const pose = poseStates.find(p => p.requestId === job.requestId);
        if (pose) {
          const s = job.status.toLowerCase();
          if (s === 'success' || s === 'completed' || s === 'done') {
            const wasNotDone = pose.status !== 'done';
            pose.status = 'done';
            
             if (wasNotDone && !isFirstSuccessInCycle && job.resultUrl) {
                isFirstSuccessInCycle = true;
                showToast(`${pose.id} 포즈 이미지 생성이 완료되었습니다.`);
                // Wait for ui to update before switching
                if (currentGender.value === pose.gender) {
                  viewingPoseId.value = pose.id;
                  viewingHistoryUrl.value = null; // show the newest layout
                }
             }

            if (job.resultUrl) {
              pose.resultUrl = job.resultUrl;
              const exists = cumulativeHistory.value.find(h => h.requestId === job.requestId);
              if (!exists) {
                cumulativeHistory.value.push({
                  poseId: pose.id,
                  gender: pose.gender,
                  url: job.resultUrl,
                  requestId: job.requestId
                });
              }
            }
          } else if (s === 'error' || s === 'blocked' || s === 'failed') {
            pose.status = 'error';
          } else {
            pose.status = 'processing';
          }
        }
      });
      if (!allGenerating.value) stopPolling();
    }
  } catch (e) { console.error('Polling error:', e); }
};

const generateAllPoses = async () => {
  const activeFile = selectedFiles.top || selectedFiles.bottom;
  if (selectedPoseIds.value.length === 0 || !activeFile) return;
  poseGroupId.value = crypto.randomUUID();
  for (const id of selectedPoseIds.value) {
    const pose = filteredPoses.value.find(p => p.id === id);
    if (!pose) continue;
    pose.status = 'pending';
    const formData = new FormData();
    formData.append('poseGroupId', poseGroupId.value);
    formData.append('slot', pose.id);
    formData.append('gender', currentGender.value);
    formData.append('productType', selectedProductType.value);
    formData.append('product', activeFile);
    formData.append('personImageKey', `sample/${currentGender.value}-${selectedProductType.value}-${pose.type === 'front' ? 'front' : 'rear'}_${pose.id.toLowerCase()}.jpg`);
    formData.append('prompt', promptText.value);
    formData.append('userId', currentUserId.value);
    try {
      const res = await fetch(`${apiBase}/api/studio/jobs`, { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        pose.requestId = data.requestId;
        startPolling();
      } else { pose.status = 'error'; }
    } catch (e) { pose.status = 'error'; }
  }
};

const downloadPose = (pose: PoseState) => {
  const targetUrl = viewingHistoryUrl.value || pose.resultUrl;
  if (!targetUrl) return;
  const a = document.createElement('a');
  a.href = targetUrl;
  a.download = `studio-result-${pose.id}.jpg`;
  a.click();
};

const openHistory = (pose: PoseState) => { alert('히스토리를 조회합니다.'); };
onUnmounted(() => stopPolling());
</script>

<style scoped>
.studio-redesign-container {
  display: flex;
  height: calc(100vh - 120px);
  background: transparent;
  color: #333;
  overflow: hidden;
  position: relative;
  font-family: 'Pretendard', sans-serif;
}

.dragging { user-select: none; }

.studio-sidebar-v2 {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 500px;
  z-index: 5;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.04);
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.sidebar-header-v2 {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f5f5f5;
}

.sidebar-title-v2 { font-size: 1.1rem; font-weight: 700; color: #111; }

.sidebar-content-v2 {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
}
.sidebar-content-v2::-webkit-scrollbar { width: 4px; }
.sidebar-content-v2::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }

.control-group { 
  display: flex; 
  flex-direction: column; 
  gap: 0.75rem; 
}
.custom-header-row { display: flex; align-items: center; justify-content: space-between; }
.group-title { font-size: 0.9rem; font-weight: 700; color: #111; }

.modern-select-wrapper { 
  position: relative; 
  display: flex; 
  align-items: center; 
}
.modern-select-v2 { 
  appearance: none;
  background: #f8f9fa;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 4px 28px 4px 10px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #444;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
}
.modern-select-v2:hover { border-color: #ddd; background: #f0f0f0; }
.select-icon-v2 { 
  position: absolute; 
  right: 8px; 
  pointer-events: none; 
  color: #888; 
}

.upload-slots-row { display: flex; gap: 0.75rem; }
.upload-area-v2 {
  flex: 1;
  aspect-ratio: 1/1;
  border: 1.5px dashed #ddd;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #fafafa;
  transition: all 0.2s;
  overflow: hidden;
}

.upload-area-v2:hover { background: #f0f0f0; border-color: #bbb; }
.upload-placeholder-v2 { display: flex; flex-direction: column; align-items: center; gap: 4px; color: #888; font-size: 0.75rem; font-weight: 600; }
.image-preview-v2 { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.preview-img { max-width: 100%; max-height: 100%; object-fit: contain; }
.remove-btn-v2 { position: absolute; top: 4px; right: 4px; background: #fff; border: 1px solid #eee; border-radius: 50%; padding: 3px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; }

.pose-tabs-v2 { display: flex; background: #f5f5f5; padding: 4px; border-radius: 10px; gap: 4px; }
.pose-tab { flex: 1; padding: 6px; font-size: 0.8rem; font-weight: 600; color: #888; border-radius: 8px; transition: all 0.2s; background: transparent; border: none; cursor: pointer; }
.pose-tab.active { background: #fff; color: #111; box-shadow: 0 2px 6px rgba(0,0,0,0.05); }

.pose-grid-v2 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
.pose-thumb-v2 { aspect-ratio: 1/1.4; background: #eee; border-radius: 8px; overflow: hidden; position: relative; cursor: pointer; border: 2px solid transparent; }
.pose-card-v2.active .pose-thumb-v2 { border-color: #5c7cfa; }
.disabled-card {
  opacity: 0.3;
  pointer-events: none;
  filter: grayscale(0.8);
  transition: all 0.3s ease;
}
.pose-thumb-v2 img { width: 100%; height: 100%; object-fit: cover; }

.pose-loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; }
.pose-done-check { position: absolute; bottom: 4px; right: 4px; background: #5c7cfa; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.mini-spinner { width: 16px; height: 16px; border: 2px solid #ddd; border-top-color: #5c7cfa; border-radius: 50%; animation: spin 0.8s linear infinite; }

.modern-textarea { width: 100%; height: 80px; border: 1px solid #eee; border-radius: 12px; padding: 12px; font-size: 0.85rem; resize: none; background: #f8f8f8; outline: none; transition: border-color 0.2s; }
.modern-textarea:focus { border-color: #5c7cfa; }

.disabled-section {
  opacity: 0.4;
  pointer-events: none;
  filter: grayscale(0.5);
  transition: all 0.3s ease;
}

.sidebar-footer-v2 { 
  padding: 1.5rem 2rem;
  border-top: 1px solid #f5f5f5;
  background: #ffffff;
}
.generate-action-btn { width: 100%; height: 52px; background: #ccc; color: #fff; border-radius: 12px; font-size: 1rem; font-weight: 800; display: flex; align-items: center; justify-content: center; border: none; transition: background 0.2s; }
.generate-action-btn:not(:disabled) { background: #111; cursor: pointer; }

.studio-main-v2 { 
  flex: 1; 
  background: transparent; 
  padding: 0 1.5rem; 
  display: flex; 
  flex-direction: column; 
  overflow: hidden; 
}
.main-layout-v2 { 
  display: flex; 
  flex-direction: column; 
  gap: 1.5rem; 
  width: 100%; 
  max-width: 1200px; 
  margin: 0 auto; 
  height: 100%;
}

.preview-stage-v2 { 
  flex: 1; 
  min-height: 0; 
  display: flex; 
  flex-direction: column; 
  gap: 0; 
  padding-top: 10px;
}

.preview-card-v2 { 
  width: 100%; 
  flex: 1; 
  background: #ffffff; 
  border-radius: 20px; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  position: relative; 
  z-index: 1; 
  transition: all 0.5s ease;
  min-height: 0;
}
.shadow-premium { box-shadow: 0 15px 35px rgba(0,0,0,0.05); }

/* Fancy Wave Border Animation */
.generating-vibe::before {
  content: '';
  position: absolute;
  inset: -3px;
  background: linear-gradient(45deg, #ff4d4f, #5c7cfa, #00d2ff, #7e5bef, #ff4d4f);
  background-size: 400% 400%;
  z-index: -1;
  border-radius: 23px;
  animation: border-gradient-wave 3s ease infinite;
  filter: blur(2px);
}

.generating-vibe::after {
  content: '';
  position: absolute;
  inset: 1px;
  background: #ffffff;
  z-index: -1;
  border-radius: 19px;
}

@keyframes border-gradient-wave {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.result-image-wrapper { 
  width: 100%; 
  height: 100%; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  position: relative; 
  padding: 1.5rem; 
  box-sizing: border-box; 
  overflow: hidden;
  border-radius: 20px;
}
.img-inner-wrap { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
.result-img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }

/* Hover Zoom Button */
.hover-zoom-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  z-index: 10;
}
.img-inner-wrap:hover .hover-zoom-btn {
  opacity: 1;
  transform: translateY(0);
}
.hover-zoom-btn:hover {
  background: #5c7cfa;
  color: white;
  border-color: #5c7cfa;
  transform: scale(1.05);
}
.empty-hint { color: #ddd; font-size: 0.9rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }

.pose-view-selector-v2 {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  display: flex;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  padding: 6px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  gap: 6px;
  border: 1px solid rgba(0,0,0,0.05);
  z-index: 20;
}
.view-tab {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-weight: 700;
  font-size: 0.85rem;
  color: #888;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.view-tab:hover:not(:disabled) { background: rgba(0,0,0,0.04); color: #444; }
.view-tab.active { background: #111; color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
.view-tab:disabled { opacity: 0.3; cursor: not-allowed; }

.results-gallery-v2 { 
  background: #ffffff; 
  border-radius: 16px; 
  padding: 1.25rem; 
  color: #111; 
  min-height: 180px;
  display: flex;
  flex-direction: column;
  border: 1px solid #f0f0f0;
}

.empty-gallery-msg {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 0.95rem;
  font-weight: 500;
  border: 2px dashed #f0f0f0;
  border-radius: 12px;
  margin-top: 0;
  background: #fafafa;
  min-height: 120px;
}
.gallery-scroller-v2 { display: flex; gap: 1rem; padding-bottom: 0; align-items: center; }
.gallery-scroller-v2::-webkit-scrollbar { height: 6px; }
.gallery-scroller-v2::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }

.gallery-item-v2 { flex-shrink: 0; width: 130px; aspect-ratio: 1/1.3; background: #f8f9fa; border-radius: 10px; overflow: hidden; cursor: pointer; border: 2px solid transparent; position: relative; transition: all 0.23s ease; }
.gallery-item-v2.active { border-color: #5c7cfa; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(92, 124, 250, 0.15); }
.gallery-item-v2 img { width: 100%; height: 100%; object-fit: cover; }
.latest-dot { position: absolute; top: 6px; right: 6px; width: 6px; height: 6px; background: #5c7cfa; border-radius: 50%; }

.processing-vibe { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; color: #666; }
.radiant-loader { width: 40px; height: 40px; border: 3px solid #eee; border-top-color: #5c7cfa; border-radius: 50%; animation: spin 1s infinite linear; }

.alert-overlay-modern { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center; }
.alert-content-modern { background: white; width: 360px; padding: 2.5rem; border-radius: 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
.alert-icon-box { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.alert-icon-box.info { background: #f0f4ff; color: #5c7cfa; }
.alert-icon-box.error { background: #fff1f0; color: #ff4d4f; }
.alert-close-btn { width: 100%; height: 48px; background: #111; color: #fff; border-radius: 12px; font-weight: 700; border: none; cursor: pointer; margin-top: 0.5rem; }

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes scale-up { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

/* Toast Styles */
.modern-toast {
  position: fixed;
  top: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  background: rgba(17, 17, 17, 0.85);
  backdrop-filter: blur(12px);
  color: #fff;
  padding: 10px 18px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
  min-width: 280px;
}

.toast-icon {
  width: 28px;
  height: 28px;
  background: #10b981;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-text {
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.4;
}

/* Toast Transition */
.toast-enter-active, .toast-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px) scale(0.95);
}

.animate-scale-up { animation: scale-up 0.4s ease-out; }

/* Image Viewer Modal CSS */
.image-viewer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(5px);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
}
.image-viewer-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.viewer-img {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
.viewer-close-btn {
  position: absolute;
  top: -40px;
  right: -40px;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  transition: transform 0.2s;
}
.viewer-close-btn:hover {
  transform: scale(1.1);
}
@media (max-width: 768px) {
  .viewer-close-btn {
    top: 10px;
    right: 10px;
    background: rgba(0,0,0,0.5);
    border-radius: 50%;
  }
}
</style>
