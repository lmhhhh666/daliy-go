import type { BellSchedule, Weekday } from '../types';

/** 星期中文标签 */
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
};

/** 星期顺序 */
export const WEEKDAY_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

/** 补零 */
export function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/** Date -> yyyy-MM-dd（本地时区） */
export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** yyyy-MM-dd -> Date；非法输入回退到今天 */
export function parseDate(value: string): Date {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value.trim());
  if (!match) {
    return new Date();
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const result = new Date(year, month, day);
  if (Number.isNaN(result.getTime())) {
    return new Date();
  }
  return result;
}

/** 日期加减天数，返回新 Date */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

/** 获取星期（1=周一 ... 7=周日） */
export function getWeekday(date: Date): Weekday {
  const raw = date.getDay();
  return raw === 0 ? 7 : (raw as Weekday);
}

/** "HH:mm" -> 自 00:00 起的分钟数；非法输入返回 0 */
export function timeToMinutes(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return 0;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return 0;
  }
  return hours * 60 + minutes;
}

/** 分钟数 -> "HH:mm"，自动处理跨天（对超过 24h 的值取模） */
export function minutesToTime(minutes: number): string {
  const safe = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(safe / 60))}:${pad2(safe % 60)}`;
}

/** HH:mm 加上若干分钟 */
export function addMinutes(value: string, minutes: number): string {
  return minutesToTime(timeToMinutes(value) + minutes);
}

/**
 * 查询某一节次的起止时间。
 * 若用户删除了该节次，则给出 08:00 起每节 45 分钟 + 10 分钟课间 的兜底时间。
 */
export function getPeriodTime(period: number, bell: BellSchedule): { startTime: string; endTime: string } {
  const slot = bell.slots.find((item) => item.period === period);
  if (slot) {
    return { startTime: slot.startTime, endTime: slot.endTime };
  }
  const start = 8 * 60 + (period - 1) * 55;
  return { startTime: minutesToTime(start), endTime: minutesToTime(start + 45) };
}

/** 格式化时间区间 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`;
}

/** 获取所在周的周一 */
export function startOfWeek(date: Date): Date {
  const weekday = getWeekday(date);
  return addDays(date, -(weekday - 1));
}

/** 获取所在周的 7 天日期（周一到周日） */
export function getWeekDates(date: Date): Date[] {
  const monday = startOfWeek(date);
  return WEEKDAY_ORDER.map((_, index) => addDays(monday, index));
}

/** 两个日期相差的自然天数 (b - a) */
export function diffDays(a: Date, b: Date): number {
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((end - start) / 86400000);
}

/** 计算教学周；未设置学期开始日期时使用手动周次 */
export function getWeekNumber(semesterStart: string, date: Date, fallback: number): number {
  if (!semesterStart) {
    return Math.max(1, fallback);
  }
  const start = parseDate(semesterStart);
  const week = Math.floor(diffDays(start, date) / 7) + 1;
  return week >= 1 ? week : 1;
}

/** 课程是否在指定教学周生效；空数组表示每周 */
export function isWeekActive(weeks: number[], weekNumber: number): boolean {
  return weeks.length === 0 || weeks.includes(weekNumber);
}

/** 中文日期，如 "11月23日 周日" */
export function formatChineseDate(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAY_LABELS[getWeekday(date)]}`;
}

/** 人类可读时长，如 "1小时30分" */
export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (hours === 0) {
    return `${rest}分钟`;
  }
  if (rest === 0) {
    return `${hours}小时`;
  }
  return `${hours}小时${rest}分`;
}
