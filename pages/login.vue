<template>
  <div class="login-container">
    <div class="login-card animate-fade-in">
      <div class="login-header">
        <div class="logo-box">
          <Sparkles :size="32" class="logo-icon" />
        </div>
        <h1>AI Fitting Admin</h1>
        <p class="subtitle">계속하려면 API 키를 입력하세요</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="api-key">API KEY</label>
          <div class="input-wrapper">
            <Key :size="18" class="input-icon" />
            <input 
              id="api-key"
              v-model="apiKey" 
              type="password" 
              placeholder="xxxxxxxx-xxxxxxxx-xxxxxxxx-xxxxxxxx"
              :disabled="loading"
              required
            />
          </div>
        </div>

        <div v-if="error" class="error-message">
          <AlertCircle :size="16" />
          <span>{{ error }}</span>
        </div>

        <BaseButton 
          type="submit" 
          variant="primary" 
          class="login-button"
          :loading="loading"
        >
          입장하기
        </BaseButton>
      </form>

      <div class="login-footer">
        <p>© 2026 AI-Fitting. All rights reserved.</p>
      </div>
    </div>

    <!-- Theme Toggle -->
    <button class="theme-toggle-fixed" @click="toggleTheme" title="테마 전환">
      <component :is="theme === 'dark' ? Sun : Moon" :size="24" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Sparkles, Key, AlertCircle, Sun, Moon } from 'lucide-vue-next';
import BaseButton from '~/components/ui/BaseButton.vue';
import { useTheme } from '~/composables/useTheme';

definePageMeta({
  layout: false,
  middleware: []
});

const { theme, toggleTheme } = useTheme();

const apiKey = ref('');
const loading = ref(false);
const error = ref('');
const config = useRuntimeConfig();
const router = useRouter();

const handleLogin = async () => {
  if (!apiKey.value.trim()) {
    error.value = 'API 키를 입력해주세요.';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response: any = await $fetch(`${config.public.apiBase}/api/keys/verify`, {
      method: 'POST',
      body: { apiKey: apiKey.value.trim() }
    });

    if (response.valid) {
      // 7일간 쿠키 유지
      const authCookie = useCookie('ai_admin_key', { maxAge: 60 * 60 * 24 * 7, path: '/' });
      authCookie.value = apiKey.value.trim();
      
      const ownerCookie = useCookie('ai_admin_owner', { maxAge: 60 * 60 * 24 * 7, path: '/' });
      ownerCookie.value = response.owner || '관리자';
      
      router.push('/');
    } else {
      error.value = response.message || '유효하지 않은 API 키입니다.';
    }
  } catch (err) {
    console.error('Login error:', err);
    error.value = '로그인 중 오류가 발생했습니다. 서버 상태를 확인해주세요.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-bg-main);
  background-image:
    radial-gradient(circle at 10% 20%, var(--gradient-bg-1) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, var(--gradient-bg-2) 0%, transparent 40%);
  padding: 1.5rem;
  transition: background-color 0.3s ease;
  position: relative;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-bg-card);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  padding: 2.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  z-index: 10;
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.logo-box {
  width: 64px;
  height: 64px;
  background: var(--gradient-primary);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
}

.logo-icon {
  color: white;
}

h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-main);
  margin-bottom: 0.5rem;
  letter-spacing: -0.025em;
}

.subtitle {
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.05em;
  padding-left: 0.25rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: var(--color-text-muted);
}

input {
  width: 100%;
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  color: var(--color-text-main);
  font-family: inherit;
  font-size: 0.95rem;
  transition: all 0.2s;
}

input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

input::placeholder {
  color: var(--color-text-muted);
  opacity: 0.5;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 1rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.75rem;
  color: var(--color-danger);
  font-size: 0.85rem;
}

.login-footer {
  margin-top: 2.5rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.theme-toggle-fixed {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  color: var(--color-text-main);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.theme-toggle-fixed:hover {
  transform: translateY(-2px) rotate(10deg);
  background: var(--color-bg-alt);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
