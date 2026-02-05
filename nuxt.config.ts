// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  telemetry: { enabled: false },
  app: {
    baseURL: '/ai-fitting-admin/', // 반드시 레포지토리 이름과 일치해야 함
    buildAssetsDir: 'assets',     // '_nuxt' 대신 'assets' 사용 (GitHub Pages의 지킬 무시 방지)
    head: {
      title: 'AI Fitting Admin',
      link: [
        // rel="icon" 설정을 통해 탭 아이콘 지정
        // baseURL이 적용되므로 '/favicon.ico'로 작성해도 실제로는 '/ai-fitting-admin/favicon.ico'를 참조합니다.
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
      style: [
        {
          innerHTML: `
            .app-layout {
              display: flex;
              min-height: 100vh;
            }
            .sidebar {
              width: 260px;
              flex-shrink: 0;
              transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .sidebar-closed {
              width: 70px;
            }
            .main-content {
              flex: 1;
              display: flex;
              flex-direction: column;
              min-width: 0;
            }
            .top-header {
              height: 64px;
              position: sticky;
              top: 0;
              z-index: 40;
            }
          `,
        }
      ]
    }
  },
  ssr: false, // 정적 호스팅이므로 클라이언트 사이드 렌더링(SPA) 모드로 설정
  alias: {
    'mnemonist/lru-cache': 'mnemonist/lru-cache.js'
  },
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  modules: [],
  build: {
    transpile: ['lucide-vue-next']
  },
  nitro: {
    routeRules: {
      '/api/**': { proxy: 'http://localhost:8080/api/**' }
    }
  }
})

