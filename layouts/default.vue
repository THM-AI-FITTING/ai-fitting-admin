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
  Sun,
  Moon
} from 'lucide-vue-next';
import { useTheme } from '~/composables/useTheme';

const route = useRoute();
const isSidebarOpen = ref(true);
const { theme, toggleTheme, updateBodyClass } = useTheme();

// 서버 사이드와 클라이언트 사이드에서 테마 클래스를 동기화합니다.
useHead({
  bodyAttrs: {
    class: computed(() => theme.value === 'light' ? 'light-mode' : '')
  }
});

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const navigation = computed(() => [
  { name: '대시보드', href: '/', icon: LayoutDashboard, active: route.path === '/' },
  { name: 'API 키 관리', href: '/api-keys', icon: Key, active: route.path === '/api-keys' },
  { name: 'AI 가상 피팅 목록', href: '/jobs', icon: List, active: route.path.startsWith('/jobs') || route.path.startsWith('/images') },
  // { name: '실행 결과 조회', href: '/images', icon: ImageIcon, active: route.path.startsWith('/images') }, // 숨김 처리
]);
</script>

<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside :class="['sidebar', { 'sidebar-closed': !isSidebarOpen }]">
      <div class="sidebar-header">
        <div class="logo-area" v-if="isSidebarOpen">
          <div class="logo-icon">AI</div>
          <span class="logo-text">Fitting Admin</span>
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
        <button class="nav-item logout-btn">
          <LogOut :size="20" />
          <span v-if="isSidebarOpen" class="nav-text">로그아웃</span>
        </button>
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
          <div class="user-profile">
            <div class="avatar">A</div>
            <span class="username">관리자</span>
          </div>
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
  width: 32px;
  height: 32px;
  background: var(--gradient-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 0.8rem;
}

.logo-text {
  font-weight: 700;
  font-size: 1.1rem;
  white-space: nowrap;
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
  gap: 1.5rem;
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
</style>
