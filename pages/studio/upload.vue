<template>
  <div class="studio-redesign-container">
    
    <!-- Left Sidebar: Controls -->
    <div class="studio-sidebar-v2">
      <div class="sidebar-content-v2">
        <!-- Basic Info (Only in Detail Mode) -->
        <section v-if="isDetailMode" class="control-group metadata-group">
          <div class="metadata-grid">
            <div class="meta-item">
              <span class="meta-label">사용자 ID</span>
              <span class="meta-value">{{ metadata.userId }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">생성일</span>
              <span class="meta-value">{{ formatDate(metadata.regDtm) }}</span>
            </div>
          </div>
        </section>

        <!-- Clothing Upload Row (Top & Bottom) -->
        <section class="control-group">
          <div class="group-header">
            <label class="group-title">의류 업로드</label>
          </div>
          
          <div class="upload-slots-row">
            <!-- Top Upload -->
            <div class="upload-area-v2" :class="{ 'is-disabled': allGenerating }" @click="(topImage || allGenerating) ? null : topInput?.click()">
              <input type="file" ref="topInput" hidden accept="image/*" @change="handleFileUpload($event, 'top')">
              <template v-if="topImage">
                <div class="image-preview-v2">
                  <img :src="topImage" class="preview-img" />
                  <button v-if="!allGenerating" class="remove-btn-v2" @click.stop="removeImage('top')"><X :size="14" /></button>
                </div>
              </template>
              <div v-else class="upload-placeholder-v2">
                <div class="placeholder-icon"><Upload :size="20" /></div>
                <span>전면 사진 업로드</span>
              </div>
            </div>

            <!-- Bottom Upload -->
            <div class="upload-area-v2" :class="{ 'is-disabled': allGenerating }" @click="(bottomImage || allGenerating) ? null : bottomInput?.click()">
              <input type="file" ref="bottomInput" hidden accept="image/*" @change="handleFileUpload($event, 'bottom')">
              <template v-if="bottomImage">
                <div class="image-preview-v2">
                  <img :src="bottomImage" class="preview-img" />
                  <button v-if="!allGenerating" class="remove-btn-v2" @click.stop="removeImage('bottom')"><X :size="14" /></button>
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
            <div class="modern-select-wrapper" :class="{ 'is-disabled': allGenerating }">
              <select 
                v-model="selectedProductType" 
                class="modern-select-v2"
                :disabled="allGenerating"
              >
                <option v-for="opt in productTypeOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <ChevronDown class="select-icon-v2" :size="14" />
            </div>
          </div>

          <div class="pose-tabs-v2" :class="{ 'is-disabled': allGenerating }">
            <button v-for="t in genderTabs" :key="t.id"
                    class="pose-tab" :class="{ active: currentGender === t.id }"
                    :disabled="allGenerating"
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
                'disabled-card': !isPoseClickable(p.type) || allGenerating
              }"
              @click="(isPoseClickable(p.type) && !allGenerating) ? togglePoseSelection(p.id) : null"
              @mouseenter="setHoveredPose($event, p)"
              @mouseleave="clearHoveredPose"
            >
              <div class="pose-thumb-v2">
                <img :src="p.customPersonUrl || getSampleImageUrl(p.id)" :alt="p.name" />
                <button 
                  class="model-change-btn" 
                  :disabled="allGenerating"
                  @click.stop="modalActivePoseId = p.id; isCustomModelModalOpen = true"
                >
                  <span>모델 변경</span>
                </button>
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
            :disabled="allGenerating"
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
    </div>

    <!-- Right Main Content -->
    <div class="studio-main-v2">
      <div class="main-layout-v2">
        <!-- Result Preview (Top) -->
        <div class="preview-stage-v2">
          <div class="preview-card-v2 shadow-premium" :class="{ 'generating-vibe': allGenerating }">
            <!-- New Header Wrapper -->
            <div class="slider-header-v2">
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
            </div>

            <div v-if="historyList.length > 0" class="result-image-wrapper">
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
                      <div class="img-relative-box" :class="{ 'is-loading-card': item.status !== 'done' }">
                        <template v-if="item.status === 'done'">
                          <img :src="item.url" :key="item.url" class="result-img animate-fade-in" draggable="false" />
                          <div class="result-hover-actions">
                            <button class="hover-action-btn" @click.stop="viewingHistoryUrl = item.url; isImageViewerOpen = true">
                              <Search :size="18" />
                            </button>
                            <button class="hover-action-btn wand-btn" @click.stop="setAsBaseImage(item.url)">
                              <Wand2 :size="18" />
                            </button>
                          </div>
                        </template>
                        <div v-else class="inline-loader-content">
                          <div class="radiant-loader mini"></div>
                          <p class="loader-text-mini">디자인 중...</p>
                        </div>
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
            </div>
            <div v-else class="empty-preview-v2">
              <div class="empty-overlay">
                <p class="empty-hint">비어 있음</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

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

    <!-- Custom Model Selection Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isCustomModelModalOpen" class="alert-overlay-modern" @click="isCustomModelModalOpen = false">
          <div class="custom-model-modal" @click.stop>
            <div class="modal-header-v2">
              <h3>커스텀 모델 선택</h3>
              <button class="modal-close-v2" @click="isCustomModelModalOpen = false"><X :size="20" /></button>
            </div>
            <div class="modal-body-v2">
              <div v-if="activePoseHistory.length > 0" class="model-slider-wrapper">
                <div 
                  class="model-grid-container"
                  :class="{ 'dragging': modalIsDragging }"
                  @mousedown="onModalDragStart"
                  @mousemove="onModalDragMove"
                  @mouseup="onModalDragEnd"
                  @mouseleave="onModalDragEnd"
                >
                  <Transition :name="modalTransitionName" mode="out-in">
                    <div :key="modalCurrentPage" class="model-grid-v2">
                      <div 
                        v-for="(h, idx) in paginatedModels" 
                        :key="idx" 
                        class="model-selection-card"
                        :class="{ 'is-new': h.isNew }"
                        @click="selectCustomModel(h.url)"
                      >
                        <div class="model-thumb">
                          <img :src="h.url" :alt="h.name" />
                          <div v-if="h.isNew" class="new-badge">NEW</div>
                        </div>
                        <span class="model-name">{{ h.name }}</span>
                      </div>
                    </div>
                  </Transition>
                </div>
                
                <!-- Pagination for Modal -->
                <div v-if="modalTotalPages > 1" class="modal-pagination">
                  <button class="modal-nav-btn" :disabled="modalCurrentPage === 0" @click="prevModalPage">
                    <ChevronLeft :size="16" />
                  </button>
                  <div class="modal-dots">
                    <span v-for="p in modalTotalPages" :key="p" 
                          class="modal-dot" :class="{ active: p - 1 === modalCurrentPage }"
                          @click="modalCurrentPage = p - 1"></span>
                  </div>
                  <button class="modal-nav-btn" :disabled="modalCurrentPage === modalTotalPages - 1" @click="nextModalPage">
                    <ChevronRight :size="16" />
                  </button>
                </div>
              </div>
              <div v-else class="empty-history-v2">
                <ImageIcon :size="48" />
                <p>재생성을 위한 생성 내역이 없습니다.</p>
                <span class="sub-hint">먼저 가상피팅을 실행해 보세요.</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Pose Preview Tooltip (Hover) -->
    <Teleport to="body">
      <Transition name="preview-pop">
        <div v-if="hoveredPoseData" class="pose-preview-tooltip" :style="hoverTooltipStyle">
          <div class="preview-tooltip-inner">
            <div class="preview-img-box">
              <img :src="hoveredPoseData.url" alt="Pose Preview" />
            </div>
            <div class="preview-info">
              <span class="pose-name">{{ hoveredPoseData.name }}</span>
              <span class="pose-desc">{{ hoveredPoseData.type === 'front' ? '전면 포즈' : '후면 포즈' }}</span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { 
  Upload, X, Sparkles, Download, History, ChevronRight, 
  ChevronLeft, ChevronDown, Check, AlertCircle, ImageIcon, Search, Wand2, Maximize2
} from 'lucide-vue-next';
import { useRuntimeConfig, useCookie, useRoute, useHead } from '#app';

