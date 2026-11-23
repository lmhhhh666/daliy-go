import { useEffect, useState, type ReactElement } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { BellSchedule, BellSlot } from '../types';
import { addMinutes, timeToMinutes } from '../utils/time';

interface BellScheduleEditorProps {
  open: boolean;
  value: BellSchedule;
  onClose: () => void;
  onSave: (value: BellSchedule) => void;
}

/** 自定义作息时间表弹窗 */
export default function BellScheduleEditor({
  open,
  value,
  onClose,
  onSave,
}: BellScheduleEditorProps): ReactElement {
  const [slots, setSlots] = useState<BellSlot[]>([]);

  useEffect(() => {
    if (open) {
      setSlots(value.slots.map((slot) => ({ ...slot })).sort((a, b) => a.period - b.period));
    }
  }, [open, value]);

  const hasError = slots.some(
    (slot) => timeToMinutes(slot.endTime) <= timeToMinutes(slot.startTime),
  );

  function updateSlot(period: number, patch: Partial<BellSlot>): void {
    setSlots((current) =>
      current.map((slot) => (slot.period === period ? { ...slot, ...patch } : slot)),
    );
  }

  function addSlot(): void {
    setSlots((current) => {
      const last = current[current.length - 1];
      const period = current.length > 0 ? Math.max(...current.map((item) => item.period)) + 1 : 1;
      const start = last ? addMinutes(last.endTime, 10) : '08:00';
      return [...current, { period, startTime: start, endTime: addMinutes(start, 45) }];
    });
  }

  function handleSave(): void {
    if (hasError) {
      return;
    }
    onSave({ slots: slots.map((slot, index) => ({ ...slot, period: index + 1 })) });
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" scroll="paper">
      <DialogTitle sx={{ fontWeight: 700 }}>自定义作息时间</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          修改每节课的起止时间，今日时间轴与自动排程会立即按新时间计算。
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {slots.map((slot) => (
            <Box key={slot.period} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 52, flexShrink: 0, fontWeight: 600, color: '#0f766e' }}>
                第{slot.period}节
              </Box>
              <TextField
                type="time"
                value={slot.startTime}
                onChange={(event) => updateSlot(slot.period, { startTime: event.target.value })}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
                size="small"
                fullWidth
                label="开始"
              />
              <TextField
                type="time"
                value={slot.endTime}
                onChange={(event) => updateSlot(slot.period, { endTime: event.target.value })}
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
                size="small"
                fullWidth
                label="结束"
                error={timeToMinutes(slot.endTime) <= timeToMinutes(slot.startTime)}
              />
              <IconButton
                aria-label={`删除第${slot.period}节`}
                size="small"
                color="error"
                onClick={() =>
                  setSlots((current) => current.filter((item) => item.period !== slot.period))
                }
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
        {hasError ? (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            每节课的结束时间必须晚于开始时间。
          </Typography>
        ) : null}
        <Button startIcon={<AddIcon />} onClick={addSlot} sx={{ mt: 2 }} fullWidth variant="outlined">
          添加一节
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSave} variant="contained" disabled={hasError}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}
