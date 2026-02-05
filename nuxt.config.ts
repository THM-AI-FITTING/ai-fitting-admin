// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  telemetry: { enabled: false },
  app: {
    baseURL: '/ai-fitting-admin/', // 반드시 레포지토리 이름과 일치해야 함
    buildAssetsDir: 'assets',     // '_nuxt' 대신 'assets' 사용 (GitHub Pages의 지킬 무시 방지)
    head: {
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
  vite: {
    server: {
      proxy: {
        '/ai-fitting-admin/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/ai-fitting-admin\/api/, '/api')
        }
      }
    }
  }
})

