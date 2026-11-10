/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly INCLUDE_DRAFTS?: string;
  readonly PUBLIC_DIGEST_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
