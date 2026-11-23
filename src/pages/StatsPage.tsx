import type { ReactElement } from 'react';
import Box from '@mui/material/Box';
import StatsView from '../components/StatsView';
import { useAppData } from '../storage/AppDataContext';

/** 统计页 */
export default function StatsPage(): ReactElement {
  const data = useAppData();
  return (
    <Box sx={{ p: 2 }}>
      <StatsView
        courses={data.courses}
        todos={data.todos}
        bellSchedule={data.bellSchedule}
        settings={data.settings}
      />
    </Box>
  );
}
