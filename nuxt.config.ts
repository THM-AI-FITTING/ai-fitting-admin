// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  telemetry: { enabled: false },
  app: {
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
  alias: {
    'mnemonist/lru-cache': 'mnemonist/lru-cache.js'
  },
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  modules: [],
  build: {
    transpile: [
      'lucide-vue-next',
      '@aws-sdk/client-dynamodb',
      '@aws-sdk/lib-dynamodb',
      '@aws-sdk/client-s3',
      '@aws-sdk/s3-request-presigner',
      '@aws-sdk/util-dynamodb',
      '@aws-sdk/util-endpoints',
      '@aws-sdk/endpoint-cache',
      '@smithy/middleware-serde',
      '@smithy/protocol-http',
      '@smithy/types',
      '@smithy/util-base64',
      '@smithy/util-body-length-browser',
      '@smithy/util-middleware',
      '@smithy/util-stream',
      '@smithy/util-utf8',
      '@smithy/uuid',
      '@smithy/smithy-client',
      '@smithy/core',
      '@smithy/node-config-provider',
      '@smithy/util-endpoints',
      'mnemonist',
      'obliterator',
      'lru-cache'
    ]
  },
  nitro: {
    routeRules: {
      '/api/**': { proxy: 'http://localhost:8080/api/**' }
    },
    externals: {
      inline: [
        '@aws-sdk/client-dynamodb',
        '@aws-sdk/lib-dynamodb',
        '@aws-sdk/client-s3',
        '@aws-sdk/s3-request-presigner',
        '@aws-sdk/util-dynamodb',
        '@aws-sdk/util-endpoints',
        '@aws-sdk/endpoint-cache',
        '@smithy/middleware-serde',
        '@smithy/protocol-http',
        '@smithy/types',
        '@smithy/util-base64',
        '@smithy/util-body-length-browser',
        '@smithy/util-middleware',
        '@smithy/util-stream',
        '@smithy/util-utf8',
        '@smithy/uuid',
        '@smithy/smithy-client',
        '@smithy/core',
        '@smithy/node-config-provider',
        '@smithy/util-endpoints',
        'mnemonist',
        'obliterator',
        'lru-cache'
      ]
    }
  },
  runtimeConfig: {
    awsRegion: '',
    awsAccessKeyId: '',
    awsSecretAccessKey: '',
    cacheTtlSec: '60',
    sqsUrl: '',
    s3Bucket: '',
    aiFittingJobTable: '',
    aiFittingApiKeyTable: ''
  }
})