definePageMeta({ 
  title: '스튜디오 가상피팅 생성' // Default title
});

const route = useRoute();
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
const productImageKeys = reactive<{ top: string | null, bottom: string | null }>({ top: null, bottom: null });

// --- Detail Mode State ---
const groupId = computed(() => route.query.groupId as string);
const isDetailMode = computed(() => !!groupId.value);
const isLoadingData = ref(false);
const metadata = reactive({
  userId: '-',
  regDtm: '-',
  status: 'IDLE'
});

const selectedPoseIds = ref<string[]>([]);

// --- Dynamic Page Title ---
watch(isDetailMode, (val) => {
  route.meta.title = val ? '📸 가상 피팅 작업 상세 ' : '📸 스튜디오 가상피팅 생성';
}, { immediate: true });

useHead({
  title: computed(() => isDetailMode.value ? '📸 가상 피팅 작업 상세 ' : '📸 스튜디오 가상피팅 생성')
});
const viewingPoseId = ref('A');
const viewingHistoryUrl = ref<string | null>(null);
const isImageViewerOpen = ref(false);

// --- Custom Model Modal State ---
const isCustomModelModalOpen = ref(false);
const modalActivePoseId = ref<string | null>(null);

// --- History State ---
interface HistoryItem {
  poseId: string;
  gender: string;
  url: string;
  requestId: string;
}
const cumulativeHistory = ref<HistoryItem[]>([]);

const activePoseHistory = computed(() => {
  if (!modalActivePoseId.value) return [];
  
  const defaultModel = {
    name: '기본 모델',
    url: getSampleImageUrl(modalActivePoseId.value),
    isDefault: true,
    isNew: false
  };

  const history = cumulativeHistory.value
    .filter(h => h.poseId === modalActivePoseId.value) // Removed gender filter
    .map((h, idx) => ({
      name: `${h.gender === 'female' ? '여성' : h.gender === 'male' ? '남성' : '마네킹'} 생성 결과 ${idx + 1}`,
      url: h.url,
      isDefault: false,
      isNew: false
    }))
    .reverse();

  return [defaultModel, ...history];
});

// --- Modal Pagination State ---
const modalCurrentPage = ref(0);
const modalPageSize = 6; // 3x2 grid

const modalTotalPages = computed(() => Math.ceil(activePoseHistory.value.length / modalPageSize));

const paginatedModels = computed(() => {
  const start = modalCurrentPage.value * modalPageSize;
  return activePoseHistory.value.slice(start, start + modalPageSize);
});

// --- Modal Drag State ---
const modalIsDragging = ref(false);
const modalStartX = ref(0);
const modalDragOffset = ref(0);
const modalTransitionName = ref('fade-slide');

// --- Hover Preview State ---
const hoveredPoseData = ref<{ id: string, name: string, type: string, url: string } | null>(null);
const hoverTooltipStyle = reactive({
  top: '0px',
  left: '0px'
});

