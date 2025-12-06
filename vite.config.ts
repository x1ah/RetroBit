import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // GitHub Pages 配置：如果是项目页面，base 应该是 '/repository-name/'
    // 如果是用户/组织页面，base 应该是 '/'
    // 可以通过环境变量 GITHUB_REPOSITORY 动态设置
    const repository = process.env.GITHUB_REPOSITORY || '';
    const base = repository 
      ? `/${repository.split('/')[1]}/` 
      : process.env.BASE_PATH || '/';
    
    return {
      base,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
