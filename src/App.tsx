import { useEffect, useRef, useState, type ReactElement } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import BottomNav from './components/BottomNav';
import ReminderDialog from './components/ReminderDialog';
import { AppDataProvider, useAppData } from './storage/AppDataContext';
import theme from './theme';
import TodayPage from './pages/TodayPage';
import SchedulePage from './pages/SchedulePage';
import TodoPage from './pages/TodoPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';
import { ReminderChecker, showNotification, type ReminderEvent } from './utils/notification';
import type { TabKey } from './types';

/** 应用主体：页面切换与全局课前提醒 */
function AppContent(): ReactElement {
  const data = useAppData();
  const dataRef = useRef(data);
  dataRef.current = data;
  const [tab, setTab] = useState<TabKey>('today');
  const [reminderEvent, setReminderEvent] = useState<ReminderEvent | null>(null);

  // 提醒检查器只创建一次，通过 ref 读取最新数据，避免数据变化导致重复提醒。
  useEffect(() => {
    const checker = new ReminderChecker(
      () => ({
        courses: dataRef.current.courses,
        bell: dataRef.current.bellSchedule,
        settings: dataRef.current.settings,
      }),
      (event) => {
        const settings = dataRef.current.settings;
        const body = `${event.course.name} ${event.startTime} 开始 · ${event.course.location || '地点未填写'}`;
        if (settings.notificationsEnabled) {
          showNotification('即将上课', body);
        }
        if (settings.dialogReminderEnabled) {
          setReminderEvent(event);
        }
      },
    );
    checker.start();
    return () => checker.stop();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <main className="safe-bottom">
        {tab === 'today' ? <TodayPage /> : null}
        {tab === 'schedule' ? <SchedulePage /> : null}
        {tab === 'todos' ? <TodoPage /> : null}
        {tab === 'stats' ? <StatsPage /> : null}
        {tab === 'settings' ? <SettingsPage /> : null}
      </main>
      <BottomNav current={tab} onChange={setTab} />
      <ReminderDialog
        open={reminderEvent !== null}
        event={reminderEvent}
        onClose={() => setReminderEvent(null)}
      />
    </Box>
  );
}

/** 应用入口：主题、全局数据 Provider 与主体 */
export default function App(): ReactElement {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppDataProvider>
        <AppContent />
      </AppDataProvider>
    </ThemeProvider>
  );
}
