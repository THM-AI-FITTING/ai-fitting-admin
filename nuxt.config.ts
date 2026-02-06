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
        // 보안 강화를 위해 CSP 정책을 헤더 최상단에 배치
        { 'http-equiv': 'Content-Security-Policy', content: 'upgrade-insecure-requests' },
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      script: [
        {
          // 리소스 로드 전 HTTPS 전환을 위해 최상단에서 실행
          innerHTML: `if(window.location.protocol==='http:'&&window.location.hostname!=='localhost')window.location.href=window.location.href.replace('http:','https:');`,
          type: 'text/javascript'
        }
      ],
      link: [
        // rel="icon" 설정을 통해 탭 아이콘 지정
        { rel: 'icon', type: 'image/x-icon', href: 'favicon.ico' }
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
