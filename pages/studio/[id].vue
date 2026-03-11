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
  productImageKey: string | null;
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

// --- Slider State ---
const currentSlideIndex = ref(0);
const slideContentRef = ref<HTMLElement | null>(null);

// Dragging logic
const isDragging = ref(false);
const startX = ref(0);
const dragOffset = ref(0);
const isTransitioning = ref(true);

const onDragStart = (e: MouseEvent) => {
  if (historyList.value.length <= 1) return;
  isDragging.value = true;
  startX.value = e.pageX;
  dragOffset.value = 0;
  isTransitioning.value = false;
};

const onDragMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  const currentX = e.pageX;
  dragOffset.value = currentX - startX.value;
};

const onDragEnd = () => {
  if (!isDragging.value) return;
  isDragging.value = false;
  isTransitioning.value = true;

  const threshold = 100;
  if (dragOffset.value < -threshold && currentSlideIndex.value < historyList.value.length - 1) {
    currentSlideIndex.value++;
  } else if (dragOffset.value > threshold && currentSlideIndex.value > 0) {
    currentSlideIndex.value--;
  }
  
  dragOffset.value = 0;
};

// --- Computed ---
const sliderTransform = computed(() => {
  const itemWidth = 55; // Reduced from 85% to 55% for 50% peek
  const gap = 2; 
  const centerOffset = 22.5; // (100 - 55) / 2
  
  const baseTranslate = -currentSlideIndex.value * (itemWidth + gap) + centerOffset;
  const dragTranslate = slideContentRef.value ? (dragOffset.value / slideContentRef.value.offsetWidth) * 100 : 0;
  
  return `translateX(${baseTranslate + dragTranslate}%)`;
});

watch(viewingPoseId, () => {
  currentSlideIndex.value = 0;
  viewingHistoryUrl.value = null;
});

const nextSlide = () => {
  if (currentSlideIndex.value < historyList.value.length - 1) {
    currentSlideIndex.value++;
  }
};

const prevSlide = () => {
  if (currentSlideIndex.value > 0) {
    currentSlideIndex.value--;
  }
};

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

const statusValue = computed(() => {
  const statuses = poseStates.value.filter(p => p.requestId).map(p => p.status);
  if (statuses.length === 0) return 'IDLE';
  if (statuses.some(s => s === 'pending' || s === 'processing')) return 'PROCESSING';
  if (statuses.every(s => s === 'done')) return 'DONE';
  if (statuses.some(s => s === 'error')) return 'ERROR';
  return 'IDLE';
});

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

const poseStates = ref<PoseState[]>([
  { id: 'A', name: '여성 A', type: 'front', gender: 'female', status: 'idle', requestId: null, resultUrl: null, productImageKey: null },
  { id: 'B', name: '여성 B', type: 'front', gender: 'female', status: 'idle', requestId: null, resultUrl: null, productImageKey: null },
  { id: 'C', name: '여성 C', type: 'back', gender: 'female', status: 'idle', requestId: null, resultUrl: null, productImageKey: null },
  { id: 'D', name: '여성 D', type: 'back', gender: 'female', status: 'idle', requestId: null, resultUrl: null, productImageKey: null },
  { id: 'A', name: '남성 A', type: 'front', gender: 'male', status: 'idle', requestId: null, resultUrl: null, productImageKey: null },
  { id: 'B', name: '남성 B', type: 'front', gender: 'male', status: 'idle', requestId: null, resultUrl: null, productImageKey: null },
  { id: 'C', name: '남성 C', type: 'back', gender: 'male', status: 'idle', requestId: null, resultUrl: null, productImageKey: null },
  { id: 'D', name: '남성 D', type: 'back', gender: 'male', status: 'idle', requestId: null, resultUrl: null, productImageKey: null },
  { id: 'A', name: '마네킹 A', type: 'front', gender: 'mannequin', status: 'idle', requestId: null, resultUrl: null, productImageKey: null },
  { id: 'B', name: '마네킹 B', type: 'front', gender: 'mannequin', status: 'idle', requestId: null, resultUrl: null, productImageKey: null },
  { id: 'C', name: '마네킹 C', type: 'back', gender: 'mannequin', status: 'idle', requestId: null, resultUrl: null, productImageKey: null },
  { id: 'D', name: '마네킹 D', type: 'back', gender: 'mannequin', status: 'idle', requestId: null, resultUrl: null, productImageKey: null },
]);

