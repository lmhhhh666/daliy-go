import type { ReactElement } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import type { AppSettings, BellSchedule, Course, Todo } from '../types';
import { getCourseOccupations, getCourseDurationMinutes } from '../utils/scheduler';
import {
  addDays,
  formatDate,
  formatDuration,
  getWeekDates,
  getWeekNumber,
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
} from '../utils/time';

interface StatsViewProps {
  courses: Course[];
  todos: Todo[];
  bellSchedule: BellSchedule;
  settings: AppSettings;
}

interface DayRecord {
  minutes: number;
  count: number;
}

/** SVG 环形进度 */
function ProgressRing({ value, size = 104 }: { value: number; size?: number }): ReactElement {
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <Box sx={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#0f766e"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="53%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="20"
          fontWeight="700"
          fill="#0f766e"
        >
          {clamped}%
        </text>
      </svg>
    </Box>
  );
}

/** 获取待办完成日期，无效返回空串 */
function completionDateOf(todo: Todo): string {
  if (!todo.completedAt) {
    return '';
  }
  const date = new Date(todo.completedAt);
  return Number.isNaN(date.getTime()) ? '' : formatDate(date);
}

/** 完成率、连续打卡与学习时长统计 */
export default function StatsView({
  courses,
  todos,
  bellSchedule,
  settings,
}: StatsViewProps): ReactElement {
  const today = new Date();
  const todayKey = formatDate(today);
  const weekDates = getWeekDates(today);
  const weekKeys = weekDates.map((date) => formatDate(date));

  // 汇总每天的学习时长与完成条目数。
  const records = new Map<string, DayRecord>();
  function addRecord(dateKey: string, minutes: number, count: number): void {
    if (!dateKey) {
      return;
    }
    const current = records.get(dateKey) ?? { minutes: 0, count: 0 };
    records.set(dateKey, { minutes: current.minutes + minutes, count: current.count + count });
  }

  for (const course of courses) {
    const duration = getCourseDurationMinutes(course, bellSchedule);
    for (const dateKey of course.completedDates) {
      addRecord(dateKey, duration, 1);
    }
  }
  for (const todo of todos) {
    if (todo.completed) {
      addRecord(completionDateOf(todo), todo.durationMinutes, 1);
    }
  }

  // 今日完成率。
  const weekNumber = getWeekNumber(settings.semesterStart, today, settings.weekNumber);
  const todayCourses = getCourseOccupations(courses, today, bellSchedule, weekNumber);
  const todayTodos = todos.filter(
    (todo) => todo.dueDate === todayKey || completionDateOf(todo) === todayKey,
  );
  const todayTotal = todayCourses.length + todayTodos.length;
  const todayDone =
    todayCourses.filter((item) => item.course.completedDates.includes(todayKey)).length +
    todayTodos.filter((todo) => todo.completed).length;
  const completionRate = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  // 连续打卡：今天没打卡则从昨天开始计算。
  let streak = 0;
  let cursor = new Date();
  if (!records.has(formatDate(cursor))) {
    cursor = addDays(cursor, -1);
  }
  while (records.has(formatDate(cursor)) && streak < 365) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  const weeklyMinutes = weekKeys.reduce(
    (sum, key) => sum + (records.get(key)?.minutes ?? 0),
    0,
  );
  const dailyMinutes = weekKeys.map((key) => records.get(key)?.minutes ?? 0);
  const maxMinutes = Math.max(60, ...dailyMinutes);
  const completedTodos = todos.filter((todo) => todo.completed).length;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        学习统计
      </Typography>

      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
        <Card sx={{ flex: '1 1 150px', p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ProgressRing value={completionRate} />
          <Box>
            <Typography variant="body2" color="text.secondary">
              今日完成率
            </Typography>
            <Typography variant="body2">
              {todayDone}/{todayTotal} 项
            </Typography>
          </Box>
        </Card>
        <Card sx={{ flex: '1 1 150px', p: 2 }}>
          <WhatshotIcon color="warning" />
          <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
            {streak} 天
          </Typography>
          <Typography variant="body2" color="text.secondary">
            连续打卡
          </Typography>
        </Card>
        <Card sx={{ flex: '1 1 150px', p: 2 }}>
          <AccessTimeIcon color="primary" />
          <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
            {formatDuration(weeklyMinutes)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            本周学习时长
          </Typography>
        </Card>
      </Box>

      <Card sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          本周每日学习时长
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 150 }}>
          {weekDates.map((date, index) => {
            const minutes = dailyMinutes[index];
            const height = Math.max(4, Math.round((minutes / maxMinutes) * 100));
            const isToday = formatDate(date) === todayKey;
            return (
              <Box key={formatDate(date)} sx={{ textAlign: 'center', width: 38 }}>
                <Typography variant="caption" color="text.secondary">
                  {minutes > 0 ? minutes : ''}
                </Typography>
                <Box
                  sx={{
                    height,
                    width: 22,
                    mx: 'auto',
                    borderRadius: '8px 8px 3px 3px',
                    background: isToday
                      ? 'linear-gradient(180deg, #14b8a6, #0f766e)'
                      : 'linear-gradient(180deg, #99f6e4, #5eead4)',
                    transition: 'height 0.3s',
                  }}
                />
                <Typography variant="caption" color={isToday ? 'primary' : 'text.secondary'}>
                  {WEEKDAY_LABELS[WEEKDAY_ORDER[index]].slice(1)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Card>

      <Card sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          总体进度
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <CheckCircleIcon color="success" fontSize="small" />
          <Typography variant="body2">
            待办完成 {completedTodos}/{todos.length}
          </Typography>
        </Box>
        <Box sx={{ height: 8, bgcolor: '#e2e8f0', borderRadius: 4, overflow: 'hidden', mb: 2 }}>
          <Box
            sx={{
              height: '100%',
              width: `${todos.length > 0 ? (completedTodos / todos.length) * 100 : 0}%`,
              bgcolor: '#22c55e',
              transition: 'width 0.3s',
            }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          共 {courses.length} 门课程 · 累计完成 {Array.from(records.values()).reduce((sum, item) => sum + item.count, 0)} 次打卡
        </Typography>
      </Card>
    </Box>
  );
}
