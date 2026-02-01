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
const { theme, toggleTheme } = useTheme();

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const navigation = computed(() => [
  { name: '대시보드', href: '/', icon: LayoutDashboard, active: route.path === '/' },
  { name: 'API 키 관리', href: '/api-keys', icon: Key, active: route.path === '/api-keys' },
  { name: 'AI 가상 피팅 목록', href: '/jobs', icon: List, active: route.path.startsWith('/jobs') },
  { name: '실행 결과 조회', href: '/images', icon: ImageIcon, active: route.path.startsWith('/images') },
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
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--color-bg-main);
  color: var(--color-text-main);
}

/* Sidebar Styles */
.sidebar {
  width: 260px;
  background: var(--color-bg-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 50;
}

.sidebar-closed {
  width: 70px;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.sidebar-closed .sidebar-header {
  padding: 0;
  justify-content: center;
}

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

.sidebar-nav {
  flex: 1;
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  color: var(--color-text-muted);
  transition: all 0.2s;
  white-space: nowrap;
  position: relative;
}

.sidebar-closed .nav-item {
  padding: 0.75rem 0;
  justify-content: center;
}

.nav-item:hover {
  color: var(--color-text-main);
  background: rgba(255, 255, 255, 0.03);
}

.nav-item.active {
  color: var(--color-nav-active);
  background: rgba(99, 102, 241, 0.1);
  border-right: 3px solid var(--color-primary);
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

/* Main Content Styles */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.top-header {
  height: 64px;
  background: var(--color-bg-header);
  backdrop-filter: var(--header-blur);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  position: sticky;
  top: 0;
  z-index: 40;
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

.page-container {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}
</style>