const selectedPoseIds = ref<string[]>([]);
const poseGroupId = ref(jobId);
const cumulativeHistory = ref<{poseId: string, gender: string, url: string, requestId: string}[]>([]);
const logs = ref<any[]>([]);

// --- Computed ---
const filteredPoses = computed(() => poseStates.value.filter((p: PoseState) => p.gender === currentGender.value));
const allGenerating = computed(() => poseStates.value.some((p: PoseState) => p.status === 'pending' || p.status === 'processing'));

const displayImageUrl = computed(() => {
  if (viewingHistoryUrl.value) return viewingHistoryUrl.value;
  
  const currentPose = filteredPoses.value.find((p: PoseState) => p.id === viewingPoseId.value);
  if (currentPose?.resultUrl) return currentPose.resultUrl;
  
  // Fallback: If current job result is not yet available, show the latest from history for this pose
  const results = cumulativeHistory.value
    .filter(h => h.poseId === viewingPoseId.value && h.gender.toLowerCase() === currentGender.value.toLowerCase());
  
  if (results.length > 0) {
    return results[results.length - 1].url;
  }
  
  return null;
});

const historyList = computed(() => {
  const curPose = filteredPoses.value.find(p => p.id === viewingPoseId.value);
  return cumulativeHistory.value
    .filter((h: any) => h.poseId === viewingPoseId.value && h.gender.toLowerCase() === currentGender.value.toLowerCase())
    .map((h: any) => ({
      url: h.url,
      requestId: h.requestId,
      current: viewingHistoryUrl.value ? viewingHistoryUrl.value === h.url : h.url === curPose?.resultUrl
    })).reverse();
});

