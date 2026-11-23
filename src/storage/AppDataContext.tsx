import { createContext, useContext, useSyncExternalStore, type ReactElement, type ReactNode } from 'react';
import type { AppData } from '../types';
import { getAppData, subscribe } from './db';

const AppDataContext = createContext<AppData | null>(null);

/** 全局数据 Provider：订阅存储层变化并触发 React 重渲染 */
export function AppDataProvider({ children }: { children: ReactNode }): ReactElement {
  const data = useSyncExternalStore(subscribe, getAppData, getAppData);
  return <AppDataContext.Provider value={data}>{children}</AppDataContext.Provider>;
}

/** 获取全局应用数据 */
export function useAppData(): AppData {
  const data = useContext(AppDataContext);
  if (!data) {
    throw new Error('useAppData 必须在 AppDataProvider 内部使用');
  }
  return data;
}