const setHoveredPose = (event: MouseEvent, pose: PoseState) => {
  if (allGenerating.value) return;
  
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  
  // 툴팁 예상 높이 (너비 280px 기준 이미지 약 392px + 하단 텍스트 60px)
  const tooltipHeight = 460;
  const viewportHeight = window.innerHeight;
  
  let topPos = rect.top;
  
  // 화면 하단을 벗어날 경우 위로 끌어올림
  if (topPos + tooltipHeight > viewportHeight - 20) {
    topPos = viewportHeight - tooltipHeight - 20;
  }
  // 화면 상단을 벗어날 경우 아래로 내림
  if (topPos < 20) {
    topPos = 20;
  }
  
  // 툴팁 위치 지정 (카드 오른쪽)
  hoverTooltipStyle.top = `${topPos}px`;
  hoverTooltipStyle.left = `${rect.right + 20}px`;
  
  hoveredPoseData.value = {
    id: pose.id,
    name: pose.name,
    type: pose.type,
    url: pose.customPersonUrl || getSampleImageUrl(pose.id)
  };
};

const clearHoveredPose = () => {
  hoveredPoseData.value = null;
};

const onModalDragStart = (e: MouseEvent) => {
  if (modalTotalPages.value <= 1) return;
  modalIsDragging.value = true;
  modalStartX.value = e.pageX;
  modalDragOffset.value = 0;
};

const onModalDragMove = (e: MouseEvent) => {
  if (!modalIsDragging.value) return;
  modalDragOffset.value = e.pageX - modalStartX.value;
};

const onModalDragEnd = () => {
  if (!modalIsDragging.value) return;
  modalIsDragging.value = false;
  
  const threshold = 50; 
  if (modalDragOffset.value < -threshold && modalCurrentPage.value < modalTotalPages.value - 1) {
    modalTransitionName.value = 'slide-next';
    modalCurrentPage.value++;
  } else if (modalDragOffset.value > threshold && modalCurrentPage.value > 0) {
    modalTransitionName.value = 'slide-prev';
    modalCurrentPage.value--;
  }
  modalDragOffset.value = 0;
};

// Reset transition name for buttons
const prevModalPage = () => {
  if (modalCurrentPage.value > 0) {
    modalTransitionName.value = 'slide-prev';
    modalCurrentPage.value--;
  }
};
const nextModalPage = () => {
  if (modalCurrentPage.value < modalTotalPages.value - 1) {
    modalTransitionName.value = 'slide-next';
    modalCurrentPage.value++;
  }
};

watch(isCustomModelModalOpen, (isOpen) => {
  if (isOpen) {
    modalCurrentPage.value = 0;
    modalTransitionName.value = 'fade-slide';
  }
});

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
  const itemWidth = 50; // 70 -> 50
  const gap = 2; 
  const centerOffset = 25; // Adjusted for 50% width to keep active slide centered (100-50)/2
  
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
  customPersonUrl: string | null;
  retryCount: number; // Added for auto-retry logic
}

// 4 Poses (A, B, C, D) for each gender
const poseStates = reactive<PoseState[]>([
  { id: 'A', name: '여성 A', type: 'front', gender: 'female', status: 'idle', resultUrl: null, requestId: null, customPersonUrl: null, retryCount: 0 },
  { id: 'B', name: '여성 B', type: 'front', gender: 'female', status: 'idle', resultUrl: null, requestId: null, customPersonUrl: null, retryCount: 0 },
  { id: 'C', name: '여성 C', type: 'back', gender: 'female', status: 'idle', resultUrl: null, requestId: null, customPersonUrl: null, retryCount: 0 },
  { id: 'D', name: '여성 D', type: 'back', gender: 'female', status: 'idle', resultUrl: null, requestId: null, customPersonUrl: null, retryCount: 0 },
  { id: 'A', name: '남성 A', type: 'front', gender: 'male', status: 'idle', resultUrl: null, requestId: null, customPersonUrl: null, retryCount: 0 },
  { id: 'B', name: '남성 B', type: 'front', gender: 'male', status: 'idle', resultUrl: null, requestId: null, customPersonUrl: null, retryCount: 0 },
  { id: 'C', name: '남성 C', type: 'back', gender: 'male', status: 'idle', resultUrl: null, requestId: null, customPersonUrl: null, retryCount: 0 },
  { id: 'D', name: '남성 D', type: 'back', gender: 'male', status: 'idle', resultUrl: null, requestId: null, customPersonUrl: null, retryCount: 0 },
  { id: 'A', name: '마네킹 A', type: 'front', gender: 'mannequin', status: 'idle', resultUrl: null, requestId: null, customPersonUrl: null, retryCount: 0 },
  { id: 'B', name: '마네킹 B', type: 'front', gender: 'mannequin', status: 'idle', resultUrl: null, requestId: null, customPersonUrl: null, retryCount: 0 },
  { id: 'C', name: '마네킹 C', type: 'back', gender: 'mannequin', status: 'idle', resultUrl: null, requestId: null, customPersonUrl: null, retryCount: 0 },
  { id: 'D', name: '마네킹 D', type: 'back', gender: 'mannequin', status: 'idle', resultUrl: null, requestId: null, customPersonUrl: null, retryCount: 0 },
]);

const topInput = ref<HTMLInputElement | null>(null);
const bottomInput = ref<HTMLInputElement | null>(null);

// --- Computed ---
const filteredPoses = computed(() => poseStates.filter(p => p.gender === currentGender.value));
const selectedPose = computed(() => filteredPoses.value.find(p => p.id === viewingPoseId.value) || filteredPoses.value[0]);

