<template>
  <div class="studio-redesign-container animate-fade-in">
    <!-- Left Sidebar: Settings & Upload -->
    <aside class="studio-sidebar glass-panel">
      <div class="sidebar-scroll-content">

        <section class="sidebar-section">
          <div class="section-label">
            <span>의상 이미지</span>
            <span class="count-badge">(최대 2개 이미지)</span>
          </div>
          <div class="upload-compact-grid">
            <!-- Front Upload -->
            <div 
              class="upload-thumb-box" 
              :class="{ 'has-image': frontImage }"
              @click="frontInput?.click()"
            >
              <input type="file" ref="frontInput" hidden accept="image/*" @change="handleFileUpload($event, 'front')">
              <template v-if="frontImage">
                <img :src="frontImage" class="thumb-img" />
                <div class="thumb-overlay">FRONT</div>
                <button class="thumb-remove-btn" @click.stop="removeImage('front')"><X :size="14" /></button>
              </template>
              <div v-else class="thumb-placeholder">
                <Plus :size="20" />
                <span>전면</span>
              </div>
            </div>

            <!-- Back Upload -->
            <div 
              class="upload-thumb-box" 
              :class="{ 'has-image': backImage }"
              @click="backInput?.click()"
            >
              <input type="file" ref="backInput" hidden accept="image/*" @change="handleFileUpload($event, 'back')">
              <template v-if="backImage">
                <img :src="backImage" class="thumb-img" />
                <div class="thumb-overlay">BACK</div>
                <button class="thumb-remove-btn" @click.stop="removeImage('back')"><X :size="14" /></button>
              </template>
              <div v-else class="thumb-placeholder">
                <Plus :size="20" />
                <span>후면</span>
              </div>
            </div>
          </div>
        </section>

        <section class="sidebar-section">
          <div class="setting-controls-stack">
            <div class="custom-select-vibe">
              <label>피팅 모델</label>
              <select v-model="gender" class="vibe-select">
                <option value="mannequin">마네킹</option>
                <option value="male">남성 모델</option>
                <option value="female">여성 모델</option>
              </select>
            </div>
            <div class="custom-select-vibe">
              <label>상품 타입</label>
              <select v-model="productType" class="vibe-select">
                <option value="base">전체</option>
                <option value="top">상의</option>
                <option value="bottom">하의</option>
              </select>
            </div>
            <div class="pose-selection-vibe">
              <div class="label-with-addon">
                <div class="label-box">
                  <label>포즈 선택</label>
                  <button class="icon-help-btn" @click="showPoseGuide = true">
                    <HelpCircle :size="16" />
                  </button>
                </div>
                <button 
                  class="select-all-btn" 
                  :disabled="!hasAnyImage"
                  @click="toggleSelectAll"
                >
                  {{ isAllSelected ? '선택 해제' : '전체 선택' }}
                </button>
              </div>
              <div class="pose-chip-group">
                <button 
                  v-for="p in poseStates" 
                  :key="p.id"
                  class="pose-chip"
                  :class="{ 
                    active: selectedPoseIds.includes(p.id),
                    disabled: !isPoseEnabled(p.id) 
                  }"
                  :disabled="!isPoseEnabled(p.id)"
                  @click="togglePoseSelection(p.id)"
                >
                  {{ p.id }}
                </button>
              </div>
              <p class="pose-desc-vibe">{{ selectedPoseDescription }}</p>
            </div>
            <div class="custom-prompt-vibe">
              <label>추가 프롬프트 (옵션)</label>
              <textarea 
                v-model="prompt" 
                class="vibe-textarea" 
                placeholder="예: 실크 소재의 느낌을 살려줘, 배경을 더 밝게 해줘 등"
              ></textarea>
            </div>
          </div>
        </section>

        <!-- API Request/Response Status -->
        <section v-if="lastApiResponse" class="sidebar-section">
          <div class="api-status-vibe glass-panel" :class="lastApiResponse.success ? 'success' : 'error'">
            <div class="status-header">
              <div class="status-indicator"></div>
              <span class="status-label">{{ lastApiResponse.success ? '요청 성공' : '요청 실패' }}</span>
              <span class="status-time">{{ lastApiResponse.time }}</span>
            </div>
            <div class="status-detail">
              <p v-if="lastApiResponse.message" class="status-msg">{{ lastApiResponse.message }}</p>
              <pre v-if="lastApiResponse.data" class="status-json">{{ JSON.stringify(lastApiResponse.data, null, 2) }}</pre>
            </div>
          </div>
        </section>
      </div>

      <div class="sidebar-footer">
        <BaseButton 
          variant="primary" 
          size="lg" 
          class="main-generate-btn"
          :disabled="!frontImage || allGenerating"
          @click="generateAllPoses"
        >
          <Sparkles :size="20" />
          <span>생성</span>
        </BaseButton>
      </div>
    </aside>

    <!-- Right Main Content: Preview & Gallery -->
    <main class="studio-main-content">
      <div class="main-preview-area">
        <div class="preview-header">
          <span class="preview-label">결과 미리보기</span>
          <div class="preview-nav-tabs">
            <button 
              v-for="p in poseStates" 
              :key="p.id"
              class="nav-tab-btn"
              :class="{ active: viewingPoseId === p.id }"
              @click="viewingPoseId = p.id"
            >
              Pose {{ p.id }}
            </button>
          </div>
        </div>
        
        <div class="preview-stage glass-panel">
          <div class="stage-view-main">
            <div v-if="displayImageUrl" class="stage-image-container">
              <img :src="displayImageUrl" class="stage-img" alt="Preview" />
              <div class="stage-actions">
                <button v-if="selectedPose" class="stage-btn" @click="downloadPose(selectedPose)"><Download :size="20" /></button>
                <button v-if="selectedPose" class="stage-btn" @click="openHistory(selectedPose)"><History :size="20" /></button>
              </div>
            </div>
            <div v-else-if="allGenerating" class="stage-loading">
              <div class="radiant-spinner-large"></div>
              <Sparkles :size="48" class="loading-sparkle" />
              <p>AI가 피팅 이미지를 생성하고 있습니다...</p>
            </div>
            <div v-else class="stage-empty">
              <div class="empty-vibe-icon"><ImageIcon :size="64" /></div>
              <h3>생성할 포즈를 선택하거나 전체 생성을 클릭하세요</h3>
              <p>AI 피팅 이미지가 여기에 표시됩니다</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Bright Gallery Area below Preview -->
      <div v-if="historyList.length > 0" class="main-gallery-area bright-theme glass-panel">
        <div class="gallery-header">
          <div class="gallery-title-group">
            <span class="gallery-title">생성 히스토리</span>
            <span class="gallery-count">{{ historyList.length }}개의 결과</span>
          </div>
        </div>
        
        <div class="gallery-scroller" ref="resultSlider">
          <div 
            v-for="(item, idx) in historyList" 
            :key="idx" 
            class="gallery-item history-mode"
            :class="{ active: selectedHistoryIdx === idx }"
            @click="selectedHistoryIdx = idx"
          >
            <div class="item-thumb-container">
              <img :src="item.url" class="item-thumb-img" />
              <div v-if="item.current" class="history-badge">LATEST</div>
            </div>
            <div class="item-meta">
              <span class="item-name">이력 #{{ historyList.length - idx }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Pose Guide Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showPoseGuide" class="history-modal-overlay" @click="showPoseGuide = false">
          <div class="history-modal-content pose-guide-modal glass-panel" @click.stop>
            <div class="modal-header">
              <h3><HelpCircle :size="18" /> 포즈 가이드</h3>
              <button class="close-btn" @click="showPoseGuide = false"><X :size="20" /></button>
            </div>
            <p class="modal-desc">선택하신 모델과 상품 타입에 따라 다음과 같은 포즈로 생성됩니다.</p>
          
          <div class="modal-options-vibe">
            <div class="modal-option-col">
              <label>피팅 모델</label>
              <select v-model="gender" class="vibe-select">
                <option value="mannequin">마네킹</option>
                <option value="male">남성 모델</option>
                <option value="female">여성 모델</option>
              </select>
            </div>
            <div class="modal-option-col">
              <label>상품 타입</label>
              <select v-model="productType" class="vibe-select">
                <option value="base">전체</option>
                <option value="top">상의</option>
                <option value="bottom">하의</option>
              </select>
            </div>
          </div>

          <div class="pose-sample-grid">
              <div v-for="p in poseStates" :key="p.id" class="sample-card">
                <div class="sample-img-box">
                  <img :src="getSampleImageUrl(p.id)" :alt="'Pose ' + p.id" @error="(e) => console.log('Image Load Failed:', getSampleImageUrl(p.id))" />
                  <div class="sample-id-badge">{{ p.id }}</div>
                </div>
                <div class="sample-label">{{ p.name }} ({{ p.type === 'front' ? '전면' : '후면' }})</div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- History View Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showHistory" class="history-modal-overlay" @click="showHistory = false">
          <div class="history-modal-content glass-panel" @click.stop>
            <div class="modal-header">
              <h3><History :size="18" /> 생성 히스토리</h3>
              <button class="close-btn" @click="showHistory = false"><X :size="20" /></button>
            </div>
            <div class="history-grid">
              <div v-for="(item, idx) in historyList" :key="idx" class="history-card">
                <img :src="item.url" />
                <div class="history-card-footer">
                  <button class="apply-recent-btn" @click="useResultAsInput(item)">이 이미지로 재피팅</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Custom Alert/Error Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="alertModal.show" class="history-modal-overlay" @click="alertModal.show = false">
          <div class="history-modal-content alert-vibe-modal glass-panel" @click.stop>
            <div class="modal-header">
              <h3>
                <AlertCircle v-if="alertModal.type === 'error'" class="icon-error" :size="20" />
                <HelpCircle v-else class="icon-info" :size="20" />
                {{ alertModal.title }}
              </h3>
              <button class="close-btn" @click="alertModal.show = false"><X :size="20" /></button>
            </div>
            <div class="alert-body">
              <p class="alert-message">{{ alertModal.message }}</p>
              <div v-if="alertModal.detail" class="alert-detail">
                <span class="detail-label">상세 사유:</span>
                <p>{{ alertModal.detail }}</p>
              </div>
            </div>
            <div class="alert-footer">
              <button class="alert-confirm-btn" @click="alertModal.show = false">확인</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';
