<template>
  <div class="muse-create-page">
    <!-- Header -->
    <div class="studio-layout">
      <!-- Left: Templates Area -->
      <div class="sidebar-left glass-panel animate-fade-in stagger-2">
        <div class="section-title">
          <Sparkles :size="16" />
          프리셋 템플릿
        </div>
        <div class="template-list">
          <div 
            v-for="tpl in templates" 
            :key="tpl.template_id"
            :class="['template-card', { active: selectedTemplateId === tpl.template_id }]"
            @click="selectTemplate(tpl)"
          >
            <div class="tpl-thumb-wrapper">
              <img :src="tpl.image" :alt="tpl.name" class="tpl-thumb" />
            </div>
            <span class="tpl-name">{{ tpl.name }}</span>
          </div>
        </div>
      </div>

      <!-- Center: Preview Area -->
      <div class="preview-center animate-fade-in stagger-3">
        <div class="preview-card glass-panel">
          <div class="preview-status">
            <span class="status-dot"></span>
            AI Muse Preview
          </div>
          <div class="preview-image-container">
            <template v-if="currentPreviewImage">
              <img :src="currentPreviewImage" alt="Muse Preview" class="main-preview" />
            </template>
            <div v-else class="preview-placeholder">
              <div class="placeholder-studio-bg"></div>
              <div class="placeholder-content">
                <div class="icon-circle">
                  <Sparkles :size="32" class="sparkle-icon" />
                </div>
                <h3>새로운 뮤즈를 설계해 주세요</h3>
                <p>좌측 템플릿과 우측 미세조정 옵션을 조합하여<br/>당신만의 가상 뮤즈를 생성할 수 있습니다.</p>
              </div>
            </div>

            <!-- 실제 생성 중에만 표시되는 프로그레스 바 -->
            <div v-if="isSaving" class="preview-loading-indicator">
              <div class="loading-bar"></div>
            </div>
          </div>
        </div>

        <!-- Center Bottom: Prompt Input Area -->
        <div class="center-prompt-area glass-panel animate-slide-up">
           <div class="prompt-input-wrapper">
             <textarea 
               v-model="currentMuse.prompt" 
               placeholder="예: 차갑고 도시적인 느낌의 모델..." 
               class="center-textarea"
               rows="2"
             ></textarea>
             <div class="prompt-hints">
               <span class="hint">Shift + Enter로 줄바꿈</span>
               <span class="token-count">{{ currentMuse.prompt.length }} / 500</span>
             </div>
           </div>
        </div>
      </div>

      <!-- Right: Customization Area -->
      <div ref="sidebarRef" class="sidebar-right glass-panel animate-fade-in stagger-4">
        <div class="section-title">
          <Settings2 :size="16" />
          모델 스튜디오 설정
        </div>
        
        <div class="custom-panel">
          <!-- Muse Name -->
          <div id="muse-name-field" class="control-group name-group">
            <label>뮤즈 이름</label>
            <BaseInput style="width: 100%;" v-model="currentMuse.name" placeholder="예: 루시" />
          </div>

          <!-- Model Selection -->
          <div class="control-group model-select-group">
            <label>AI 모델</label>
            <div class="chip-group-v2">
              <button 
                v-for="m in modelOptions" 
                :key="m.value"
                :class="['chip-btn-v2', { active: currentMuse.selected_model === m.value }]"
                @click="currentMuse.selected_model = m.value"
              >
                {{ m.label }}
              </button>
            </div>
          </div>

          <!-- Quality Selection -->
          <div class="control-group quality-select-group">
            <label>생성 화질</label>
            <div class="chip-group-v2">
              <button 
                v-for="q in qualityOptions" 
                :key="q.value"
                :class="['chip-btn-v2', { active: currentMuse.selected_quality === q.value }]"
                @click="currentMuse.selected_quality = q.value"
              >
                {{ q.label }}
              </button>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Fine-Tuning Accordion -->
          <div class="fine-tune-accordion-v2">
            <div 
              v-for="(cat, cId) in fineTuneConfig" 
              :key="cId" 
              :ref="el => categoryRefs[cId] = el"
              class="ft-category-v2" 
              :class="{ expanded: expandedFTCategory === cId }"
            >
              <button class="category-header-v2" @click="toggleFTCategory(cId)">
                <span class="cat-name">{{ cat.name }}</span>
                <ChevronDown :size="16" class="arrow-icon" />
              </button>
              
              <Transition name="accordion-slide">
                <div v-show="expandedFTCategory === cId" class="category-body-v2">
                  <div class="category-content-inner">
                    <div v-if="cat.items" class="cat-items">
                      <div v-for="item in cat.items" :key="item.key" class="ft-item-row">
                        <label class="item-label">{{ item.label }}</label>
                        <div v-if="item.type === 'chip'" class="chip-group">
                          <button 
                            v-for="opt in item.options" 
                            :key="opt.value"
                            :class="['chip-btn', { active: currentMuse[item.key] === opt.value }]"
                            @click="currentMuse[item.key] = opt.value"
                          >
                            {{ opt.label }}
                          </button>
                        </div>
                        <div v-else-if="item.type === 'hair_grid'" class="hair-style-grid-mini">
                          <div 
                            v-for="hair in filteredHairStyles" 
                            :key="hair.id"
                            :class="['hair-card-mini', { active: currentMuse.hair_style === hair.id }]"
                            @click="currentMuse.hair_style = hair.id"
                          >
                            <div class="hair-img-wrapper-mini">
                              <img :src="getHairImage(hair)" :alt="hair.name" />
                            </div>
                            <span class="hair-name-mini">{{ hair.name }}</span>
                          </div>
                        </div>
                        <div v-else-if="item.type === 'hair_color'" class="hair-color-area-v2">
                          <div class="hair-color-presets">
                            <div 
                              v-for="color in hairColors" 
                              :key="color.hex"
                              :class="['tone-circle-v2', { active: currentMuse.hair_color === color.hex }]"
                              :style="{ background: color.hex }"
                              @click="currentMuse.hair_color = color.hex"
                            ></div>
                            <div class="custom-color-trigger-v2">
                              <input type="color" v-model="currentMuse.hair_color" class="hidden-color-input" id="hairColorPickerFT" />
                              <label for="hairColorPickerFT" class="color-picker-label-v2" :style="isCustomHairColor ? { background: currentMuse.hair_color } : {}"></label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-if="cat.groups" class="cat-groups">
                      <div v-for="group in cat.groups" :key="group.name" class="ft-sub-group">
                        <h4 class="sub-group-title">{{ group.name }}</h4>
                        <div class="sub-group-options">
                          <BaseSlider 
                            v-for="opt in group.options"
                            :key="opt.key"
                            :label="opt.label"
                            :min-label="opt.minLabel"
                            :max-label="opt.maxLabel"
                            v-model="fineTuneValues[opt.key]"
                            @change="handleFTChange"
                          />
                        </div>
                      </div>
                    </div>
                    <div v-if="cat.options" class="cat-flat-options">
                      <BaseSlider 
                        v-for="opt in cat.options"
                        :key="opt.key"
                        :label="opt.label"
                        :min-label="opt.minLabel"
                        :max-label="opt.maxLabel"
                        v-model="fineTuneValues[opt.key]"
                        @change="handleFTChange"
                      />
                    </div>
                    <div v-if="cId === 'skin'" class="personal-palette-preview">
                      <div class="palette-colors">
                        <div 
                          v-for="c in personalColorPalettes[currentMuse.personal_color].colors" 
                          :key="c"
                          class="palette-dot"
                          :style="{ background: c }"
                        ></div>
                      </div>
                      <p class="palette-desc">{{ personalColorPalettes[currentMuse.personal_color].name }} 무드 컬러</p>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>
          </div>

          <div class="divider"></div>

          <BaseButton variant="ghost" style="width: 100%;" @click="resetToTemplate">
            <RotateCcw :size="16" />
            전체 초기화
          </BaseButton>

          <div class="divider"></div>

          <!-- Bottom Action Buttons -->
          <div class="sidebar-footer-actions">
            <BaseButton 
              v-if="!isSaved"
              variant="primary" 
              :loading="isSaving" 
              @click="saveMuse" 
              class="generate-btn-v2"
            >
              <Wand2 :size="20" />
              가상 뮤즈 생성
            </BaseButton>
            
            <BaseButton 
              v-else
              variant="primary" 
              @click="selectMuseForFitting"
              class="select-muse-btn"
            >
              <CheckCircle2 :size="20" />
              피팅 스튜디오로 이동
            </BaseButton>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- Full Screen Loading Overlay for Generation -->
  <Transition name="fade">
    <div v-if="isSaving" class="generation-overlay">
      <div class="glass-loader">
        <div class="loader-spinner"></div>
        <div class="loader-text">
          <h3>나노바나나 엔진이 이미지를 생성 중입니다...</h3>
          <p>(약 10~20초 소요)</p>
          <div class="polling-status">상세 상태: {{ pollingStatusText }}</div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Validation & Notification Modal -->
  <BaseModal v-model="showErrorModal" title="스튜디오 알림">
    <div class="error-modal-content">
      <p class="error-modal-msg">{{ errorMessage }}</p>
    </div>
    <template #footer>
      <BaseButton variant="primary" @click="showErrorModal = false">확인</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { ChevronLeft, Save, Sparkles, Settings2, RotateCcw, Wand2, MessageSquareQuote, Sliders, ChevronDown, ChevronUp, CheckCircle2, Pipette } from 'lucide-vue-next';
