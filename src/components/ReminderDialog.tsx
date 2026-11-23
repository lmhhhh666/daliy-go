import type { ReactElement } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import type { ReminderEvent } from '../utils/notification';

interface ReminderDialogProps {
  open: boolean;
  event: ReminderEvent | null;
  onClose: () => void;
}

/** 课前提醒弹窗：课程即将开始时显示 */
export default function ReminderDialog({ open, event, onClose }: ReminderDialogProps): ReactElement {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>课前提醒</DialogTitle>
      <DialogContent dividers>
        {event ? (
          <>
            <Typography variant="h6" color="primary" gutterBottom>
              {event.course.name}
            </Typography>
            <Typography variant="body1" gutterBottom>
              {event.startTime} 开始 · 第 {event.course.startPeriod} 节
            </Typography>
            <Typography variant="body2" color="text.secondary">
              地点：{event.course.location || '未填写'}
              {event.course.teacher ? ` · ${event.course.teacher}` : ''}
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              请保持应用打开以持续接收提醒。
            </Alert>
          </>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" fullWidth>
          知道了
        </Button>
      </DialogActions>
    </Dialog>
  );
}