import { 
  Upload, X, Sparkles, Download, MaximizeIcon, User, 
  Lock, RefreshCw, History, Check, Plus, HelpCircle, Image as ImageIcon, AlertCircle
} from 'lucide-vue-next';
import BaseButton from '~/components/ui/BaseButton.vue';
import { useRuntimeConfig } from '#app';

definePageMeta({ title: '스튜디오' });

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;
const ownerCookie = useCookie('ai_admin_owner');
const currentUserId = computed(() => ownerCookie.value || 'dev');

// UUID 및 데이터 상태
const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

const poseGroupId = ref(generateUUID());
const gender = ref('mannequin');
const productType = ref('base');
const prompt = ref('');
const selectedPoseIds = ref<string[]>([]);
const viewingPoseId = ref('A');
const lastApiResponse = ref<{ success: boolean; message: string; time: string; data?: any } | null>(null);
const alertModal = reactive({
  show: false,
  type: 'info' as 'info' | 'error',
  title: '',
  message: '',
  detail: ''
});
const selectedHistoryIdx = ref(0);
const showPoseGuide = ref(false);
const showHistory = ref(false);
const frontImage = ref<string | null>(null);
const backImage = ref<string | null>(null);
const frontImageKey = ref<string | null>(null);
const backImageKey = ref<string | null>(null);

