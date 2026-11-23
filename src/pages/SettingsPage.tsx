import { useState, type ReactElement } from 'react';
import Box from '@mui/material/Box';
import BellScheduleEditor from '../components/BellScheduleEditor';
import SettingsView from '../components/SettingsView';
import { useAppData } from '../storage/AppDataContext';
import { db } from '../storage/db';

/** 设置页 */
export default function SettingsPage(): ReactElement {
  const data = useAppData();
  const [bellEditorOpen, setBellEditorOpen] = useState<boolean>(false);

  return (
    <Box sx={{ p: 2 }}>
      <SettingsView onOpenBellEditor={() => setBellEditorOpen(true)} />
      <BellScheduleEditor
        open={bellEditorOpen}
        value={data.bellSchedule}
        onClose={() => setBellEditorOpen(false)}
        onSave={(value) => {
          db.setBellSchedule(value);
          setBellEditorOpen(false);
        }}
      />
    </Box>
  );
}
