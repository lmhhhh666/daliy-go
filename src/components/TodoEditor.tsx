import { useEffect, useState, type ReactElement } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import type { Priority, Todo } from '../types';
import { createId } from '../storage/db';
import { formatDate } from '../utils/time';

interface TodoEditorProps {
  open: boolean;
  /** null 表示新增 */
  todo: Todo | null;
  onClose: () => void;
  onSave: (todo: Todo) => void;
}

function createBlankTodo(): Todo {
  return {
    id: createId('todo'),
    title: '',
    durationMinutes: 30,
    dueDate: formatDate(new Date()),
    priority: 2,
    completed: false,
    completedAt: '',
    createdAt: new Date().toISOString(),
  };
}

/** 待办新增/编辑弹窗 */
export default function TodoEditor({ open, todo, onClose, onSave }: TodoEditorProps): ReactElement {
  const [form, setForm] = useState<Todo>(createBlankTodo());

  useEffect(() => {
    if (open) {
      setForm(todo ? { ...todo } : createBlankTodo());
    }
  }, [open, todo]);

  const titleError = form.title.trim() ? '' : '请输入待办标题';
  const durationError = form.durationMinutes > 0 ? '' : '预计时长需大于 0 分钟';
  const invalid = Boolean(titleError || durationError);

  function handleSave(): void {
    if (invalid) {
      return;
    }
    onSave({
      ...form,
      title: form.title.trim(),
      durationMinutes: Math.round(form.durationMinutes),
    });
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>{todo ? '编辑待办' : '新增待办'}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
          <TextField
            label="待办标题"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            error={Boolean(titleError)}
            helperText={titleError}
            fullWidth
            autoFocus
          />
          <TextField
            label="预计时长（分钟）"
            type="number"
            value={form.durationMinutes}
            onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })}
            error={Boolean(durationError)}
            helperText={durationError || '应用会自动把它安排进空闲时段'}
            inputProps={{ min: 5, max: 600, step: 5 }}
            fullWidth
          />
          <TextField
            label="截止日期"
            type="date"
            value={form.dueDate}
            onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel id="priority-label">优先级</InputLabel>
            <Select
              labelId="priority-label"
              label="优先级"
              value={form.priority}
              onChange={(event) => setForm({ ...form, priority: Number(event.target.value) as Priority })}
            >
              <MenuItem value={1}>高</MenuItem>
              <MenuItem value={2}>中</MenuItem>
              <MenuItem value={3}>低</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSave} variant="contained" disabled={invalid}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}
