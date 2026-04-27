/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TOSS_CLIENT_KEY: string
  // 다른 환경 변수들을 여기에 추가하세요...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
