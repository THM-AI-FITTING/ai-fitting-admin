// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  telemetry: { enabled: false },
  app: {
    baseURL: '/ai-fitting-admin/', // 반드시 레포지토리 이름과 일치해야 함
    buildAssetsDir: 'assets',     // '_nuxt' 대신 'assets' 사용 (GitHub Pages의 지킬 무시 방지)
    head: {
      title: 'AI Fitting Admin',
      meta: [
        { 'http-equiv': 'Content-Security-Policy', content: 'upgrade-insecure-requests' }
      ],
      link: [
        // rel="icon" 설정을 통해 탭 아이콘 지정
        // baseURL이 적용되므로 '/favicon.ico'로 작성해도 실제로는 '/ai-fitting-admin/favicon.ico'를 참조합니다.
        { rel: 'icon', type: 'image/x-icon', href: 'favicon.ico' }
      ],
      script: [
        {
          innerHTML: `
            if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
              window.location.href = window.location.href.replace('http:', 'https:');
            }
          `.replace(/\s+/g, ' '),
          type: 'text/javascript'
        }
      ],
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
  runtimeConfig: {
    public: {
      // GitHub Pages 배포 시 환경 변수가 없을 경우를 대비해 HTTPS 도메인을 기본값으로 설정
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://new-ai-fitting-api-admin.duckdns.org'
    }
  },
  vite: {
    server: {
      proxy: {
        // 1. /api 경로를 그대로 전달
        '/api': {
          target: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080',
          changeOrigin: true
        },
        // 2. /ai-fitting-admin/api 로 들어올 경우 /api로 rewrite 하여 전달
        '/ai-fitting-admin/api': {
          target: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ai-fitting-admin\/api/, '/api')
        }
      }
    }
  }
})