import BaseButton from '~/components/ui/BaseButton.vue';
import BaseInput from '~/components/ui/BaseInput.vue';
import BaseSlider from '~/components/ui/BaseSlider.vue';
import BaseModal from '~/components/ui/BaseModal.vue';
import { useRuntimeConfig, useCookie, useRoute } from '#app';

definePageMeta({
  title: '🎨 뮤즈 생성 스튜디오'
});

const route = useRoute();
const router = useRouter();
const config = useRuntimeConfig();
const apiBase = config.public.apiBase;
const ownerCookie = useCookie('ai_admin_owner');
const currentUserId = ownerCookie.value || 'dev';

// Templates State
const templates = ref<any[]>([]);

const skinTones = ['#F5D0C1', '#F2D3B1', '#E8C19D', '#D4A373', '#5C382A', '#3D2B1F'];
const hairColors = [
  { name: 'Black', hex: '#1A1A1A' },
  { name: 'Dark Brown', hex: '#4B3621' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Blonde', hex: '#D2B48C' },
  { name: 'Ash Blonde', hex: '#B2BEB5' },
  { name: 'Red', hex: '#8B0000' }
];

const selectedTemplateId = ref('');
const isSaving = ref(false);
const isGenerating = ref(false);
const isSaved = ref(false);
const savedMuseId = ref('');

// Validation & Error Modal State
const showErrorModal = ref(false);
const errorMessage = ref('');

// Hair Style Data
const hairGender = ref<'female' | 'male'>('female');
const hairStyles = [
  // Female Styles
  { id: 'Long_Straight', name: '롱 스트레이트', gender: 'female', image: 'female_long_straight_v2_1775724801873.png' },
  { id: 'Bob_Cut', name: '보브 컷', gender: 'female', image: 'female_bob_v2_1775724874285.png' },
  { id: 'Wavy_Perm', name: '웨이브 펌', gender: 'female', image: 'female_wavy_v2_1775724908047.png' },
  { id: 'Pony_Tail', name: '포니테일', gender: 'female', image: 'hair_styles_preview_1_1775724671081.png' },
  { id: 'Pixie_Cut', name: '픽시 컷', gender: 'female', image: 'hair_styles_preview_1_1775724671081.png' },
  // Male Styles
  { id: 'Two_Block', name: '투블럭', gender: 'male', image: 'male_twoblock_v2_1775724921463.png' },
  { id: 'Dandy_Cut', name: '댄디 컷', gender: 'male', image: 'hair_styles_preview_2_1775724766429.png' },
  { id: 'Pompadour', name: '포마드', gender: 'male', image: 'hair_styles_preview_2_1775724766429.png' },
  { id: 'Buzz_Cut', name: '크롭 컷', gender: 'male', image: 'hair_styles_preview_2_1775724766429.png' },
  { id: 'Man_Bun', name: '맨번 (긴머리)', gender: 'male', image: 'hair_styles_preview_2_1775724766429.png' }
];

const filteredHairStyles = computed(() => {
  return hairStyles.filter(h => h.gender === currentMuse.gender);
});

const getHairImage = (hair: any) => {
  // public/hair 폴더로 옮겨진 이미지들을 참조합니다.
  return `/hair/${hair.image}`;
};

const currentMuse = reactive({
  name: '',
  gender: 'female',
  heritage: 'korean',
  skin_tone: '#F2D3B1',
  hair_style: 'Long_Straight',
  hair_color: '#1A1A1A',
  concept: 'contemporary',
  makeup_shadow: 'matte',
  makeup_lip: 'tint',
  personal_color: 'spring',
  gaze: 'front',
  pose: 'sitting',
  expression: 'chic',
  visual_vibe: 'pure',
  age_group: '20',
  selected_model: 'nano-banana-v2', // 기본 모델 설정
  selected_quality: '1k',        // 기본 화질 설정
  prompt: ''
});

const modelOptions = [
  { label: 'Nano Banana 2', value: 'nano_banana_2' },
  { label: 'Nano Banana', value: 'nano_banana' },
  { label: 'Nano Banana 2.1 (Turbo)', value: 'nano_banana_2_1' }
];

const qualityOptions = [
  { label: '1K Standard', value: '1k' },
  { label: '2K High', value: '2k' },
  { label: '4K Ultra', value: '4k' }
];

const personalColorPalettes = {
  spring: { name: '봄 웜 (Spring)', colors: ['#FFB7B2', '#FFDAC1', '#FFFFD1', '#E2F0CB', '#B5EAD7'] },
  summer: { name: '여름 쿨 (Summer)', colors: ['#C5B4E3', '#B4CFEC', '#AFEEEE', '#E6E6FA', '#F0F8FF'] },
  autumn: { name: '가을 웜 (Autumn)', colors: ['#D2B48C', '#BC8F8F', '#8B4513', '#556B2F', '#B8860B'] },
  winter: { name: '겨울 쿨 (Winter)', colors: ['#191970', '#C0C0C0', '#800080', '#000000', '#FF00FF'] }
};

const currentPreviewImage = ref('');

// Fine-tuning state
const fineTuneActive = ref(true); // 기본 활성화 제안
const expandedFTCategory = ref<string | null>('identity');
const fineTuneValues = reactive<Record<string, any>>({
  // Face Detail
  eye_width: 0, eye_height: 0, eye_angle: 0, eye_aegyo: 0, eye_eyelid: 0, eye_depth: 0, eye_iris: 0,
  nose_bridge: 0, nose_tip_height: 0, nose_tip_sharp: 0, nose_width: 0,
  lip_volume: 0, mouth_width: 0, mouth_corner: 0, jaw_sharp: 0, face_width: 0,
  // Skin Detail
  skin_brightness: 0, skin_glow: 0, skin_coverage: 0, skin_pore: 0,
  makeup_intensity: -100,
  // Hair Detail
  hair_volume: 0, hair_shine: 0, hair_baby: 0,
  // Body Detail
  head_size: 0, neck_length: 0, shoulder_angle: 0, arm_length: 0, leg_length: 0, waist_height: 0, wrist_ankle_thickness: 0
});

const fineTuneConfig = {
  identity: {
    name: '1. 모델 정체성',
    items: [
      { key: 'age_group', label: '연령대 (Age Group)', type: 'chip', options: [
        { label: '20대', value: '20' },
        { label: '30대', value: '30' },
        { label: '40대', value: '40' },
        { label: '50대', value: '50' },
        { label: '60대', value: '60' }
      ]},
      { key: 'gender', label: '성별', type: 'chip', options: [{ label: '여성', value: 'female' }, { label: '남성', value: 'male' }] },
      { key: 'concept', label: '모델 컨셉', type: 'chip', options: [
        { label: '컨템포러리', value: 'contemporary' },
        { label: '하이패션', value: 'high-fashion' },
        { label: '캐주얼', value: 'casual' },
        { label: '스트릿', value: 'street' },
        { label: '뷰티', value: 'beauty' }
      ]},
      { key: 'visual_vibe', label: '비주얼 인상 (Look)', type: 'chip', options: [
        { label: '청순한상', value: 'pure' },
        { label: '예쁜상', value: 'pretty' },
        { label: '귀여운상', value: 'cute' },
        { label: '섹시한상', value: 'sexy' },
        { label: '우아한상', value: 'elegant' },
        { label: '개성있는상', value: 'unique' }
      ]},
      { key: 'heritage', label: '인종 (Heritage)', type: 'chip', options: [
        // 아시아
        { label: '한국인 (Korean)', value: 'korean' },
        { label: '일본인 (Japanese)', value: 'japanese' },
        { label: '중국인 (Chinese)', value: 'chinese' },
        { label: '태국/베트남 (SE Asian)', value: 'se_asian' },
        { label: '인도인 (Indian)', value: 'indian' },
        // 유럽
        { label: '프랑스 (French Chic)', value: 'french' },
        { label: '이탈리아 (Mediterranean)', value: 'italian' },
        { label: '영국 (British Classic)', value: 'british' },
        { label: '북유럽 (Nordic)', value: 'nordic' },
        { label: '동유럽 (Slavic)', value: 'slavic' },
        // 미주
        { label: '미국 (Caucasian)', value: 'us_white' },
        { label: '미국 (Black/African)', value: 'us_black' },
        { label: '브라질 (Latin/Mixed)', value: 'brazilian' },
        { label: '멕시코 (Latino)', value: 'mexican' },
        // 기타
        { label: '중동 (Middle Eastern)', value: 'middle_east' }
      ]}
    ]
  },
  face: {
    name: '2. 얼굴 세부 조절',
    groups: [
      {
        name: '눈 (Eyes)',
        options: [
          { key: 'eye_width', label: '가로 길이', type: 'slider', minLabel: '짧고 둥근 눈', maxLabel: '길고 날카로운 눈' },
          { key: 'eye_height', label: '세로 폭', type: 'slider', minLabel: '감긴 듯한 눈', maxLabel: '크고 동그란 눈' },
          { key: 'eye_angle', label: '눈꼬리 각도', type: 'slider', minLabel: '처진 눈매', maxLabel: '올라간 눈매' },
          { key: 'eye_aegyo', label: '애교살 볼륨', type: 'slider', minLabel: '밋밋한 눈 밑', maxLabel: '도톰한 애교살' },
          { key: 'eye_eyelid', label: '눈꺼풀 두께', type: 'slider', minLabel: '홑꺼풀/속쌍', maxLabel: '진한 아웃라인' },
          { key: 'eye_depth', label: '눈 깊이', type: 'slider', minLabel: '돌출형', maxLabel: '깊이 있는 눈매' },
          { key: 'eye_iris', label: '홍채 크기', type: 'slider', minLabel: '자연스러운 크기', maxLabel: '큰 홍채' }
        ]
      },
      {
        name: '코 (Nose)',
        options: [
          { key: 'nose_bridge', label: '콧대 높이', type: 'slider', minLabel: '낮은 콧대', maxLabel: '높은 콧대' },
          { key: 'nose_tip_height', label: '코끝 높이', type: 'slider', minLabel: '둥근 코끝', maxLabel: '오뚝한 코끝' },
          { key: 'nose_tip_sharp', label: '코끝 뭉툭함', type: 'slider', minLabel: '뭉툭한 형태', maxLabel: '날카로운 형태' },
          { key: 'nose_width', label: '콧망울 너비', type: 'slider', minLabel: '좁은 콧망울', maxLabel: '넓은 콧망울' }
        ]
      },
      {
        name: '입 & 턱 (Mouth & Jaw)',
        options: [
          { key: 'lip_volume', label: '입술 볼륨', type: 'slider', minLabel: '얇은 입술', maxLabel: '도톰한 오버립' },
          { key: 'mouth_width', label: '입 너비', type: 'slider', minLabel: '작은 입', maxLabel: '시원한 입매' },
          { key: 'mouth_corner', label: '입꼬리 각도', type: 'slider', minLabel: '처진 입꼬리', maxLabel: '웃는 입매' },
          { key: 'jaw_sharp', label: '턱선 날카로움', type: 'slider', minLabel: '부드러운 턱선', maxLabel: '날카로운 턱선' },
          { key: 'face_width', label: '얼굴 가로 폭', type: 'slider', minLabel: '슬림한 얼굴', maxLabel: '건강한 골격' }
        ]
      }
    ]
  },
  skin: {
    name: '3. 피부 질감 및 메이크업',
    groups: [
      {
        name: '피부 질감',
        options: [
          { key: 'skin_brightness', label: '피부 톤 밝기', type: 'slider', minLabel: '차분한 톤', maxLabel: '화사한 톤' },
          { key: 'skin_glow', label: '물광/매트', type: 'slider', minLabel: '매트한 질감', maxLabel: '광채 피부' },
          { key: 'skin_coverage', label: '잡티 은닉', type: 'slider', minLabel: '자연스러움', maxLabel: '완벽한 커버' },
          { key: 'skin_pore', label: '모공 디테일', type: 'slider', minLabel: '매끄러움', maxLabel: '모공 질감' },
          { key: 'makeup_intensity', label: '메이크업 강도', type: 'slider', minLabel: '연하고 자연스러움', maxLabel: '진하고 화려함' }
        ]
      }
    ],
    items: [
      { key: 'makeup_shadow', label: '아이섀도우 질감', type: 'chip', options: [{ label: '매트', value: 'matte' }, { label: '쉬머', value: 'shimmer' }, { label: '글리터', value: 'glitter' }] },
      { key: 'makeup_lip', label: '립스틱 제형', type: 'chip', options: [{ label: '틴트', value: 'tint' }, { label: '매트', value: 'matte' }, { label: '글로시', value: 'glossy' }] },
      { key: 'personal_color', label: '퍼스널 컬러 팔레트', type: 'chip', options: [
        { label: '봄 웜', value: 'spring' },
        { label: '여름 쿨', value: 'summer' },
        { label: '가을 웜', value: 'autumn' },
        { label: '겨울 쿨', value: 'winter' }
      ]}
    ]
  },
  hair: {
    name: '4. 헤어 스타일링',
    groups: [
      {
        name: '헤어 디테일',
        options: [
          { key: 'hair_volume', label: '머리 숱', type: 'slider', minLabel: '가벼운 숱', maxLabel: '풍성한 볼륨' },
          { key: 'hair_shine', label: '헤어 윤기', type: 'slider', minLabel: '푸석한 머릿결', maxLabel: '윤기 나는 머릿결' },
          { key: 'hair_baby', label: '잔머리 양', type: 'slider', minLabel: '깔끔한 정리', maxLabel: '자연스러운 잔머리' }
        ]
      }
    ],
    items: [
      { key: 'hair_style_select', label: '헤어 스타일 선택', type: 'hair_grid' },
      { key: 'hair_color_select', label: '헤어 컬러 선택', type: 'hair_color' }
    ]
  },
  body: {
    name: '5. 모델 체형 및 비율',
    options: [
      { key: 'head_size', label: '머리 크기', type: 'slider', minLabel: '자연스러움', maxLabel: '작은 머리' },
      { key: 'neck_length', label: '목 길이', type: 'slider', minLabel: '짧고 건강함', maxLabel: '길고 우아함' },
      { key: 'shoulder_angle', label: '어깨 각도', type: 'slider', minLabel: '둥근 어깨', maxLabel: '직각 어깨' },
      { key: 'arm_length', label: '팔 길이', type: 'slider', minLabel: '표준', maxLabel: '긴 팔' },
      { key: 'leg_length', label: '다리 길이', type: 'slider', minLabel: '표준', maxLabel: '롱다리' },
      { key: 'waist_height', label: '허리 위치', type: 'slider', minLabel: '표준', maxLabel: '하이웨스트' },
      { key: 'wrist_ankle_thickness', label: '발목/손목 굵기', type: 'slider', minLabel: '건강함', maxLabel: '가녀림' }
    ]
  },
  directing: {
    name: '6. 연출 및 포징',
    items: [
      { key: 'gaze', label: '시선 처리', type: 'chip', options: [{ label: '정면', value: 'front' }, { label: '45도', value: 'side' }, { label: '자연스러움', value: 'natural' }] },
      { key: 'expression', label: '표정', type: 'chip', options: [
        { label: '시크', value: 'chic' },
        { label: '도도', value: 'haughty' },
        { label: '웃음', value: 'smiling' },
        { label: '섹시', value: 'sexy' }
      ]}
    ]
  }
};

const categoryRefs = reactive<Record<string, any>>({});
const sidebarRef = ref<HTMLElement | null>(null);

const toggleFTCategory = (id: string) => {
  if (expandedFTCategory.value === id) {
    expandedFTCategory.value = null;
  } else {
    expandedFTCategory.value = id;
    
    // 펼쳐질 때 해당 헤더로 정밀 스크롤 이동
    nextTick(() => {
      const el = categoryRefs[id];
      const container = sidebarRef.value;
      
      if (el && container) {
        // [개선] 레이아웃 시프트(이전 항목 축소)에 영향을 받지 않기 위해
        // 현재 항목의 '순서'를 기반으로 고정된 헤더 높이를 계산하여 스크롤합니다.
        const allCategories = Object.keys(fineTuneConfig);
        const index = allCategories.indexOf(id);
        
        // 각 카테고리 헤더 높이(약 55px) + 간격(8px)을 고려한 고정 위치 계산
        // 56px는 헤더(1rem 패딩*2 + 0.9rem 텍스트 + 테두리)의 근사치입니다.
        const headerEstimatedHeight = 56; 
        const gap = 8; // 0.5rem gap
        
        // 상단에 위치한 '뮤즈 이름' 필드 등의 고정 영역 높이(약 120px)를 보정합니다.
        const topFixedAreaHeight = 110; 
        
        const targetTop = topFixedAreaHeight + (index * (headerEstimatedHeight + gap)) - 20;
        
        container.scrollTo({
          top: targetTop,
          behavior: 'smooth'
        });
      }
    });
  }
};

const handleFTChange = () => {
    // Trigger preview simulation
};

const fetchTemplates = async () => {
  try {
    const res = await fetch(`${apiBase}/api/muse/templates`);
    if (res.ok) {
      templates.value = await res.json();
      // 초기 자동 선택 로직 제거
    }
  } catch (e) {
    console.error('Failed to fetch templates:', e);
  }
};

const fetchMuseDetail = async (id: string) => {
  try {
    const res = await fetch(`${apiBase}/api/muse/muses?brandId=${currentUserId}`);
    if (res.ok) {
      const data = await res.json();
      const found = data.find((m: any) => m.muse_id === id);
      if (found) {
        // Basic Info mapping
        Object.assign(currentMuse, found.meta_options || {});
        currentMuse.name = found.name;
        
        // Image mapping
        currentPreviewImage.value = found.image_url;
        
        // FineTune mapping
        if (found.fineTuneOptions) {
          Object.assign(fineTuneValues, found.fineTuneOptions);
        }
        
        // Status mapping
        isSaved.value = true;
        savedMuseId.value = id;
      }
    }
  } catch (e) {
    console.error('Fetch detail error:', e);
  }
};

onMounted(() => {
  fetchTemplates();
  
  const id = route.query.id as string;
  if (id) {
    fetchMuseDetail(id);
  }
});

const selectTemplate = (tpl: any) => {
  if (selectedTemplateId.value === tpl.template_id) {
    // 이미 선택된 것을 다시 클릭하면 해제
    selectedTemplateId.value = '';
    currentPreviewImage.value = '';
    // 필요 시 여기서 currentMuse를 초기화할 수 있지만, 
    // 기존 설정값을 유지하는 편이 사용자 경험상 나을 수 있어 ID와 이미지만 비웁니다.
  } else {
    // 신규 선택
    selectedTemplateId.value = tpl.template_id;
    Object.assign(currentMuse, JSON.parse(JSON.stringify(tpl.options)));
    currentPreviewImage.value = tpl.image;
  }
};

const resetToTemplate = () => {
  const tpl = templates.find(t => t.template_id === selectedTemplateId.value);
  if (tpl) selectTemplate(tpl);
};

// 옵션 변경 시 저장 상태 초기화 (자동 생성은 하지 않음)
watch([currentMuse, fineTuneValues], () => {
  isSaved.value = false;
}, { deep: true });

const pollingStatusText = ref('요청 준비 중...');

const showValidationError = (msg: string, targetId?: string) => {
  errorMessage.value = msg;
  showErrorModal.value = true;
  
  if (targetId) {
    nextTick(() => {
      const el = document.getElementById(targetId);
      const container = sidebarRef.value;
      if (el && container) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }
};

const saveMuse = async () => {
  if (!currentMuse.name) {
    showValidationError('뮤즈의 이름을 입력해 주세요.', 'muse-name-field');
    return;
  }
  
  isSaving.value = true;
  pollingStatusText.value = 'AI 엔진에 생성 요청을 보내는 중...';
  
  try {
    const res = await fetch(`${apiBase}/api/muse/muses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand_id: currentUserId,
        name: currentMuse.name,
        meta_options: currentMuse,
        fine_tune_options: fineTuneValues,
        prompt: `가상 뮤즈 생성: ${currentMuse.name}`,
        detail_prompt: currentMuse.prompt,
        selected_model: currentMuse.selected_model,
        selected_quality: currentMuse.selected_quality
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      const requestId = data.requestId;
      savedMuseId.value = requestId;

      // 람다로 전달된 최종 프롬프트를 콘솔에 출력
      console.log('--- [AI 엔진 전달 최종 프롬프트] ---');
      console.log(data.finalPrompt);
      console.log('------------------------------------');
      
      // Polling 작업 시작
      pollGenerationStatus(requestId);
    } else {
      isSaving.value = false;
      showValidationError('생성 요청에 실패했습니다.');
    }
  } catch (e) {
    console.error('Save failed:', e);
    isSaving.value = false;
    showValidationError('서버 통신 중 오류가 발생했습니다.');
  }
};

const pollGenerationStatus = async (requestId: string) => {
  const pollInterval = setInterval(async () => {
    try {
      const res = await fetch(`${apiBase}/api/muse/jobs/${requestId}/status`);
      if (res.ok) {
        const data = await res.json();
        const status = data.status;
        
        if (status === 'DONE' || status === 'SUCCESS') {
          clearInterval(pollInterval);
          isSaving.value = false;
          isSaved.value = true;
          if (data.resultUrl) {
            currentPreviewImage.value = data.resultUrl;
          }
          // 성공 알림도 모달로 전환
          showValidationError('가상 뮤즈 생성이 완료되었습니다!'); 
        } else if (status === 'ERROR' || status === 'FAILED') {
          clearInterval(pollInterval);
          isSaving.value = false;
          showValidationError(`생성 중 오류가 발생했습니다: ${data.message || '알 수 없는 오류'}`);
        } else {
          // PROCESSING 상태 유지
          pollingStatusText.value = '이미지 렌더링 및 디테일링 작업 중...';
        }
      }
    } catch (e) {
      console.error('Polling failed:', e);
    }
  }, 2000); // 2초 간격 폴링
};

const isCustomHairColor = computed(() => {
  return !hairColors.some(c => c.hex.toLowerCase() === currentMuse.hair_color.toLowerCase());
});

const isDarkColor = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
};

const selectMuseForFitting = () => {
  if (!savedMuseId.value) return;
  router.push({
    path: '/studio/upload',
    query: { selectedMuse: savedMuseId.value }
  });
};
</script>

<style scoped>
.muse-create-page { display: flex; flex-direction: column; gap: 1rem; height: calc(100vh - 120px); }

.header-section { display: flex; justify-content: space-between; align-items: center; }
.title-area { display: flex; align-items: center; gap: 1.5rem; }
.title-area h2 { font-size: 1.5rem; font-weight: 700; margin: 0; }

.studio-layout { display: grid; grid-template-columns: 260px 1fr 320px; gap: 1.5rem; flex: 1; min-height: 0; }

.section-title { font-size: 0.85rem; font-weight: 700; color: var(--color-primary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; }

/* Sidebar Left */
.sidebar-left { padding: 1.25rem; overflow-y: auto; }
.template-list { display: flex; flex-direction: column; gap: 1rem; }
.template-card { cursor: pointer; border-radius: 12px; overflow: hidden; border: 2px solid transparent; transition: all 0.2s; background: var(--color-bg-alt); }
.template-card:hover { transform: scale(1.02); }
.template-card.active { border-color: var(--color-primary); box-shadow: 0 0 0 4px rgba(var(--color-primary-rgb), 0.1); }
.tpl-thumb-wrapper { aspect-ratio: 1/1; overflow: hidden; background: #000; }
.tpl-thumb { width: 100%; height: 100%; object-fit: contain; }
.tpl-name { display: block; padding: 0.75rem; font-size: 0.9rem; font-weight: 600; text-align: center; }

/* Preview Center */
.preview-center { display: flex; flex-direction: column; gap: 1.5rem; min-height: 0; }
.preview-card { flex: 1; display: flex; flex-direction: column; padding: 1.5rem; position: relative; overflow: hidden; min-height: 0; border-radius: 20px; }
.preview-status { position: absolute; top: 2.5rem; left: 2.5rem; background: rgba(0,0,0,0.6); color: white; padding: 6px 14px; border-radius: 24px; font-size: 0.75rem; display: flex; align-items: center; gap: 0.6rem; backdrop-filter: blur(8px); z-index: 10; border: 1px solid rgba(255,255,255,0.1); }
.status-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; }

.preview-image-container { flex: 1; background: #000; display: flex; align-items: center; justify-content: center; border-radius: 12px; position: relative; overflow: hidden; min-height: 0; }
.main-preview { max-width: 100%; max-height: 100%; object-fit: contain; }

.preview-footer { padding: 1rem 0 0; text-align: center; }
.muse-desc { font-style: italic; color: var(--color-text-muted); font-size: 0.85rem; opacity: 0.7; }

/* Center Prompt Area */
.center-prompt-area {
  padding: 1rem 1rem;
  border-radius: 24px;
  background: rgba(var(--color-primary-rgb), 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--color-primary-rgb), 0.15);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.prompt-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.prompt-input-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.center-textarea {
  width: 100%;
  background: rgb(221 217 217 / 40%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  color: var(--color-text-main);
  padding: 1rem;
  font-size: 1.05rem;
  outline: none;
  resize: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  line-height: 1.6;
  font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
  font-size: small;
}

.center-textarea:focus {
  border-color: var(--color-primary);
  background: rgb(221 217 217 / 40%);
  box-shadow: 0 0 25px rgba(var(--color-primary-rgb), 0.15);
}

.prompt-hints {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0.75rem;
  opacity: 0.3;
  font-size: 0.75rem;
  font-weight: 500;
}

.sidebar-right { padding: 1.25rem; overflow-y: auto; background: rgba(255,255,255,0.02); }
.control-group { margin-bottom: 20px; display: flex; flex-direction: column; gap: 0.75rem; align-items: flex-start; }
.control-group label { font-size: 0.85rem; font-weight: 700; color: var(--color-text-main); opacity: 0.8; margin-bottom: 2px; }

.custom-select { width: 100%; background: var(--color-bg-alt); color: var(--color-text-main); border: 1px solid var(--color-border); border-radius: 8px; padding: 0 12px; height: 44px; font-size: 0.95rem; outline: none; cursor: pointer; transition: all 0.2s; }
.custom-select:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1); }

.skin-tone-picker { display: flex; flex-wrap: wrap; gap: 12px; padding: 4px 0; width: 100%; }

.hair-color-presets { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }

.custom-color-trigger { position: relative; width: 32px; height: 32px; }
.hidden-color-input { position: absolute; opacity: 0; pointer-events: none; }
.color-picker-label { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  width: 32px; 
  height: 32px; 
  border-radius: 50%; 
  border: 1px solid rgba(255,255,255,0.2); 
  cursor: pointer; 
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
  background: linear-gradient(225deg, #FF3CAC 0%, #784BA0 50%, #2B86C5 100%);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}
.color-picker-label:hover { 
  transform: scale(1.15) rotate(15deg);
  box-shadow: 0 8px 25px rgba(var(--color-primary-rgb), 0.2);
  border-color: rgba(255,255,255,0.4);
}
.color-picker-label .light-icon { color: white; }

.tone-circle { 
  width: 32px; 
  height: 32px; 
  border-radius: 50%; 
  cursor: pointer; 
  border: 2px solid rgba(255,255,255,0.1); 
  transition: all 0.2s; 
  position: relative; 
}
.tone-circle.active { 
  border-color: var(--color-primary); 
  transform: scale(1.15); 
  box-shadow: 0 0 15px rgba(var(--color-primary-rgb), 0.3); 
}
.tone-circle::after { 
  content: ''; 
  position: absolute; 
  inset: -4px; 
  border-radius: 50%; 
  border: 1px solid transparent; 
  transition: all 0.2s; 
}
.tone-circle.active::after { 
  border-color: var(--color-primary); 
  opacity: 0.5; 
}

/* Hair Style Grid Custom Styles */
.label-with-gender {
  width: 100%;
  display: flex !important;
  justify-content: space-between;
  align-items: center;
}

.gender-toggle {
  display: flex;
  background: rgba(255,255,255,0.05);
  padding: 2px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.1);
}

.gender-btn {
  padding: 4px 10px;
  font-size: 0.75rem;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.gender-btn.active {
  background: var(--color-primary);
  color: white;
  font-weight: 700;
}

.hair-style-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
  margin-top: 5px;
}

.hair-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.hair-img-wrapper {
  aspect-ratio: 1/1;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  border: 2px solid transparent;
  background: #000;
}

.hair-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.8;
  transition: all 0.3s;
}

.hair-card:hover .hair-icon-img {
  transform: scale(1.1);
  opacity: 1;
}

.hair-card.active .hair-img-wrapper {
  border-color: var(--color-primary);
  box-shadow: 0 0 10px rgba(var(--color-primary-rgb), 0.3);
}

.hair-card.active .hair-icon-img {
  opacity: 1;
}

.hair-active-overlay {
  position: absolute;
  top: 6px;
  right: 6px;
  background: var(--color-primary);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

/* Error Modal Content */
.error-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.error-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(var(--color-primary-rgb), 0.1);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.error-modal-msg {
  font-size: 1.1rem;
  font-weight: 500;
  line-height: 1.6;
  color: var(--color-text-main);
  word-break: keep-all;
}

/* Transitions */
.accordion-slide-enter-active,
.accordion-slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
  max-height: 1000px;
}

.hair-name {
  font-size: 0.7rem;
  text-align: center;
  color: var(--color-text-muted);
  font-weight: 600;
}

.hair-card.active .hair-name {
  color: var(--color-primary);
}

/* New Accordion v2 Styles */
.fine-tune-accordion-v2 {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.ft-category-v2 {
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.01);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ft-category-v2.expanded {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(var(--color-primary-rgb), 0.2);
}

.category-header-v2 {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-main);
  transition: background 0.2s;
}

.category-header-v2:hover {
  background: rgba(255, 255, 255, 0.03);
}

.cat-name {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.arrow-icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.5;
}

.ft-category-v2.expanded .arrow-icon {
  transform: rotate(180deg);
  opacity: 1;
  color: var(--color-primary);
}

.category-body-v2 {
  overflow: hidden;
}

/* Accordion Transition */
.accordion-slide-enter-active,
.accordion-slide-leave-active {
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
  max-height: 1200px; /* 충분한 높이 확보 */
}

.accordion-slide-enter-from,
.accordion-slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.category-content-inner {
  padding: 0 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Item Rows & Chips */
.ft-item-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.item-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--color-text-main);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.chip-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.chip-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  box-shadow: 0 4px 10px rgba(var(--color-primary-rgb), 0.3);
}

.chip-group-v2 {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 0.5rem;
}

.chip-btn-v2 {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.chip-btn-v2:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.chip-btn-v2.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  box-shadow: 0 4px 10px rgba(var(--color-primary-rgb), 0.3);
}

/* Sub Groups (Sliders) */
.ft-sub-group {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 1rem;
}

.sub-group-title {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.sub-group-options {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* Personal Palette Special UI */
.personal-palette-preview {
  background: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.palette-colors {
  display: flex;
  gap: 8px;
}

.palette-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.palette-desc {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-style: italic;
}

/* Mini Hair Grid in Accordion */
.hair-style-grid-mini {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.hair-card-mini {
  cursor: pointer;
  transition: all 0.2s;
}

.hair-img-wrapper-mini {
  aspect-ratio: 1/1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
}

.hair-img-wrapper-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.6;
}

.hair-card-mini.active .hair-img-wrapper-mini {
  border-color: var(--color-primary);
}

.hair-card-mini.active .hair-img-wrapper-mini img {
  opacity: 1;
}

.hair-name-mini {
  display: block;
  font-size: 0.6rem;
  text-align: center;
  margin-top: 2px;
  color: var(--color-text-muted);
}

/* Hair Color area v2 */
.hair-color-area-v2 {
  padding: 0.5rem 0;
}

.tone-circle-v2 {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.2s;
}

.tone-circle-v2.active {
  transform: scale(1.2);
  border-color: white;
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
}

.custom-color-trigger-v2 {
  width: 24px;
  height: 24px;
  position: relative;
}

.color-picker-label-v2 {
  display: block;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000);
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.2);
}

.sidebar-footer-actions {
  margin-top: auto;
  padding: 0.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.generate-btn-v2, .select-muse-btn {
  width: 100%;
  height: 56px;
  border-radius: 14px;
  font-weight: 800;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 8px 20px rgba(var(--color-primary-rgb), 0.3);
  transition: all 0.3s;
}

.generate-btn-v2:hover, .select-muse-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(var(--color-primary-rgb), 0.4);
}

.select-muse-btn {
  background: #10b981;
  border-color: #10b981;
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
}

.select-muse-btn:hover {
  background: #059669;
  box-shadow: 0 12px 25px rgba(16, 185, 129, 0.4);
}

.preview-image-container {
  flex: 1;
  position: relative;
  background: #f8fafc; /* 밝은 배경색으로 변경 */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-height: 0;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.placeholder-studio-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, #ffffff 0%, #e2e8f0 100%);
  opacity: 0.6;
}

.placeholder-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
}

.icon-circle {
  width: 80px;
  height: 80px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.sparkle-icon {
  color: var(--color-primary);
  filter: drop-shadow(0 0 5px rgba(var(--color-primary-rgb), 0.3));
}

.placeholder-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1rem;
}

.placeholder-content p {
  color: #64748b;
  line-height: 1.6;
  font-size: 1rem;
  margin-bottom: 2rem;
}

.studio-status-chip {
  padding: 6px 14px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #94a3b8;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.preview-loading-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: rgba(var(--color-primary-rgb), 0.1);
  z-index: 10;
}

.loading-bar {
  height: 100%;
  background: var(--color-primary);
  width: 30%;
  animation: loading-slide 1.5s infinite ease-in-out;
}

@keyframes loading-slide {
  from { left: -30%; width: 30%; }
  to { left: 100%; width: 100%; }
}

@media (max-width: 1200px) {
  .studio-layout { grid-template-columns: 200px 1fr 280px; }
}
.generation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.glass-loader {
  background: rgba(255, 255, 255, 0.05);
  padding: 3rem;
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  max-width: 500px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.loader-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(var(--color-primary-rgb), 0.1);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  margin: 0 auto 2rem;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 15px rgba(var(--color-primary-rgb), 0.3);
}

.loader-text h3 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: white;
}

.loader-text p {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}

.polling-status {
  margin-top: 1.5rem;
  font-size: 0.8rem;
  color: var(--color-primary);
  font-weight: 600;
  padding: 8px 16px;
  background: rgba(var(--color-primary-rgb), 0.1);
  border-radius: 20px;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