const historyList = computed(() => {
  const list = cumulativeHistory.value
    .filter(h => h.poseId === viewingPoseId.value) // Removed gender filter
    .map(h => ({ 
      url: h.url, 
      status: 'done' as JobStatus,
      current: viewingHistoryUrl.value 
        ? h.url === viewingHistoryUrl.value 
        : h.url === displayImageUrl.value 
    }));

  // Add loading card if current viewing pose is generating
  if (selectedPose.value && (selectedPose.value.status === 'pending' || selectedPose.value.status === 'processing')) {
    list.push({
      url: '',
      status: selectedPose.value.status,
      current: false
    });
  }

  return list;
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
  return cumulativeHistory.value.some(h => h.poseId === poseId); // Removed gender filter
};

// --- Watchers ---
watch(currentGender, () => {
  // const firstPose = filteredPoses.value[0];
  selectedPoseIds.value = [];
  // viewingPoseId.value = firstPose.id; // Keep viewingPoseId to prevent jumping
  viewingHistoryUrl.value = null;
});

watch(() => historyList.value.length, (newLen, oldLen) => {
  if (newLen > oldLen) {
    nextTick(() => {
      currentSlideIndex.value = newLen - 1;
    });
  }
});

watch(viewingPoseId, () => {
  viewingHistoryUrl.value = null;
  // Auto-scroll to the last index (latest result or loader) when switching pose tabs
  nextTick(() => {
    if (historyList.value.length > 0) {
      currentSlideIndex.value = historyList.value.length - 1;
    } else {
      currentSlideIndex.value = 0;
    }
  });
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

const setAsBaseImage = (url: string) => {
  const pose = poseStates.find(p => p.id === viewingPoseId.value && p.gender === currentGender.value);
  if (pose) {
    pose.customPersonUrl = url;
    showToast(`${pose.id} 포즈의 베이스 사진으로 설정되었습니다.`);
  }
};

const selectCustomModel = (url: string) => {
  const pose = poseStates.find(p => p.id === modalActivePoseId.value && p.gender === currentGender.value);
  if (pose) {
    pose.customPersonUrl = url;
    isCustomModelModalOpen.value = false;
    showToast(`${pose.id} 포즈 모델이 변경되었습니다.`);
  }
};

const extractS3Key = (url: string | null) => {
  if (!url) return null;
  // If it's already a relative path, return it
  if (!url.startsWith('http')) return url;
  
  try {
    const urlObj = new URL(url);
    // Remove leading slash and ignore query params
    let path = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
    // Special case for our bucket: result/... or sample/...
    if (path.includes('result/')) {
      return path.substring(path.indexOf('result/'));
    }
    if (path.includes('sample/')) {
      return path.substring(path.indexOf('sample/'));
    }
    return path;
  } catch (e) {
    return url;
  }
};

// --- Data Fetching (Detail Mode) ---
const loadJobData = async () => {
  if (!isDetailMode.value) return;
  
  try {
    isLoadingData.value = true;
    const res = await fetch(`${apiBase}/api/studio/jobs/${groupId.value}`);
    if (res.ok) {
      const data = await res.json();
      const jobList = data.jobs || [];
      
      if (jobList.length > 0) {
        // Sort chronologically
        jobList.sort((a: any, b: any) => (a.sysRegDtm || '').localeCompare(b.sysRegDtm || ''));
        
        const first = jobList[0];
        poseGroupId.value = groupId.value as any;
        currentGender.value = (first.gender || 'female').toLowerCase();
        selectedProductType.value = first.productType || 'base';
        promptText.value = first.prompt || '';
        metadata.userId = first.userId || '-';
        metadata.regDtm = first.sysRegDtm || '-';

        jobList.forEach((job: any) => {
          const jobGender = (job.gender || currentGender.value).toLowerCase();
          const jobSlot = (job.slot || '').toUpperCase();
          
          if (job.productImageUrl) {
            if (jobSlot === 'A' || jobSlot === 'B') {
              topImage.value = job.productImageUrl;
              productImageKeys.top = job.productImageKey;
            }
            if (jobSlot === 'C' || jobSlot === 'D') {
              bottomImage.value = job.productImageUrl;
              productImageKeys.bottom = job.productImageKey;
            }
          }

          const idx = poseStates.findIndex(p => p.id.toUpperCase() === jobSlot && p.gender.toLowerCase() === jobGender);
          if (idx > -1) {
            const pose = poseStates[idx];
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
            
            if (job.resultUrl && !cumulativeHistory.value.find(h => h.requestId === job.requestId)) {
              cumulativeHistory.value.push({
                poseId: pose.id,
                gender: pose.gender,
                url: job.resultUrl,
                requestId: job.requestId
              });
            }
          }
        });

        // Set initial viewing pose
        const firstWithResult = poseStates.find(p => p.gender === currentGender.value && p.resultUrl);
        if (firstWithResult) {
          viewingPoseId.value = firstWithResult.id;
        }

        if (allGenerating.value) startPolling();
      }
    }
  } catch (e) {
    console.error('[Studio] Failed to load job data:', e);
  } finally {
    isLoadingData.value = false;
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr || dateStr === '-') return '-';
  try {
    const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}. ${pad(d.getMonth() + 1)}. ${pad(d.getDate())}. ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch (e) { return dateStr; }
};

onMounted(() => {
  if (isDetailMode.value) {
    loadJobData();
  }
});

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
                  viewingHistoryUrl.value = null; 
                  // Move to the last index (the newest result)
                  nextTick(() => {
                    currentSlideIndex.value = historyList.value.length - 1;
                  });
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
            if (pose.retryCount < 1) {
              pose.retryCount++;
              pose.status = 'pending';
              retrySinglePose(pose);
            } else {
              pose.status = 'error';
              showToast(`${pose.id} 포즈 이미지 생성에 실패했습니다.`);
            }
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
  const hasFile = selectedFiles.top || selectedFiles.bottom;
  const hasKey = productImageKeys.top || productImageKeys.bottom;
  
  if (selectedPoseIds.value.length === 0 || (!hasFile && !hasKey)) {
    showToast('분석할 의류 이미지와 포즈를 선택해주세요.');
    return;
  }

  // If not in detail mode, we use the existing poseGroupId.value (initialized as randomUUID)
  // We no longer regenerate it even if a new file is uploaded, to keep them in the same group.
  if (!isDetailMode.value && !poseGroupId.value) {
    poseGroupId.value = crypto.randomUUID();
  }

  for (const id of selectedPoseIds.value) {
    const pose = filteredPoses.value.find(p => p.id === id);
    if (!pose) continue;
    pose.retryCount = 0; 
    
    // Determine which file or key to use for this pose
    let fileToUse: File | null = null;
    let keyToUse: string | null = null;
    
    if (pose.type === 'front') {
      fileToUse = selectedFiles.top;
      keyToUse = productImageKeys.top;
    } else {
      fileToUse = selectedFiles.bottom;
      keyToUse = productImageKeys.bottom;
    }
    
    // Fallback logic if specific one isn't available
    if (!fileToUse && !keyToUse) {
      fileToUse = selectedFiles.top || selectedFiles.bottom;
      keyToUse = productImageKeys.top || productImageKeys.bottom;
    }

    await executeJobRequest(pose, fileToUse, keyToUse);
  }
};

const retrySinglePose = async (pose: PoseState) => {
  let fileToUse: File | null = null;
  let keyToUse: string | null = null;
  
  if (pose.type === 'front') {
    fileToUse = selectedFiles.top;
    keyToUse = productImageKeys.top;
  } else {
    fileToUse = selectedFiles.bottom;
    keyToUse = productImageKeys.bottom;
  }
  
  if (!fileToUse && !keyToUse) {
    fileToUse = selectedFiles.top || selectedFiles.bottom;
    keyToUse = productImageKeys.top || productImageKeys.bottom;
  }

  await executeJobRequest(pose, fileToUse, keyToUse);
};

const executeJobRequest = async (pose: PoseState, fileToUse: File | null, keyToUse: string | null) => {
  pose.status = 'pending';
  const formData = new FormData();
  formData.append('poseGroupId', poseGroupId.value);
  formData.append('slot', pose.id);
  formData.append('gender', currentGender.value);
  formData.append('productType', selectedProductType.value);
  
  if (fileToUse) {
    formData.append('product', fileToUse);
  } else if (keyToUse) {
    formData.append('productImageKey', keyToUse);
  }

  formData.append('personImageKey', extractS3Key(pose.customPersonUrl) || `sample/${currentGender.value}-${selectedProductType.value}-${pose.type === 'front' ? 'front' : 'rear'}_${pose.id.toLowerCase()}.jpg`);
  formData.append('prompt', promptText.value);
  formData.append('userId', currentUserId.value);

  // Debug: FormData contents
  console.log('[Studio] Sending Job Request:', Object.fromEntries(formData.entries()));
  try {
    const res = await fetch(`${apiBase}/api/studio/jobs`, { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      pose.requestId = data.requestId;
      startPolling();
    } else {
      if (pose.retryCount < 1) {
        pose.retryCount++;
        executeJobRequest(pose, fileToUse, keyToUse);
      } else {
        pose.status = 'error';
        showToast(`${pose.id} 포즈 이미지 생성에 실패했습니다.`);
      }
    }
  } catch (e) {
    if (pose.retryCount < 1) {
      pose.retryCount++;
      executeJobRequest(pose, fileToUse, keyToUse);
    } else {
      pose.status = 'error';
      showToast(`${pose.id} 포즈 이미지 생성 중 오류가 발생했습니다.`);
    }
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
  color: var(--color-text-main);
  overflow: visible; /* 그림자가 잘리지 않도록 수정 */
  position: relative;
  font-family: 'Pretendard', sans-serif;
  padding: 0.3rem; /* 전체적인 여백 확보로 그림자 공간 마련 */
  box-sizing: border-box;
}

.dragging { user-select: none; }

.studio-sidebar-v2 {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 500px;
  height: 100%; /* 부모 높이에 맞춤 */
  z-index: 5;
  background: var(--color-bg-surface);
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.1);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.sidebar-header-v2 {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-title-v2 { font-size: 1.1rem; font-weight: 700; color: var(--color-text-main); }

.sidebar-content-v2 {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1.5rem;
}
.sidebar-content-v2::-webkit-scrollbar { width: 4px; }
.sidebar-content-v2::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }

.control-group { 
  display: flex; 
  flex-direction: column; 
  gap: 0.75rem; 
}
.custom-header-row { display: flex; align-items: center; justify-content: space-between; }
.group-title { font-size: 0.9rem; font-weight: 700; color: var(--color-text-main); }

.modern-select-wrapper { 
  position: relative; 
  display: flex; 
  align-items: center; 
  background: var(--color-bg-alt); 
  border-radius: 12px; 
  border: 1px solid var(--color-border); 
  padding: 0 12px; 
  transition: all 0.2s; 
}
.modern-select-wrapper.is-disabled { opacity: 0.6; cursor: not-allowed; background: #eee; }
.modern-select-v2 { 
  width: 100%; 
  background: transparent; 
  border: none; 
  outline: none; 
  font-size: 0.85rem; 
  padding: 10px 0; 
  color: var(--color-text-main); 
  cursor: pointer; 
  appearance: none; 
}
.modern-select-v2:disabled { cursor: not-allowed; }
.select-icon-v2 { 
  position: absolute; 
  right: 12px; 
  pointer-events: none; 
  color: #888; 
}

.upload-slots-row { display: flex; gap: 0.75rem; }
.upload-area-v2 {
  flex: 1;
  aspect-ratio: 1/1;
  border: 1.5px dashed var(--color-border);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--color-bg-alt);
  transition: all 0.2s;
  overflow: hidden;
}

.upload-area-v2:hover { background: var(--color-bg-header); border-color: var(--color-primary); }
.upload-placeholder-v2 { display: flex; flex-direction: column; align-items: center; gap: 4px; color: #888; font-size: 0.75rem; font-weight: 600; }
.image-preview-v2 { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.preview-img { max-width: 100%; max-height: 100%; object-fit: contain; }
.remove-btn-v2 { position: absolute; top: 4px; right: 4px; background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: 50%; padding: 3px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; color: var(--color-text-main); }

.pose-tabs-v2 { display: flex; background: var(--color-bg-alt); padding: 4px; border-radius: 10px; gap: 4px; }
.pose-tab { flex: 1; padding: 6px; font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted); border-radius: 8px; transition: all 0.2s; background: transparent; border: none; cursor: pointer; }
.pose-tab.active { background: var(--color-bg-surface); color: var(--color-text-main); box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
.pose-tabs-v2.is-disabled { opacity: 0.6; pointer-events: none; }
.pose-tab:disabled { cursor: not-allowed; }

.pose-grid-v2 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
.pose-thumb-v2 { aspect-ratio: 1/1.4; background: var(--color-bg-alt); border-radius: 8px; overflow: hidden; position: relative; cursor: pointer; border: 2px solid transparent; }
.pose-card-v2.active .pose-thumb-v2 { border-color: #5c7cfa; }
.disabled-card {
  opacity: 0.3;
  pointer-events: none;
  filter: grayscale(0.8);
  transition: all 0.3s ease;
}
.pose-thumb-v2 img { width: 100%; height: 100%; object-fit: cover; }

.metadata-group {
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 1.25rem;
}
body:not(.light-mode) .metadata-group {
  background: rgba(0, 0, 0, 0.2);
}
.metadata-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}
.meta-label {
  color: var(--color-text-muted);
  font-weight: 600;
}
.meta-value {
  color: var(--color-text-main);
  font-weight: 700;
}

.pose-loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; }
.pose-done-check { position: absolute; bottom: 4px; right: 4px; background: #5c7cfa; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.mini-spinner { width: 16px; height: 16px; border: 2px solid #ddd; border-top-color: #5c7cfa; border-radius: 50%; animation: spin 0.8s linear infinite; }

.pose-expand-btn {
  display: none; /* Removed as requested */
}

.model-change-btn {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #111;
  opacity: 0;
  transition: all 0.2s;
  cursor: pointer;
  z-index: 5;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.pose-thumb-v2:hover .model-change-btn { opacity: 1; bottom: 12px; }
.model-change-btn:hover:not(:disabled) { background: var(--color-bg-alt); border-color: var(--color-primary); color: var(--color-primary); }
.model-change-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.modern-textarea { 
  width: 100%; 
  height: 80px; 
  border: 1px solid var(--color-border); 
  border-radius: 12px; 
  padding: 12px; 
  font-size: 0.85rem; 
  resize: none; 
  background: var(--color-bg-alt); 
  color: var(--color-text-main); 
  outline: none; 
  transition: border-color 0.2s; 
  font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
}
.modern-textarea::placeholder { 
  font-weight: 400; 
  opacity: 0.6; 
  color: var(--color-text-muted); 
  font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
}
body:not(.light-mode) .modern-textarea::placeholder {
  color: #ccc;
  opacity: 0.8;
}
.modern-textarea:focus { border-color: #5c7cfa; }
.modern-textarea:disabled { opacity: 0.6; background: #eee; cursor: not-allowed; }

.disabled-section {
  opacity: 0.4;
  pointer-events: none;
  filter: grayscale(0.5);
  transition: all 0.3s ease;
}

.sidebar-footer-v2 { 
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-surface);
}
.generate-action-btn { width: 100%; height: 52px; background: var(--color-bg-alt); color: var(--color-text-muted); border-radius: 12px; font-size: 1rem; font-weight: 800; display: flex; align-items: center; justify-content: center; border: none; transition: background 0.2s; }
.generate-action-btn:not(:disabled) { background: var(--color-primary); color: #fff; cursor: pointer; }

.studio-main-v2 { 
  flex: 1; 
  background: transparent; 
  padding-left: 2rem; /* 사이드바와의 간격 */
  display: flex; 
  flex-direction: column; 
  height: 100%; /* 부모 높이에 맞춤 */
  overflow: visible; 
}
.main-layout-v2 { 
  display: flex; 
  flex-direction: row; 
  align-items: stretch; /* 높이 강제 맞춤 */
  justify-content: center;
  gap: 1.5rem; 
  width: 100%; 
  max-width: 1400px; 
  margin: 0 auto; 
  height: 100%; /* 부모 높이 100% 사용 */
}

.preview-stage-v2 { 
  width: 100%; 
  height: 100%;
  display: flex; 
  flex-direction: column; 
  min-height: 0;
  overflow: visible !important; 
}
.section-title-v2 { font-size: 1rem; font-weight: 800; color: var(--color-text-main); margin: 0; }
.section-title-v2.inside { position: relative; z-index: 15; }
.section-title-v2.gray { color: var(--color-text-muted); margin-bottom: 0.75rem; }

.preview-card-v2 { 
  width: 100%; 
  height: 100%; 
  background: var(--color-bg-surface); 
  border: 1px solid var(--color-border);
  border-radius: 20px; 
  display: flex; 
  flex-direction: column;
  align-items: stretch; 
  justify-content: flex-start; 
  position: relative; 
  z-index: 1; 
  transition: all 0.5s ease;
  min-height: 0;
  overflow: visible; 
}
.shadow-premium { box-shadow: 0 15px 35px rgba(0,0,0,0.05); }

/* Premium Glowing Wave Effect */
.generating-vibe {
  position: relative;
  border: 3px solid transparent !important;
  background-image: linear-gradient(#fff, #fff), 
                    linear-gradient(90deg, #5c7cfa, #12b886, #ae3ec9, #5c7cfa);
  background-origin: border-box;
  background-clip: padding-box, border-box;
  background-size: 100% 100%, 200% 100%;
  animation: border-wave-flow 3s linear infinite;
  box-shadow: 0 20px 40px rgba(92, 124, 250, 0.15);
}

@keyframes border-wave-flow {
  0% { background-position: 0% 0, 0% 0; }
  100% { background-position: 0% 0, 200% 0; }
}

/* Remove pulse animation as we moved to wave */
@keyframes luxury-glow-pulse {
  0% { transform: scale(1); }
  100% { transform: scale(1); }
}

/* Remove old pseudo-element borders */
.generating-vibe::before, .generating-vibe::after { display: none; }

@keyframes border-gradient-wave {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.result-image-wrapper { 
  width: 100%; 
  flex: 1;
  display: flex; 
  align-items: center; 
  justify-content: center; 
  position: relative; 
  padding: 1rem; /* 안전거리 확보 */
  box-sizing: border-box; 
  overflow: visible; 
  border-radius: 0 0 20px 20px;
  cursor: default !important;
  min-height: 0;
}
.img-inner-wrap { 
  position: relative; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  width: 100%; 
  height: 100%; 
}
.img-relative-box { 
  position: relative; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  padding: 15px; /* 사용자가 요청한 15px 패딩 */
  box-sizing: border-box;
}
.img-relative-box.is-loading-card {
  width: 100%; /* 로딩 시에는 부모 너비 활용 */
  height: auto;
  max-width: 420px;
  aspect-ratio: 3/4; /* 로딩 카드만 고정 비율 유지 */
  background: var(--color-bg-surface);
  border-radius: 20px;
  border: 1px solid var(--color-border);
  box-shadow: 0 15px 45px rgba(0,0,0,0.1);
}
.result-img { 
  display: block; 
  /* width: 100%; */
  height: 100%;
  max-width: 100%; 
  max-height: 100%; 
  object-fit: contain;
  border-radius: 8px; 
  border: 1px solid var(--color-border); 
  box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
  transition: opacity 0.5s ease;
  cursor: default !important;
  padding: 0; 
  background: #ffffff;
}

.animate-fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}


/* Hover Zoom Button */
.hover-zoom-btn:hover { 
  background: #5c7cfa;
  color: white;
  border-color: #5c7cfa;
  transform: scale(1.05);
}

.result-hover-actions {
  position: absolute;
  top: 40px;
  right: 65px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
}

.hover-action-btn {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-main);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.img-inner-wrap:hover .hover-action-btn {
  opacity: 1;
  transform: translateX(0);
}

.hover-action-btn:hover {
  background: #111;
  color: white;
  border-color: #111;
  transform: scale(1.05);
}

.hover-action-btn.wand-btn:hover {
  background: #7e5bef;
  border-color: #7e5bef;
}
.empty-preview-v2 {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
.empty-hint { color: #ddd; font-size: 0.9rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }

.slider-header-v2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1rem 0.5rem;
  z-index: 20;
}

.pose-view-selector-v2 {
  display: flex;
  background: var(--color-bg-alt);
  padding: 4px;
  border-radius: 12px;
  gap: 4px;
  border: 1px solid var(--color-border);
}
.view-tab {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.view-tab:hover:not(:disabled) { background: var(--color-bg-header); color: var(--color-text-main); }
.view-tab.active { background: var(--color-primary); color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
.view-tab:disabled { opacity: 0.3; cursor: not-allowed; }

/* Slider Styles */
.slider-container-v2 {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 12px;
  cursor: grab;
  user-select: none;
  background: var(--color-bg-alt);
  padding: 1rem;
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
  flex: 0 0 50%;
  width: 50%;
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
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-main);
  cursor: pointer;
  z-index: 20;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
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
  bottom: 25px; /* 하단 여백에 맞춰 위치 상향 */
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 20;
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

.empty-gallery-msg {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 0.95rem;
  font-weight: 500;
  border: 2px dashed var(--color-border);
  border-radius: 12px;
  margin-top: 0;
  background: var(--color-bg-alt);
  min-height: 120px;
}
.gallery-scroller-v2 { display: flex; gap: 1rem; padding-bottom: 0; align-items: center; }
.gallery-scroller-v2::-webkit-scrollbar { height: 6px; }
.gallery-scroller-v2::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }

.gallery-item-v2 { flex-shrink: 0; width: 130px; aspect-ratio: 1/1.3; background: var(--color-bg-alt); border-radius: 10px; overflow: hidden; cursor: pointer; border: 2px solid transparent; position: relative; transition: all 0.23s ease; }
.gallery-item-v2.active { border-color: #5c7cfa; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(92, 124, 250, 0.15); }
.gallery-item-v2 img { width: 100%; height: 100%; object-fit: cover; }
.latest-dot { position: absolute; top: 6px; right: 6px; width: 6px; height: 6px; background: #5c7cfa; border-radius: 50%; }

.processing-vibe { 
  flex: 1;
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center;
  gap: 1.5rem; 
  color: var(--color-text-muted); 
}
.radiant-loader { width: 40px; height: 40px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s infinite linear; }

.alert-overlay-modern { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center; }
.alert-content-modern { background: var(--color-bg-surface); width: 360px; padding: 2.5rem; border: 1px solid var(--color-border); border-radius: 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
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

/* Custom Model Modal Styles */
.custom-model-modal {
  background: var(--color-bg-surface);
  width: 520px; /* 3x2 그리드에 최적화된 너비 */
  max-width: 90vw;
  border: 1px solid var(--color-border);
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
}

.modal-header-v2 {
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header-v2 h3 { font-size: 1.1rem; font-weight: 700; margin: 0; }
.modal-close-v2 { background: none; border: none; color: #888; cursor: pointer; }

.modal-body-v2 { padding: 1rem 1.5rem 1.25rem; }
.model-slider-wrapper { display: flex; flex-direction: column; gap: 0.75rem; }
.model-grid-container { min-height: 380px; position: relative; cursor: grab; }
.model-grid-container.dragging { cursor: grabbing; }
.model-grid-v2 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 0.75rem;
  justify-content: center;
}

/* Modal Transitions */
.slide-next-enter-active, .slide-next-leave-active,
.slide-prev-enter-active, .slide-prev-leave-active,
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-next-enter-from { opacity: 0; transform: translateX(30px); }
.slide-next-leave-to { opacity: 0; transform: translateX(-30px); }

.slide-prev-enter-from { opacity: 0; transform: translateX(-30px); }
.slide-prev-leave-to { opacity: 0; transform: translateX(30px); }

.fade-slide-enter-from { opacity: 0; transform: scale(0.98); }
.fade-slide-leave-to { opacity: 0; transform: scale(1.02); }

.model-selection-card {
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.2s;
  background: var(--color-bg-alt);
  padding-bottom: 6px;
  text-align: center;
}

.model-selection-card:hover { transform: translateY(-4px); border-color: #eee; }
.model-selection-card.is-new { border-color: rgba(92, 124, 250, 0.3); background: #f0f4ff; }
.model-thumb { aspect-ratio: 1/1.3; overflow: hidden; margin-bottom: 4px; position: relative; }
.model-thumb img { width: 100%; height: 100%; object-fit: cover; }
.model-name { font-size: 0.75rem; font-weight: 600; color: var(--color-text-main); }

.new-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #5c7cfa;
  color: white;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(92, 124, 250, 0.3);
  animation: pulse-small 2s infinite;
}

@keyframes pulse-small {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); opacity: 0.9; }
  100% { transform: scale(1); }
}

.modal-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding-top: 0.5rem;
}

.modal-nav-btn {
  background: var(--color-bg-alt);
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: all 0.2s;
}

.modal-nav-btn:hover:not(:disabled) { background: #eee; color: #111; }
.modal-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.modal-dots { display: flex; gap: 6px; }
.modal-dot {
  width: 6px;
  height: 6px;
  background: #eee;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}
.modal-dot.active { background: #5c7cfa; transform: scale(1.2); }

.empty-history-v2 {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  color: #bbb;
  gap: 1rem;
}

.empty-history-v2 p { margin: 0; font-weight: 700; color: #888; }
.empty-history-v2 .sub-hint { font-size: 0.8rem; color: #aaa; }

/* Loading Card Style */
.is-loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fcfcfc;
  width: 100%;
  height: 100%;
}

/* Remove loading card glow animation */
@keyframes loading-card-glow {
  0% { opacity: 1; }
  100% { opacity: 1; }
}

.is-loading-card::before {
  content: '';
  position: absolute;
  /* inset: -2px; */
  /* background: linear-gradient(90deg, #f0f0f0, #e0e7ff, #f0f0f0); */
  background-size: 200% 100%;
  /* animation: shimmer-load 1.5s infinite linear; */
  z-index: 0;
  opacity: 0.5; /* 발광을 위해 투명도 조절 */
}

.is-loading-card::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 14px;
  z-index: 1;
}

@keyframes shimmer-load {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

.inline-loader-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.radiant-loader.mini { width: 30px; height: 30px; border-width: 2px; }
.loader-text-mini { font-size: 0.8rem; font-weight: 600; color: #999; margin: 0; }

/* Pose Preview Tooltip */
.pose-preview-tooltip {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  filter: drop-shadow(0 20px 40px rgba(0,0,0,0.25));
}

.preview-tooltip-inner {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  overflow: hidden;
  width: 280px;
  display: flex;
  flex-direction: column;
  animation: tooltip-shake 0.4s ease-out;
}

.preview-img-box {
  width: 100%;
  aspect-ratio: 1/1.4;
  background: var(--color-bg-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-info {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--color-bg-surface);
}

.preview-info .pose-name {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--color-text-main);
}

.preview-info .pose-desc {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

/* Transitions */
.preview-pop-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.preview-pop-leave-active {
  transition: all 0.2s ease-in;
}
.preview-pop-enter-from {
  opacity: 0;
  transform: translateX(-15px) scale(0.95);
}
.preview-pop-leave-to {
  opacity: 0;
  transform: translateX(-10px) scale(0.98);
}

@keyframes tooltip-shake {
  0% { transform: scale(0.98); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}
</style>
