/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.yaml?raw' {
  const content: string
  export default content
}

declare const __BUILD_SHA__: string
declare const __BUILD_AT__: string
