import type { ReactElement } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import type { BellSchedule, Course } from '../types';
import { formatTimeRange, getPeriodTime, WEEKDAY_LABELS, WEEKDAY_ORDER } from '../utils/time';

interface CourseListProps {
  courses: Course[];
  bellSchedule: BellSchedule;
  /** 打卡对应的日期 yyyy-MM-dd */
  completionDate: string;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string, date: string) => void;
}

/** 按星期分组的课程列表 */
export default function CourseList({
  courses,
  bellSchedule,
  completionDate,
  onEdit,
  onDelete,
  onToggleComplete,
}: CourseListProps): ReactElement {
  return (
    <Box>
      {WEEKDAY_ORDER.map((day) => {
        const dayCourses = courses
          .filter((course) => course.weekday === day)
          .sort((a, b) => a.startPeriod - b.startPeriod);
        if (dayCourses.length === 0) {
          return null;
        }
        return (
          <Box key={day} sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} color="primary">
                {WEEKDAY_LABELS[day]}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {dayCourses.length} 门课
              </Typography>
            </Box>
            {dayCourses.map((course) => {
              const first = getPeriodTime(course.startPeriod, bellSchedule);
              const last = getPeriodTime(course.endPeriod, bellSchedule);
              const completed = course.completedDates.includes(completionDate);
              return (
                <Card key={course.id} sx={{ mb: 1.25, overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex' }}>
                    <Box sx={{ width: 5, flexShrink: 0, bgcolor: course.color }} />
                    <Box sx={{ p: 1.5, flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          sx={{ flex: 1, minWidth: 0, wordBreak: 'break-all' }}
                        >
                          {course.name}
                        </Typography>
                        {course.weeks.length > 0 ? (
                          <Chip
                            size="small"
                            label={`第${course.weeks.join('/')}周`}
                            sx={{ height: 22, fontSize: 11 }}
                          />
                        ) : null}
                        <Checkbox
                          size="small"
                          checked={completed}
                          onChange={() => onToggleComplete(course.id, completionDate)}
                          inputProps={{ 'aria-label': `完成 ${course.name}` }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {formatTimeRange(first.startTime, last.endTime)} · 第 {course.startPeriod}-
                        {course.endPeriod} 节
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {course.location || '地点未填写'}
                        {course.teacher ? ` · ${course.teacher}` : ''}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        <Button size="small" onClick={() => onEdit(course)}>
                          编辑
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => {
                            if (window.confirm(`确定删除课程「${course.name}」吗？`)) {
                              onDelete(course.id);
                            }
                          }}
                        >
                          删除
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Card>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}
