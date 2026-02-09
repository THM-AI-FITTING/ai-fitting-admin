<script setup lang="ts">
import { ref, computed } from 'vue';
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
const { theme, toggleTheme, updateBodyClass } = useTheme();
const authCookie = useCookie('ai_admin_key');
const ownerCookie = useCookie('ai_admin_owner');

// 쿠키가 없을 경우 '관리자'를 기본값으로 사용
const adminOwner = computed(() => ownerCookie.value || '관리자');
const avatarInitial = computed(() => adminOwner.value.charAt(0).toUpperCase());

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

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
    <!-- Sidebar -->
    <aside :class="['sidebar', { 'sidebar-closed': !isSidebarOpen }]">
      <div class="sidebar-header">
        <div class="logo-area" v-if="isSidebarOpen">
          <div class="logo-icon">
            <Sparkles :size="16" />
          </div>
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
    <main class="main-content">
      <header class="top-header">
        <h1 class="page-title">{{ route.meta.title || '대시보드' }}</h1>
        <div class="header-actions">
          <button class="theme-toggle" @click="toggleTheme" title="테마 전환">
            <component :is="theme === 'dark' ? Sun : Moon" :size="20" />
          </button>
          
          <div class="header-divider"></div>

          <div class="user-profile">
            <div class="avatar">{{ avatarInitial }}</div>
            <span class="username">{{ adminOwner }}</span>
          </div>

          <button class="header-logout-btn" @click="handleLogout" title="로그아웃">
            <LogOut :size="18" />
            <span>로그아웃</span>
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

.toggle-btn {
  color: var(--color-text-muted);
  padding: 0.5rem;
  border-radius: var(--radius-md);
}

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

.page-title {
  font-size: 1.25rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.theme-toggle {
  color: var(--color-text-muted);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--color-border);
}

.theme-toggle:hover {
  color: var(--color-text-main);
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
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
