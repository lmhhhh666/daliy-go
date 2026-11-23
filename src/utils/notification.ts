import type { AppSettings, BellSchedule, Course } from '../types';
import {
  formatDate,
  getPeriodTime,
  getWeekNumber,
  getWeekday,
  isWeekActive,
  timeToMinutes,
} from './time';

export interface ReminderContext {
  courses: Course[];
  bell: BellSchedule;
  settings: AppSettings;
}

export interface ReminderEvent {
  course: Course;
  startTime: string;
  date: string;
}

/**
 * 课前提醒检查器：应用打开时每 30 秒检查一次即将开始的课程。
 * 同一节课同一天只提醒一次。页面关闭后浏览器 JS 定时器不可靠，见 README 说明。
 */
export class ReminderChecker {
  private readonly getContext: () => ReminderContext;
  private readonly onTrigger: (event: ReminderEvent) => void;
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly fired = new Set<string>();

  constructor(
    getContext: () => ReminderContext,
    onTrigger: (event: ReminderEvent) => void,
  ) {
    this.getContext = getContext;
    this.onTrigger = onTrigger;
  }

  /** 启动检查，可自定义轮询间隔（毫秒） */
  public start(intervalMs = 30_000): void {
    this.stop();
    this.check();
    this.timer = setInterval(() => this.check(), intervalMs);
  }

  /** 停止检查 */
  public stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** 立即执行一次检查 */
  public check(): void {
    if (typeof window === 'undefined') {
      return;
    }
    const { courses, bell, settings } = this.getContext();
    const now = new Date();
    const today = formatDate(now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const weekday = getWeekday(now);
    const weekNumber = getWeekNumber(settings.semesterStart, now, settings.weekNumber);

    // 清理昨天及更早的触发记录，避免 Set 无限增长。
    for (const key of Array.from(this.fired)) {
      if (!key.startsWith(today)) {
        this.fired.delete(key);
      }
    }

    for (const course of courses) {
      if (course.weekday !== weekday || !isWeekActive(course.weeks, weekNumber)) {
        continue;
      }
      const { startTime } = getPeriodTime(course.startPeriod, bell);
      const diff = timeToMinutes(startTime) - nowMinutes;
      if (diff < 0 || diff > settings.reminderMinutes) {
        continue;
      }
      const key = `${today}-${course.id}-${course.startPeriod}`;
      if (this.fired.has(key)) {
        continue;
      }
      this.fired.add(key);
      this.onTrigger({ course, startTime, date: today });
    }
  }
}

/** 当前浏览器是否支持通知 API */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** 请求通知权限；不支持时返回 'unsupported' */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  if (Notification.permission !== 'default') {
    return Notification.permission;
  }
  return await Notification.requestPermission();
}

/** 显示系统通知（仅在已授权时生效，失败时静默忽略） */
export function showNotification(title: string, body: string): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }
  try {
    new Notification(title, {
      body,
      icon: '/icons/icon-192.svg',
      tag: `schedule-reminder-${Date.now()}`,
    });
  } catch {
    // 部分移动端浏览器不允许脚本直接构造通知，静默忽略，弹窗提醒仍然可用。
  }
}
