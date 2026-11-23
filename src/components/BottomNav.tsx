import type { ReactElement } from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import TodayIcon from '@mui/icons-material/Today';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import type { TabKey } from '../types';

interface BottomNavProps {
  current: TabKey;
  onChange: (tab: TabKey) => void;
}

interface TabConfig {
  key: TabKey;
  label: string;
  icon: ReactElement;
}

const TABS: TabConfig[] = [
  { key: 'today', label: '今日', icon: <TodayIcon /> },
  { key: 'schedule', label: '课表', icon: <CalendarMonthIcon /> },
  { key: 'todos', label: '待办', icon: <FactCheckIcon /> },
  { key: 'stats', label: '统计', icon: <BarChartIcon /> },
  { key: 'settings', label: '设置', icon: <SettingsIcon /> },
];

/** 移动端底部导航 */
export default function BottomNav({ current, onChange }: BottomNavProps): ReactElement {
  const selectedIndex = Math.max(
    0,
    TABS.findIndex((tab) => tab.key === current),
  );

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        pb: 'env(safe-area-inset-bottom, 0px)',
        borderTop: '1px solid #e2e8f0',
      }}
    >
      <BottomNavigation
        value={selectedIndex}
        onChange={(_event, value: number) => onChange(TABS[value].key)}
        showLabels
        sx={{ height: 64 }}
      >
        {TABS.map((tab) => (
          <BottomNavigationAction
            key={tab.key}
            label={tab.label}
            icon={tab.icon}
            sx={{ minWidth: 0, px: 0.5, '& .MuiBottomNavigationAction-label': { fontSize: 11 } }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
