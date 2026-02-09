<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { 
  LayoutDashboard, 
  Key, 
  ImageIcon, 
  Settings, 
  LogOut,
  Menu,
  X,
  List,
  Search,
  Sun,
  Moon,
  Sparkles
} from 'lucide-vue-next';
import { useTheme } from '~/composables/useTheme';

const route = useRoute();
const isSidebarOpen = ref(true);
const isMobileMenuOpen = ref(false); // 모바일 전용 수동 열림 상태

const { theme, toggleTheme, updateBodyClass } = useTheme();
const authCookie = useCookie('ai_admin_key');
const ownerCookie = useCookie('ai_admin_owner');

// 쿠키가 없을 경우 '관리자'를 기본값으로 사용
const adminOwner = computed(() => ownerCookie.value || '관리자');
const avatarInitial = computed(() => adminOwner.value.charAt(0).toUpperCase());

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

// 라우트 변경 시 모바일 메뉴 닫기
watch(() => route.path, () => {
  closeMobileMenu();
});

const navigation = computed(() => [
  { name: '대시보드', href: '/', icon: LayoutDashboard, active: route.path === '/' },
  { name: 'API 키 관리', href: '/api-keys', icon: Key, active: route.path === '/api-keys' },
  { name: 'AI 가상 피팅 목록', href: '/jobs', icon: List, active: route.path.startsWith('/jobs') || route.path.startsWith('/images') },
  // { name: '실행 결과 조회', href: '/images', icon: ImageIcon, active: route.path.startsWith('/images') }, // 숨김 처리
]);

const handleLogout = () => {
  if (!confirm('로그아웃 하시겠습니까?')) return;
  
  // 로그아웃 시 세션 쿠키 삭제
  const authCookie = useCookie('ai_admin_key');
  const ownerCookie = useCookie('ai_admin_owner');
  authCookie.value = null;
  ownerCookie.value = null;
  
  // 로그아웃 시 테마를 라이트 모드로 리셋 (사용자 요청: 로그인창은 라이트모드 기본)
  theme.value = 'light';
  updateBodyClass(); // 즉시 반영
  
  useRouter().push('/login');
};
</script>

<template>
  <div class="app-layout">
    <!-- Mobile Sidebar Backdrop -->
    <Transition name="fade">
      <div v-if="isMobileMenuOpen" class="sidebar-backdrop" @click="closeMobileMenu"></div>
    </Transition>

    <!-- Sidebar -->
    <aside :class="['sidebar', { 'sidebar-closed': !isSidebarOpen, 'mobile-open': isMobileMenuOpen }]">
      <div class="sidebar-header">
        <div class="logo-area" v-if="isSidebarOpen">
          <!-- <div class="logo-icon">
            <Sparkles :size="16" />
          </div> -->
          <span class="logo-text"><span class="gradient-text">AI Fitting</span> Admin</span>
        </div>
        <button class="toggle-btn" @click="toggleSidebar">
          <component :is="isSidebarOpen ? X : Menu" :size="20" />
        </button>
      </div>

      <nav class="sidebar-nav">
        <NuxtLink 
          v-for="item in navigation" 
          :key="item.name" 
          :to="item.href"
          :class="['nav-item', { 'active': item.active }]"
        >
          <component :is="item.icon" :size="20" />
          <span v-if="isSidebarOpen" class="nav-text">{{ item.name }}</span>
        </NuxtLink>
      </nav>

      <div class="sidebar-footer">
        <div class="footer-info" v-if="isSidebarOpen">
          <p>© 2026 AI-Fitting</p>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content" :class="{ 'with-sidebar-closed': !isSidebarOpen }">
      <header class="top-header">
        <div class="header-left">
          <button class="mobile-menu-btn" @click="toggleMobileMenu">
            <Menu :size="24" />
          </button>
          <h1 class="page-title">{{ route.meta.title || '대시보드' }}</h1>
        </div>

        <div class="header-actions">
          <button class="theme-toggle" @click="toggleTheme" :title="theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'">
            {{ theme === 'dark' ? '☀️' : '🌙' }}
          </button>
          
          <div class="header-divider hidden-mobile"></div>

          <div class="user-profile">
            <div class="avatar">{{ avatarInitial }}</div>
            <span class="username hidden-mobile">{{ adminOwner }}</span>
          </div>

          <button class="header-logout-btn" @click="handleLogout" title="로그아웃">
            <LogOut :size="18" />
            <span class="hidden-mobile">로그아웃</span>
          </button>
        </div>
      </header>
      
      <div class="page-container">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Scoped styles for refinement only, core structure is in main.css */
.logo-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: var(--gradient-primary);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
}

.logo-text {
  font-weight: 800;
  font-size: 1.15rem;
  letter-spacing: -0.02em;
  white-space: nowrap;
  color: var(--color-text-main);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-title {
  font-size: 1.25rem; /* PC에서 약간 축소 (기본값 대응) */
  font-weight: 700;
}

.mobile-menu-btn {
  display: none;
  color: var(--color-text-main);
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
}

.toggle-btn {
  color: var(--color-text-muted);
  padding: 0.5rem;
  border-radius: var(--radius-md);
}

/* Responsive Styles */
@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: -260px;
    height: 100vh;
    z-index: 1000;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar.mobile-open {
    transform: translateX(260px);
  }

  .sidebar-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 999;
  }

  .main-content {
    margin-left: 0 !important;
    width: 100% !important;
  }

  .mobile-menu-btn {
    display: flex;
  }

  .hidden-mobile {
    display: none !important;
  }

  .page-title {
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .header-actions {
    gap: 0.25rem;
  }

  .header-logout-btn {
    padding: 0.5rem;
  }
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.toggle-btn:hover {
  color: var(--color-text-main);
  background: rgba(255, 255, 255, 0.05);
}

.nav-item:hover {
  color: var(--color-text-main);
  background: rgba(255, 255, 255, 0.03);
}

.nav-item.active svg {
  color: var(--color-accent);
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--color-border);
}

.logout-btn {
  width: 100%;
}


.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.theme-toggle {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-main);
  font-size: 1.2rem;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(15deg);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 32px;
  height: 32px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
}

.username {
  font-weight: 500;
  font-size: 0.9rem;
}

.header-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin: 0 0.5rem;
}

.header-logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
}

.header-logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}

.footer-info {
  padding: 0.5rem;
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  opacity: 0.7;
}
</style>
