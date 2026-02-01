// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  telemetry: { enabled: false },
  alias: {
    'mnemonist/lru-cache': 'mnemonist/lru-cache.js'
  },
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  modules: [],
  build: {
    transpile: [
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
