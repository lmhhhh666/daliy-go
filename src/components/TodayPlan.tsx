import type { ReactElement } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import SchoolIcon from '@mui/icons-material/School';
import type { DailyPlan } from '../types';
import { formatChineseDate, formatDuration, parseDate } from '../utils/time';

interface TodayPlanProps {
  plan: DailyPlan;
  /** 是否完全没有课程和待办 */
  isEmpty: boolean;
  onToggleCourse: (courseId: string, date: string) => void;
  onToggleTodo: (todoId: string) => void;
  onAddTodo: () => void;
  onLoadSample: () => void;
}

/** 今日时间轴 + 自动排程结果 */
export default function TodayPlan({
  plan,
  isEmpty,
  onToggleCourse,
  onToggleTodo,
  onAddTodo,
  onLoadSample,
}: TodayPlanProps): ReactElement {
  const completedCount = plan.items.filter((item) => item.completed).length;
  const date = parseDate(plan.date);

  return (
    <Box>
      <Card sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          今日计划
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {formatChineseDate(date)} · 第 {plan.weekNumber} 教学周
        </Typography>
        <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
          预计学习 {formatDuration(plan.totalStudyMinutes)} · 已完成 {completedCount}/{plan.items.length}
        </Typography>
      </Card>

      {isEmpty ? (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <SchoolIcon sx={{ fontSize: 52, color: '#14b8a6', mb: 1 }} />
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            还没有课程和待办
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            载入示例课表可立即体验，也可以先添加一条待办。
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={onLoadSample}>
              载入示例课表
            </Button>
            <Button variant="outlined" onClick={onAddTodo}>
              添加待办
            </Button>
          </Box>
        </Card>
      ) : plan.items.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          今天没有课程，所有时间都可以自由安排。添加待办后会自动排入空闲时段。
        </Alert>
      ) : (
        <Box sx={{ ml: 1.5, borderLeft: '2px solid #d8e6e4', pl: 2 }}>
          {plan.items.map((item) => (
            <Box key={item.id} sx={{ position: 'relative', pb: 2 }}>
              <Box
                sx={{
                  position: 'absolute',
                  left: '-29px',
                  top: 14,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: item.completed ? '#94a3b8' : item.color,
                  border: '2px solid #fff',
                  boxShadow: '0 0 0 2px #d8e6e4',
                }}
              />
              <Card sx={{ borderLeft: `4px solid ${item.color}`, p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Checkbox
                    size="small"
                    checked={item.completed}
                    onChange={() =>
                      item.kind === 'course'
                        ? onToggleCourse(item.sourceId, plan.date)
                        : onToggleTodo(item.sourceId)
                    }
                    inputProps={{ 'aria-label': `完成 ${item.title}` }}
                    sx={{ p: 0.25 }}
                  />
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      wordBreak: 'break-all',
                      textDecoration: item.completed ? 'line-through' : 'none',
                      color: item.completed ? 'text.disabled' : 'text.primary',
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Chip
                    size="small"
                    label={item.kind === 'course' ? '课程' : '待办'}
                    color={item.kind === 'course' ? 'primary' : 'default'}
                    variant="outlined"
                    sx={{ height: 22, fontSize: 11 }}
                  />
                </Box>
                <Typography variant="body2" color="primary" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {item.startTime} - {item.endTime}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.kind === 'course'
                    ? `${item.location || '地点未填写'}${item.teacher ? ` · ${item.teacher}` : ''}`
                    : `自动安排 · ${formatDuration(item.durationMinutes)}`}
                </Typography>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {plan.unscheduled.length > 0 ? (
        <Alert severity="warning" sx={{ mt: 1 }}>
          <Typography variant="body2" fontWeight={700} gutterBottom>
            {plan.unscheduled.length} 条待办未排入今日计划
          </Typography>
          {plan.unscheduled.map((entry) => (
            <Typography key={entry.todo.id} variant="caption" component="div">
              · {entry.todo.title}：{entry.reason}
            </Typography>
          ))}
          <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
            可在「待办」页缩短时长或调整截止日。
          </Typography>
        </Alert>
      ) : null}
    </Box>
  );
}