// 추가: 실제 파일 객체를 저장하기 위한 변수
const selectedFiles = reactive<{ front: File | null, back: File | null }>({
  front: null,
  back: null
});

const frontInput = ref<HTMLInputElement | null>(null);
const backInput = ref<HTMLInputElement | null>(null);
const resultSlider = ref<HTMLElement | null>(null); // This ref is no longer used for gallery-scroller, but kept for now.

type JobStatus = 'idle' | 'pending' | 'processing' | 'done' | 'error' | 'failed';

const handleGlobalKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    showPoseGuide.value = false;
    showHistory.value = false;
    alertModal.show = false;
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown);
  stopPolling();
});

interface PoseState {
  id: string;
  name: string;
  type: 'front' | 'back';
  status: JobStatus;
  resultUrl: string | null;
  requestId: string | null;
}

const poseStates = reactive<PoseState[]>([
  { id: 'A', name: '정면 기본', type: 'front', status: 'idle', resultUrl: null, requestId: null },
  { id: 'B', name: '정면 전체', type: 'front', status: 'idle', resultUrl: null, requestId: null },
  { id: 'C', name: '후면 기본', type: 'back', status: 'idle', resultUrl: null, requestId: null },
  { id: 'D', name: '후면 전체', type: 'back', status: 'idle', resultUrl: null, requestId: null },
]);