const hasHistoryOrIsDone = (poseId: string) => {
  const pose = filteredPoses.value.find(p => p.id === poseId);
  if (pose?.status === 'done' || pose?.resultUrl) return true;
  return cumulativeHistory.value.some(h => 
    h.poseId === poseId && 
    h.gender.toLowerCase() === currentGender.value.toLowerCase()
  );
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
        // Sort jobList chronologically to ensure latest job state wins
        jobList.sort((a: any, b: any) => (a.sysRegDtm || '').localeCompare(b.sysRegDtm || ''));
        
        const first = jobList[0];
        currentGender.value = (first.gender || 'female').toLowerCase();
        selectedProductType.value = first.productType || 'base';
        promptText.value = first.prompt || '';
        userIdValue.value = first.userId || '-';
        regDtm.value = first.sysRegDtm || '-';

        // Set initial viewing pose if none selected
        if (!viewingPoseId.value && first.slot) {
          viewingPoseId.value = first.slot;
        }

        // Reconstruct pose states and history
        jobList.forEach((job: any) => {
          const jobGender = (job.gender || currentGender.value).toLowerCase();
          const jobSlot = (job.slot || '').toUpperCase();
          
          const idx = poseStates.value.findIndex((p: PoseState) => 
            p.id.toUpperCase() === jobSlot && 
            p.gender.toLowerCase() === jobGender
          );
          
          if (job.productImageUrl) {
            if (jobSlot === 'A' || jobSlot === 'B') topImage.value = job.productImageUrl;
            if (jobSlot === 'C' || jobSlot === 'D') bottomImage.value = job.productImageUrl;
          }

          if (idx > -1) {
            const pose = { ...poseStates.value[idx] };
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
            pose.productImageKey = job.productImageKey;
            
            // Update the state with a new object reference to ensure reactivity
            poseStates.value[idx] = pose;
            
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
        
        // Finalize viewing state
        const firstWithResult = poseStates.value.find(p => p.gender.toLowerCase() === currentGender.value.toLowerCase() && p.resultUrl);
        if (firstWithResult) {
           viewingPoseId.value = firstWithResult.id;
        } else if (!viewingPoseId.value && filteredPoses.value.length > 0) {
           viewingPoseId.value = filteredPoses.value[0].id;
        }

        // Auto-start polling if any job is still processing
        if (allGenerating.value) {
          startPolling();
        }
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
  const pendingPoses = poseStates.value.filter((p: PoseState) => p.requestId && (p.status === 'pending' || p.status === 'processing'));
  if (pendingPoses.length === 0) return stopPolling();

  try {
    const res = await fetch(`${apiBase}/api/studio/jobs/${poseGroupId.value}`);
    if (res.ok) {
      const data = await res.json();
      const jobList = data.jobs || [];
      jobList.forEach((job: any) => {
        // Try matching by requestId first, then slot+gender fallback
        let idx = poseStates.value.findIndex((p: PoseState) => p.requestId === job.requestId);
        if (idx === -1 && job.slot) {
           const jobGender = (job.gender || currentGender.value).toLowerCase();
           idx = poseStates.value.findIndex(p => p.id.toUpperCase() === job.slot.toUpperCase() && p.gender.toLowerCase() === jobGender);
        }

        if (idx > -1) {
          const pose = { ...poseStates.value[idx] };
          if (job.requestId) pose.requestId = job.requestId; // Update requestId if it was matched by slot
          
          const s = job.status.toUpperCase();
          if (s === 'SUCCESS' || s === 'COMPLETED' || s === 'DONE') {
            const wasDone = pose.status === 'done';
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
              // Switch view IF current view is empty or we just completed the one we were watching
              if (!wasDone && (!displayImageUrl.value || viewingPoseId.value === pose.id)) {
                 viewingPoseId.value = pose.id;
                 viewingHistoryUrl.value = null;
              }
              if (!wasDone) {
                showToast(`${pose.id} 포즈 이미지 생성이 완료되었습니다.`);
              }
            }
          } else if (s === 'ERROR' || s === 'FAILED' || s === 'BLOCKED') {
            pose.status = 'error';
          } else {
            pose.status = 'processing';
          }
          // Reactive update
          poseStates.value[idx] = { ...pose };
        }
      });
    }
  } catch (e) { console.error('Polling error:', e); }
};

const generateAgain = async () => {
  if (selectedPoseIds.value.length === 0) return;
  
  for (const id of selectedPoseIds.value) {
    const poseIdx = poseStates.value.findIndex(p => p.id === id && p.gender === currentGender.value);
    if (poseIdx === -1) continue;

    const pose = { ...poseStates.value[poseIdx] };

    const formData = new FormData();
    formData.append('poseGroupId', poseGroupId.value);
    formData.append('slot', pose.id);
    formData.append('gender', currentGender.value);
    formData.append('productType', selectedProductType.value);
    formData.append('prompt', promptText.value);
    formData.append('userId', userIdValue.value);
    
    // Crucial: Use existing productImageKey
    if (pose.productImageKey) {
      formData.append('productImageKey', pose.productImageKey);
    } else {
      // Fallback if no key found for this slot, try to find ANY product image key for this group
      const fallbackPose = poseStates.value.find(p => (p.id === 'A' || p.id === 'B') && p.productImageKey);
      const fallbackKey = fallbackPose?.productImageKey;
      if (fallbackKey) formData.append('productImageKey', fallbackKey);
    }
    
    // personImageKey (reference image)
    const typeStr = pose.type === 'front' ? 'front' : 'rear';
    formData.append('personImageKey', `sample/${currentGender.value}-${selectedProductType.value}-${typeStr}_${pose.id.toLowerCase()}.jpg`);

    pose.status = 'pending';
    poseStates.value[poseIdx] = { ...pose }; // Reactive update
    
    // Ensure viewingPoseId is set to start watching this one
    if (!viewingPoseId.value) viewingPoseId.value = id;

    try {
      const res = await fetch(`${apiBase}/api/studio/jobs`, { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        const updatedPose = { ...poseStates.value[poseIdx] };
        updatedPose.requestId = data.requestId;
        poseStates.value[poseIdx] = updatedPose;
        startPolling();
      } else {
        const errorPose = { ...poseStates.value[poseIdx] };
        errorPose.status = 'error';
        poseStates.value[poseIdx] = errorPose;
      }
    } catch (e) {
      console.error('Generation call failed:', e);
      const errorPose = { ...poseStates.value[poseIdx] };
      errorPose.status = 'error';
      poseStates.value[poseIdx] = errorPose;
    }
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr || dateStr === '-') return '-';
  try {
    // Handle both '2026-03-09 00:00:00' and '2026-03-09T00:00:00'
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return dateStr;
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
              :key="currentGender + p.id" 
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
            <h3 class="section-title-v2 inside">가상 피팅 결과</h3>
            <!-- Inline Pose View Selector (Inside the card) -->
            <div class="pose-view-selector-v2">
              <button 
                v-for="p in filteredPoses" 
                :key="'view-' + currentGender + p.id"
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

            <div v-else-if="displayImageUrl || historyList.length > 0" class="result-image-wrapper">
              <div 
                ref="slideContentRef"
                class="slider-container-v2"
                :class="{ 'dragging': isDragging }"
                @mousedown="onDragStart"
                @mousemove="onDragMove"
                @mouseup="onDragEnd"
                @mouseleave="onDragEnd"
              >
                <div 
                  class="slider-track-v2" 
                  :style="{ 
                    transform: sliderTransform,
                    transition: isTransitioning ? 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
                  }"
                >
                  <div v-for="(item, idx) in historyList" :key="idx" class="slide-item-v2">
                    <div class="img-inner-wrap">
                      <div class="img-relative-box">
                        <img :src="item.url" class="result-img animate-scale-up" draggable="false" />
                        <button class="hover-zoom-btn" @click.stop="viewingHistoryUrl = item.url; isImageViewerOpen = true">
                          <Search :size="18" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Slider Controls -->
                <button v-if="currentSlideIndex > 0" class="slider-nav-btn prev" @click="prevSlide">
                  <ChevronLeft :size="24" />
                </button>
                <button v-if="currentSlideIndex < historyList.length - 1" class="slider-nav-btn next" @click="nextSlide">
                  <ChevronRight :size="24" />
                </button>

                <!-- Slider Pagination -->
                <div v-if="historyList.length > 1" class="slider-pagination-v2">
                  <span v-for="(_, idx) in historyList" :key="idx" 
                        class="pagination-dot" :class="{ active: idx === currentSlideIndex }"
                        @click="currentSlideIndex = idx"></span>
                </div>
              </div>

              <!-- Generating Indicator overlay on images -->
              <div v-if="allGenerating" class="mini-generating-tag">
                <div class="small-pulse"></div>
                <span>생성 중...</span>
              </div>
            </div>

            <div v-else-if="allGenerating" class="empty-preview-v2">
               <div class="loading-overlay">
                  <div class="loader"></div>
                  <p>AI가 이미지를 생성하고 있습니다...</p>
               </div>
            </div>

            <div v-else class="empty-preview-v2">
              <div class="empty-overlay">
                <p class="empty-hint">생성된 이미지가 없습니다</p>
              </div>
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

.preview-card-v2 { 
  width: 100%; 
  flex: 1; 
  background: #fff; 
  border-radius: 24px; 
  display: flex; 
  flex-direction: column; 
  overflow: hidden; 
  z-index: 1; 
  min-height: 0; 
}

/* Slider Header */
.slider-header-v2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.75rem;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  z-index: 30;
  flex-shrink: 0;
}

.section-title-v2.inside {
  position: static !important;
  margin: 0 !important;
  font-size: 1.1rem;
}

.pose-view-selector-v2 {
  position: static !important;
  display: flex !important;
  background: #f1f3f5 !important;
  padding: 4px !important;
  border-radius: 12px !important;
  gap: 4px !important;
  border: 1px solid #e9ecef !important;
  box-shadow: none !important;
  margin: 0 !important;
}

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

.generating-vibe::before { content: ''; position: absolute; inset: -3px; background: linear-gradient(45deg, #ff4d4f, #5c7cfa, #00d2ff, #7e5bef, #ff4d4f); background-size: 400% 400%; z-index: -1; border-radius: 23px; animation: border-gradient-wave 3s ease infinite; filter: blur(2px); }
.generating-vibe::after { content: ''; position: absolute; inset: 1px; background: #fff; z-index: -1; border-radius: 19px; }

.pose-view-selector-v2 { position: absolute; top: 1.5rem; right: 1.5rem; display: flex; gap: 6px; z-index: 10; padding: 4px; background: rgba(255,255,255,0.8); backdrop-filter: blur(8px); border-radius: 12px; border: 1px solid rgba(255,255,255,0.3); box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
.view-tab { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 900; color: #888; border-radius: 8px; border: none; background: transparent; cursor: pointer; transition: all 0.2s; }
.view-tab.active { background: #111; color: #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
.view-tab:disabled { opacity: 0.3; cursor: not-allowed; }

.result-image-wrapper { width: 100%; flex: 1; display: flex; align-items: center; justify-content: center; padding: 1.5rem 0; box-sizing: border-box; overflow: hidden; }
.img-inner-wrap { position: relative; height: 100%; width: 100%; display: flex; align-items: center; justify-content: center; }
.img-relative-box { position: relative; height: 100%; display: flex; align-items: center; justify-content: center; }
.result-img { height: 100%; width: auto; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
.hover-zoom-btn { position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.9); border: 1px solid #eee; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 20; }

.shadow-premium {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.03) !important;
}

/* Slider Styles */
.slider-container-v2 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 12px;
  cursor: grab;
  user-select: none;
}

.slider-container-v2.dragging {
  cursor: grabbing;
}

.slider-track-v2 {
  display: flex;
  height: 100%;
  gap: 2%;
  will-change: transform;
}

.slide-item-v2 {
  flex: 0 0 55%;
  width: 55%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slider-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #eee;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111;
  cursor: pointer;
  z-index: 20;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.slider-nav-btn:hover {
  background: #111;
  color: #fff;
  transform: translateY(-50%) scale(1.05);
}

.slider-nav-btn.prev { left: 1.5rem; }
.slider-nav-btn.next { right: 1.5rem; }

.slider-pagination-v2 {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 20;
  background: rgba(0, 0, 0, 0.1);
  padding: 6px 12px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
}

.pagination-dot {
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-dot.active {
  background: #fff;
  transform: scale(1.2);
}

.image-zoom-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.zoom-content { position: relative; max-width: 90vw; max-height: 90vh; }
.zoom-img { max-width: 100%; max-height: 90vh; object-fit: contain; }
.zoom-close-btn { position: absolute; top: -40px; right: 0; color: #fff; font-size: 2rem; }

.loading-overlay { display: flex; flex-direction: column; align-items: center; gap: 1rem; color: #888; }
.loader { border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 2s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.empty-preview-v2 { color: #ccc; text-align: center; }

.mini-generating-tag {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  color: #fff;
  padding: 6px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid rgba(255,255,255,0.2);
  z-index: 5;
}

.small-pulse {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse-green 1.5s infinite;
}

@keyframes pulse-green {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

@keyframes border-gradient-wave {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>
