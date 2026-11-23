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
import Typography from '@mui/material/Typography';
import type { BellSchedule, Course, Weekday } from '../types';
import { createId } from '../storage/db';
import { WEEKDAY_LABELS, WEEKDAY_ORDER } from '../utils/time';

interface CourseEditorProps {
  open: boolean;
  /** null 表示新增 */
  course: Course | null;
  bellSchedule: BellSchedule;
  onClose: () => void;
  onSave: (course: Course) => void;
}

const COLORS = ['#0ea5e9', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e', '#6366f1', '#ec4899'];
const ODD_WEEKS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
const EVEN_WEEKS = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];

function createBlankCourse(): Course {
  return {
    id: createId('course'),
    name: '',
    weekday: 1,
    startPeriod: 1,
    endPeriod: 2,
    location: '',
    teacher: '',
    weeks: [],
    color: COLORS[0],
    completedDates: [],
  };
}

/** 课程新增/编辑弹窗 */
export default function CourseEditor({
  open,
  course,
  bellSchedule,
  onClose,
  onSave,
}: CourseEditorProps): ReactElement {
  const [form, setForm] = useState<Course>(createBlankCourse());

  useEffect(() => {
    if (open) {
      setForm(course ? { ...course, weeks: [...course.weeks] } : createBlankCourse());
    }
  }, [open, course]);

  const periodOptions = Array.from(
    new Set([
      ...Array.from({ length: 12 }, (_, index) => index + 1),
      ...bellSchedule.slots.map((slot) => slot.period),
    ]),
  ).sort((a, b) => a - b);

  const nameError = form.name.trim() ? '' : '请输入课程名称';
  const periodError = form.endPeriod < form.startPeriod ? '结束节次不能早于开始节次' : '';
  const invalid = Boolean(nameError || periodError);

  const weeksText = form.weeks.length > 0 ? form.weeks.join(',') : '';

  function handleWeeksChange(value: string): void {
    const weeks = (value.match(/\d+/g) ?? [])
      .map(Number)
      .filter((week) => week >= 1 && week <= 30);
    setForm({ ...form, weeks: Array.from(new Set(weeks)).sort((a, b) => a - b) });
  }

  function handleSave(): void {
    if (invalid) {
      return;
    }
    onSave({
      ...form,
      name: form.name.trim(),
      location: form.location.trim(),
      teacher: form.teacher.trim(),
    });
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle sx={{ fontWeight: 700 }}>{course ? '编辑课程' : '新增课程'}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
          <TextField
            label="课程名称"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            error={Boolean(nameError)}
            helperText={nameError}
            fullWidth
            autoFocus
          />

          <FormControl fullWidth>
            <InputLabel id="weekday-label">星期</InputLabel>
            <Select
              labelId="weekday-label"
              label="星期"
              value={form.weekday}
              onChange={(event) => setForm({ ...form, weekday: Number(event.target.value) as Weekday })}
            >
              {WEEKDAY_ORDER.map((day) => (
                <MenuItem key={day} value={day}>
                  {WEEKDAY_LABELS[day]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="start-period-label">开始节次</InputLabel>
              <Select
                labelId="start-period-label"
                label="开始节次"
                value={form.startPeriod}
                onChange={(event) => setForm({ ...form, startPeriod: Number(event.target.value) })}
              >
                {periodOptions.map((period) => (
                  <MenuItem key={period} value={period}>
                    第 {period} 节
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="end-period-label">结束节次</InputLabel>
              <Select
                labelId="end-period-label"
                label="结束节次"
                value={form.endPeriod}
                error={Boolean(periodError)}
                onChange={(event) => setForm({ ...form, endPeriod: Number(event.target.value) })}
              >
                {periodOptions.map((period) => (
                  <MenuItem key={period} value={period}>
                    第 {period} 节
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {periodError ? (
            <Typography variant="caption" color="error">
              {periodError}
            </Typography>
          ) : null}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="上课地点"
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
              fullWidth
            />
            <TextField
              label="授课教师"
              value={form.teacher}
              onChange={(event) => setForm({ ...form, teacher: event.target.value })}
              fullWidth
            />
          </Box>

          <Typography variant="subtitle2" color="text.secondary">
            生效周次
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant={form.weeks.length === 0 ? 'contained' : 'outlined'}
              onClick={() => setForm({ ...form, weeks: [] })}
            >
              每周
            </Button>
            <Button
              size="small"
              variant={form.weeks.join(',') === ODD_WEEKS.join(',') ? 'contained' : 'outlined'}
              onClick={() => setForm({ ...form, weeks: ODD_WEEKS })}
            >
              单周
            </Button>
            <Button
              size="small"
              variant={form.weeks.join(',') === EVEN_WEEKS.join(',') ? 'contained' : 'outlined'}
              onClick={() => setForm({ ...form, weeks: EVEN_WEEKS })}
            >
              双周
            </Button>
          </Box>
          <TextField
            label="自定义周次"
            value={weeksText}
            onChange={(event) => handleWeeksChange(event.target.value)}
            placeholder="如 1,3,5；留空表示每周"
            helperText="可填写任意周次，用逗号分隔"
            fullWidth
          />

          <Typography variant="subtitle2" color="text.secondary">
            卡片颜色
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
            {COLORS.map((color) => (
              <Box
                key={color}
                role="button"
                aria-label={`选择颜色 ${color}`}
                onClick={() => setForm({ ...form, color })}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  backgroundColor: color,
                  cursor: 'pointer',
                  border: form.color === color ? '3px solid #0f172a' : '3px solid transparent',
                  boxShadow: form.color === color ? 'none' : '0 1px 4px rgba(0,0,0,0.15)',
                }}
              />
            ))}
          </Box>
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