// Selection Helpers
const isPoseEnabled = (id: string) => {
  const pose = poseStates.find(p => p.id === id);
  if (!pose) return false;
  return pose.type === 'front' ? !!frontImage.value : !!backImage.value;
};

const hasAnyImage = computed(() => !!frontImage.value || !!backImage.value);

const togglePoseSelection = (id: string) => {
  const idx = selectedPoseIds.value.indexOf(id);
  if (idx > -1) {
    selectedPoseIds.value.splice(idx, 1);
  } else {
    selectedPoseIds.value.push(id);
  }
};

const isAllSelected = computed(() => {
  const enabled = poseStates.filter(p => p.id !== 'C' && p.id !== 'D' ? !!frontImage.value : !!backImage.value).map(p => p.id); // Adjusted for front/back image dependency
  return enabled.length > 0 && enabled.every(id => selectedPoseIds.value.includes(id));
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedPoseIds.value = [];
  } else {
    selectedPoseIds.value = poseStates.filter(p => isPoseEnabled(p.id)).map(p => p.id);
  }
};

const selectedPoseDescription = computed(() => {
  if (selectedPoseIds.value.length === 0) return '먼저 의상 사진을 업로드하고 포즈를 선택하세요';
  if (selectedPoseIds.value.length === 1) {
    return poseStates.find(p => p.id === selectedPoseIds.value[0])?.name;
  }
  return `${selectedPoseIds.value.length}개의 포즈 선택됨`;
});

const selectedPose = computed(() => {
  return poseStates.find(p => p.id === viewingPoseId.value) || null;
});

// History List logic
const historyList = computed(() => {
  const pose = selectedPose.value;
  if (pose && pose.status === 'done' && pose.resultUrl) {
    // Mocking history for demonstration as requested
    return [
      { url: pose.resultUrl, current: true },
      { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400', current: false },
      { url: 'https://images.unsplash.com/photo-1539109132381-31a15b2c30ae?w=400', current: false }
    ];
  }
  return [];
});

const displayImageUrl = computed(() => {
  if (historyList.value.length > 0 && selectedHistoryIdx.value < historyList.value.length) {
    return historyList.value[selectedHistoryIdx.value].url;
  }
  return selectedPose.value?.resultUrl || null;
});

const allGenerating = computed(() => poseStates.some(p => p.status === 'pending' || p.status === 'processing'));

watch(viewingPoseId, () => {
  selectedHistoryIdx.value = 0;
});

const handleFileUpload = (event: Event, type: 'front' | 'back') => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    // 실제 파일 객체 저장
    if (type === 'front') selectedFiles.front = file;
    else selectedFiles.back = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (type === 'front') {
        frontImage.value = dataUrl;
        frontImageKey.value = `input/${generateUUID()}-front.jpg`;
      } else {
        backImage.value = dataUrl;
        backImageKey.value = `input/${generateUUID()}-rear.jpg`;
      }
    };
    reader.readAsDataURL(file);
  }
};

