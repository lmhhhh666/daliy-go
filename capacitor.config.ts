import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor 配置：后续可执行 npm run cap:add:android / cap:add:ios 打包为原生 App。
 * webDir 指向 Vite 构建产物目录。
 */
const config: CapacitorConfig = {
  appId: 'com.workbuddy.scheduleplan',
  appName: '个人课表计划',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {},
};

export default config;
