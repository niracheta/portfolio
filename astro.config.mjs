import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://portfolio.nirachetahomelab.org',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