const removeImage = (type: 'front' | 'back') => {
  if (type === 'front') { 
    frontImage.value = null; 
    frontImageKey.value = null;
    selectedFiles.front = null;
  }
  else { 
    backImage.value = null; 
    backImageKey.value = null;
    selectedFiles.back = null;
  }
};

// Polling & API
let pollTimer: any = null;
const startPolling = () => { if (!pollTimer) pollTimer = setInterval(fetchJobStatuses, 3000); };
const stopPolling = () => { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } };

const fetchJobStatuses = async () => {
  try {
    const res = await fetch(`${apiBase}/api/studio/jobs/${poseGroupId.value}`);
    if (res.ok) {
      const jobs = await res.json();
      jobs.forEach((job: any) => {
        const pose = poseStates.find(p => p.id === job.slot);
        if (pose) {
          pose.status = job.status.toLowerCase() as JobStatus;
          pose.requestId = job.requestId;
          pose.resultUrl = job.resultUrl; // Ensure URL is stored
        }
      });
      if (poseStates.every(p => p.status !== 'pending' && p.status !== 'processing')) stopPolling();
    }
  } catch (e) { console.error('Polling error:', e); }
};

const generateSinglePose = async (poseId: string) => {
  const pose = poseStates.find(p => p.id === poseId);
  if (!pose) return;
  const inputKey = pose.type === 'front' ? frontImageKey.value : backImageKey.value;
  if (!inputKey) return;
  pose.status = 'pending';
  try {
    const file = pose.type === 'front' ? selectedFiles.front : selectedFiles.back;
    if (!file) {
      console.error('File not found for pose:', poseId);
      return;
    }

    const formData = new FormData();
    formData.append('poseGroupId', poseGroupId.value);
    formData.append('slot', pose.id);
    formData.append('viewType', pose.type.toUpperCase());
    formData.append('gender', gender.value);
    formData.append('productType', productType.value);
    formData.append('prompt', prompt.value);
    formData.append('product', file); // 실제 바이너리 파일 전송
    formData.append('personImageKey', `sample/${gender.value}-${productType.value}-${pose.type === 'front' ? 'front' : 'rear'}_${pose.id.toLowerCase()}.jpg`);
    formData.append('owner', currentUserId.value);
    formData.append('userId', currentUserId.value);

    const res = await fetch(`${apiBase}/api/studio/jobs`, {
      method: 'POST',
      body: formData // JSON 대신 FormData 사용
    });
    
    const time = new Date().toLocaleTimeString();
    if (res.ok) {
      const data = await res.json();
      lastApiResponse.value = { success: true, message: `Pose ${poseId} 요청 완료`, time, data };
      startPolling();
    } else {
      const errorData = await res.json().catch(() => ({}));
      const errorMsg = errorData.message || res.statusText || 'Unknown error';
      pose.status = 'error';
      lastApiResponse.value = { success: false, message: `Pose ${poseId} 실패: ${errorMsg}`, time, data: errorData };
      
      alertModal.type = 'error';
      alertModal.title = '생성 요청 실패';
      alertModal.message = `[Pose ${poseId}] 이미지 생성 요청에 실패했습니다.`;
      alertModal.detail = errorMsg;
      alertModal.show = true;
    }
  } catch (e: any) {
    const time = new Date().toLocaleTimeString();
    pose.status = 'error';
    lastApiResponse.value = { success: false, message: `네트워크 오류: ${e.message}`, time };
    
    alertModal.type = 'error';
    alertModal.title = '네트워크 오류';
    alertModal.message = '서버와의 통신 중 오류가 발생했습니다.';
    alertModal.detail = e.message;
    alertModal.show = true;
  }
};

