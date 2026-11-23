import type {
  AppSettings,
  BellSchedule,
  Course,
  DailyPlan,
  PlanItem,
  Todo,
  UnscheduledTodo,
} from '../types';
import {
  formatDate,
  getPeriodTime,
  getWeekNumber,
  getWeekday,
  isWeekActive,
  minutesToTime,
  timeToMinutes,
} from './time';

/** 用分钟数表示的区间（自 00:00 起） */
export interface TimeInterval {
  start: number;
  end: number;
}

/** 一门课程在当天的占用信息 */
interface CourseOccupation {
  course: Course;
  interval: TimeInterval;
  startTime: string;
  endTime: string;
}

/**
 * 计算某天所有生效课程占用的时间段。
 */
export function getCourseOccupations(
  courses: Course[],
  date: Date,
  bell: BellSchedule,
  weekNumber: number,
): CourseOccupation[] {
  const weekday = getWeekday(date);
  const result: CourseOccupation[] = [];

  for (const course of courses) {
    if (course.weekday !== weekday || !isWeekActive(course.weeks, weekNumber)) {
      continue;
    }
    const first = getPeriodTime(course.startPeriod, bell);
    const last = getPeriodTime(course.endPeriod, bell);
    const interval = {
      start: timeToMinutes(first.startTime),
      end: timeToMinutes(last.endTime),
    };
    if (interval.end <= interval.start) {
      continue;
    }
    result.push({
      course,
      interval,
      startTime: first.startTime,
      endTime: last.endTime,
    });
  }

  return result.sort((a, b) => a.interval.start - b.interval.start);
}

/** 由占用区间求空闲区间，默认一天可用时间为 08:00 - 22:00 */
export function getFreeIntervals(
  busy: TimeInterval[],
  dayStart = 8 * 60,
  dayEnd = 22 * 60,
): TimeInterval[] {
  const merged: TimeInterval[] = [];
  const sorted = busy
    .filter((item) => item.end > item.start)
    .sort((a, b) => a.start - b.start);

  for (const item of sorted) {
    const last = merged[merged.length - 1];
    if (last && item.start <= last.end) {
      last.end = Math.max(last.end, item.end);
    } else {
      merged.push({ start: item.start, end: item.end });
    }
  }

  const free: TimeInterval[] = [];
  let cursor = dayStart;
  for (const item of merged) {
    if (item.start > cursor) {
      free.push({ start: cursor, end: Math.min(item.start, dayEnd) });
    }
    cursor = Math.max(cursor, item.end);
    if (cursor >= dayEnd) {
      break;
    }
  }
  if (cursor < dayEnd) {
    free.push({ start: cursor, end: dayEnd });
  }
  return free.filter((item) => item.end - item.start >= 1);
}

/** 单门课程时长（分钟） */
export function getCourseDurationMinutes(course: Course, bell: BellSchedule): number {
  const first = getPeriodTime(course.startPeriod, bell);
  const last = getPeriodTime(course.endPeriod, bell);
  return Math.max(0, timeToMinutes(last.endTime) - timeToMinutes(first.startTime));
}

/** 待办排序：优先级高 -> 截止早 -> 创建早 */
function compareTodos(a: Todo, b: Todo): number {
  if (a.priority !== b.priority) {
    return a.priority - b.priority;
  }
  const dueA = a.dueDate || '9999-12-31';
  const dueB = b.dueDate || '9999-12-31';
  if (dueA !== dueB) {
    return dueA.localeCompare(dueB);
  }
  if (a.createdAt !== b.createdAt) {
    return a.createdAt.localeCompare(b.createdAt);
  }
  return a.title.localeCompare(b.title, 'zh-CN');
}

/**
 * 生成某天的计划：先放置课程，再把未完成的待办贪心放入空闲时段。
 * 放不下的待办进入 unscheduled 列表并给出明确原因。
 */
export function buildDailyPlan(
  date: Date,
  courses: Course[],
  todos: Todo[],
  bell: BellSchedule,
  settings: AppSettings,
): DailyPlan {
  const dateKey = formatDate(date);
  const weekday = getWeekday(date);
  const weekNumber = getWeekNumber(settings.semesterStart, date, settings.weekNumber);
  const occupations = getCourseOccupations(courses, date, bell, weekNumber);
  const available = getFreeIntervals(occupations.map((item) => item.interval));

  const items: PlanItem[] = occupations.map((item) => ({
    id: `course-${item.course.id}`,
    kind: 'course' as const,
    title: item.course.name,
    startTime: item.startTime,
    endTime: item.endTime,
    sourceId: item.course.id,
    location: item.course.location,
    teacher: item.course.teacher,
    color: item.course.color,
    scheduled: true,
    completed: item.course.completedDates.includes(dateKey),
    durationMinutes: item.interval.end - item.interval.start,
  }));

  const pendingTodos = todos.filter((todo) => !todo.completed).sort(compareTodos);
  const unscheduled: UnscheduledTodo[] = [];

  for (const todo of pendingTodos) {
    if (todo.durationMinutes <= 0) {
      unscheduled.push({ todo, reason: '预计时长无效，请设置为大于 0 的分钟数' });
      continue;
    }
    const index = available.findIndex((slot) => slot.end - slot.start >= todo.durationMinutes);
    if (index < 0) {
      unscheduled.push({
        todo,
        reason: `空闲时段不足，需要连续 ${todo.durationMinutes} 分钟`,
      });
      continue;
    }
    const slot = available[index];
    const end = slot.start + todo.durationMinutes;
    items.push({
      id: `todo-${todo.id}`,
      kind: 'todo',
      title: todo.title,
      startTime: minutesToTime(slot.start),
      endTime: minutesToTime(end),
      sourceId: todo.id,
      color: todo.priority === 1 ? '#ef4444' : todo.priority === 2 ? '#f59e0b' : '#3b82f6',
      scheduled: true,
      completed: false,
      durationMinutes: todo.durationMinutes,
    });
    slot.start = end;
    if (slot.end - slot.start < 1) {
      available.splice(index, 1);
    }
  }

  items.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const totalStudyMinutes = items
    .filter((item) => item.scheduled)
    .reduce((sum, item) => sum + item.durationMinutes, 0);

  return {
    date: dateKey,
    weekday,
    weekNumber,
    items,
    unscheduled,
    totalStudyMinutes,
  };
}
