/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Nós Dois API. Defaults to http://localhost:8080 when unset. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