const generateAllPoses = () => {
  if (selectedPoseIds.value.length === 0) {
    alertModal.type = 'info';
    alertModal.title = '포즈 미선택';
    alertModal.message = '생성할 포즈를 최소 하나 이상 선택해 주세요.';
    alertModal.detail = '';
    alertModal.show = true;
    return;
  }
  selectedPoseIds.value.forEach(id => {
    generateSinglePose(id);
  });
};

// Sample Images
const getSampleImageUrl = (poseId: string) => {
  const dir = poseStates.find(p => p.id === poseId)?.type === 'front' ? 'front' : 'rear';
  // Use the 'sample/' directory with underscore and lowercase poseId as requested
  return `https://ai-fitting-studio-images.s3.ap-northeast-2.amazonaws.com/sample/${gender.value}-${productType.value}-${dir}_${poseId.toLowerCase()}.jpg`;
};

// History
const openHistory = (pose: PoseState) => {
  showHistory.value = true;
};
const useResultAsInput = (item: any) => { alert('이 결과 이미지로 재피팅을 시작합니다.'); showHistory.value = false; };
const downloadPose = (pose: PoseState) => {
  if (!pose.resultUrl) return;
  const link = document.createElement('a');
  link.href = pose.resultUrl;
  link.download = `studio-${pose.id}.jpg`;
  link.click();
};

onUnmounted(() => stopPolling());
</script>

<style scoped>
.studio-redesign-container {
  display: flex;
  height: calc(100vh - 80px);
  gap: 1.5rem;
  padding: 1rem;
  overflow: hidden;
}

/* Sidebar Styling */
.studio-sidebar {
  width: 420px;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-surface);
  border-radius: 20px;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
}

.sidebar-scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sidebar-scroll-content::-webkit-scrollbar {
  width: 4px;
}

.sidebar-scroll-content::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
}

.sidebar-scroll-content:hover::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.15);
}

.sidebar-header .sidebar-title {
  font-size: 1.25rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  color: var(--color-text-main);
}

.tab-group-radiant {
  display: flex;
  background: var(--color-bg-alt);
  padding: 4px;
  border-radius: 12px;
  gap: 4px;
  border: 1px solid var(--color-border);
}

.tab-btn {
  flex: 1;
  padding: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 8px;
  color: #64748b;
  transition: all 0.2s;
}

.tab-btn.active {
  background: rgba(255,255,255,0.08);
  color: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.section-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 1rem;
}

.count-badge {
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.7;
}

.upload-compact-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.upload-thumb-box {
  aspect-ratio: 3/4;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
}

.upload-thumb-box:hover:not(.empty-state) {
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.05);
}

.thumb-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 600;
}

.thumb-placeholder.disabled { opacity: 0.3; cursor: default; }

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-overlay {
  position: absolute;
  top: 4px;
  left: 4px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 0.6rem;
  padding: 2px 4px;
  border-radius: 4px;
}

.thumb-remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(239, 68, 68, 0.8);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.setting-controls-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.vibe-select {
  width: 100%;
  background: #f8fafc; /* Consistent light background */
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 12px;
  color: #1e293b; /* Dark text for better readability */
  font-size: 0.85rem;
  font-family: inherit;
  outline: none;
  cursor: pointer;
  appearance: none;
}

.vibe-select option {
  background: #1e293b; /* Explicitly dark for contrast against white text */
  color: #ffffff;
}

.custom-prompt-vibe {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.custom-prompt-vibe label,
.custom-select-vibe label,
.pose-selection-vibe label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #94a3b8;
  margin-bottom: 0.75rem;
  display: block;
}

.vibe-textarea {
  width: 100%;
  height: 100px;
  background: #f8fafc; /* Light background for dark text */
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 12px;
  color: #1e293b; /* Dark text for better readability */
  font-size: 0.85rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  outline: none;
  resize: none;
  transition: all 0.2s;
}

.vibe-textarea::placeholder {
  color: #94a3b8;
  font-family: inherit;
}

.vibe-textarea:focus {
  border-color: var(--color-primary);
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

.label-with-addon {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.label-box {
  display: flex;
  align-items: center;
  gap: 4px;
}

.label-box label {
  margin-bottom: 0 !important;
}

.select-all-btn {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.select-all-btn:hover:not(:disabled) {
  background: var(--color-primary);
  color: #fff;
}

.select-all-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.icon-help-btn {
  color: #94a3b8;
  opacity: 0.6;
  transition: opacity 0.2s;
  padding: 4px;
}

.icon-help-btn:hover {
  opacity: 1;
  color: var(--color-primary);
}

/* Pose Chip Group */
.pose-selection-vibe {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pose-chip-group {
  display: flex;
  gap: 8px;
}

.pose-chip {
  flex: 1;
  height: 40px;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: #64748b;
  font-weight: 700;
  transition: all 0.2s;
}

.pose-chip:hover {
  border-color: var(--color-primary);
  color: #fff;
}

.pose-chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
}

.pose-chip.disabled {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: #334155;
  cursor: not-allowed;
  opacity: 0.5;
  pointer-events: none;
}

.pose-desc-vibe {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: -4px;
}

.sidebar-info-box {
  background: rgba(var(--color-primary-rgb), 0.05);
  padding: 1rem;
  border-radius: 12px;
  font-size: 0.75rem;
  color: #7dd3fc;
  line-height: 1.6;
}

.api-status-vibe {
  padding: 1rem;
  font-size: 0.8rem;
  border: 1px solid rgba(255,255,255,0.05);
}

.api-status-vibe.success { border-left: 3px solid var(--color-success); }
.api-status-vibe.error { border-left: 3px solid #ef4444; }

.status-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0.75rem;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.success .status-indicator { background: var(--color-success); box-shadow: 0 0 8px var(--color-success); }
.error .status-indicator { background: #ef4444; box-shadow: 0 0 8px #ef4444; }

.status-label { font-weight: 700; color: #f8fafc; }
.status-time { font-size: 0.7rem; color: #64748b; margin-left: auto; }

.status-msg { margin-bottom: 0.5rem; color: #94a3b8; line-height: 1.4; }
.status-json {
  background: rgba(0,0,0,0.3);
  padding: 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  color: #818cf8;
  max-height: 120px;
  overflow-y: auto;
  font-family: 'Fira Code', monospace;
}

.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.main-generate-btn {
  width: 100%;
  height: 50px;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 800;
}

/* Main Content Styling */
.studio-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow: hidden;
}

.main-preview-area {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-nav-tabs {
  display: flex;
  background: var(--color-bg-alt);
  padding: 4px;
  border-radius: 10px;
  gap: 4px;
}

.nav-tab-btn {
  padding: 6px 16px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-tab-btn:hover {
  color: var(--color-text-main);
}

.nav-tab-btn.active {
  background: #ffffff;
  color: #1e293b;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.preview-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #94a3b8;
}

.preview-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 600px;
  background: #ffffff; /* Brighter background for results */
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.stage-view-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 480px;
}

.stage-image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.stage-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.stage-actions {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stage-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.stage-btn:hover { background: var(--color-primary); transform: scale(1.05); }

.stage-loading, .stage-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #64748b;
  text-align: center;
  padding: 2rem;
}

.empty-vibe-icon {
  margin-bottom: 0.5rem;
  opacity: 0.5;
}

.stage-empty h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.stage-empty p {
  font-size: 0.9rem;
  color: #94a3b8;
}

.radiant-spinner-large {
  width: 80px;
  height: 80px;
  border: 4px solid rgba(var(--color-primary-rgb), 0.1);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Bright Theme for Gallery */
.main-gallery-area.bright-theme {
  margin-top: 1.5rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.gallery-header {
  margin-bottom: 1.5rem;
}

.gallery-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gallery-title {
  font-size: 1rem;
  font-weight: 800;
  color: #1e293b;
}

.gallery-count {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 500;
}

.gallery-scroller {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  padding-bottom: 1rem;
}

.gallery-scroller::-webkit-scrollbar {
  height: 6px;
}

.gallery-scroller::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}

.gallery-scroller::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.gallery-item {
  flex-shrink: 0;
  width: 130px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.gallery-item.active { transform: translateY(-4px); }

.item-thumb-container {
  aspect-ratio: 3/4;
  background: #f8fafc;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  border: 2px solid #f1f5f9;
  transition: all 0.2s;
}

.gallery-item:hover .item-thumb-container {
  border-color: #cbd5e1;
  transform: translateY(-2px);
}

.gallery-item.active .item-thumb-container { 
  border-color: var(--color-primary); 
  box-shadow: 0 8px 25px rgba(var(--color-primary-rgb), 0.25); 
}

.item-thumb-img { width: 100%; height: 100%; object-fit: cover; }

.item-meta {
  margin-top: 10px;
  text-align: center;
}

.item-name { 
  font-size: 0.8rem; 
  font-weight: 700; 
  color: #64748b; 
}

.gallery-item.active .item-name { 
  color: var(--color-primary); 
}

/* History Modal */
.history-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(12px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.history-modal-content {
  width: 900px;
  max-width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  padding: 2rem;
  position: relative;
}

.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.history-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1.5rem; }
.history-card { border-radius: 12px; overflow: hidden; background: rgba(0,0,0,0.2); }
.history-card img { width: 100%; aspect-ratio: 3/4; object-fit: cover; }
.history-card-footer { padding: 10px; }
.apply-recent-btn { width: 100%; background: rgba(255,255,255,0.05); color: #fff; padding: 8px; border-radius: 6px; font-size: 0.75rem; }

.pose-guide-modal {
  width: 900px;
  max-width: 95vw;
  background: #ffffff;
  color: #1e293b;
  padding: 2.5rem;
}

.pose-guide-modal .modal-header h3 {
  color: #1e293b;
  font-size: 1.5rem;
}

.pose-guide-modal .modal-header .close-btn {
  color: #64748b;
}

.modal-desc {
  color: #64748b;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.modal-options-vibe {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.modal-option-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modal-option-col label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #64748b;
}

.pose-sample-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.sample-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sample-img-box {
  position: relative;
  aspect-ratio: 3/4;
  background: #f1f5f9;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}

.sample-img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sample-id-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: var(--color-primary);
  color: #fff;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.8rem;
}

.sample-label {
  font-size: 0.9rem;
  color: #1e293b;
  font-weight: 700;
  text-align: center;
}

/* Custom Alert Modal */
.alert-vibe-modal {
  width: 400px;
  background: #ffffff;
  color: #1e293b;
  padding: 2rem;
}

.alert-vibe-modal .modal-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.25rem;
  color: #1e293b;
}

.icon-error { color: #ef4444; }
.icon-info { color: var(--color-primary); }

.alert-body {
  margin-bottom: 2rem;
}

.alert-message {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
}

.alert-detail {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.detail-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 4px;
}

.alert-detail p {
  font-size: 0.85rem;
  color: #475569;
  word-break: break-all;
}

.alert-footer {
  display: flex;
  justify-content: flex-end;
}

.alert-confirm-btn {
  background: var(--color-primary);
  color: #fff;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 700;
  transition: all 0.2s;
}

.alert-confirm-btn:hover {
  filter: brightness(1.1);
  transform: translateY(-2px);
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Mobile Adaptations */
@media (max-width: 1024px) {
  .studio-redesign-container { flex-direction: column; height: auto; overflow: visible; }
  .studio-sidebar { width: 100%; }
}
</style>

