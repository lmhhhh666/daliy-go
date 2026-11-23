/**
 * 全局数据模型定义。
 * 所有日期字符串统一使用本地日期格式 yyyy-MM-dd，时间字符串使用 HH:mm（24 小时制）。
 */

/** 底部导航页签 */
export type TabKey = 'today' | 'schedule' | 'todos' | 'stats' | 'settings';

/** 星期：1=周一 ... 7=周日 */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** 待办优先级：1=高，2=中，3=低 */
export type Priority = 1 | 2 | 3;

/** 课程 */
export interface Course {
  id: string;
  name: string;
  weekday: Weekday;
  /** 开始节次（从 1 开始） */
  startPeriod: number;
  /** 结束节次（包含） */
  endPeriod: number;
  location: string;
  teacher: string;
  /** 生效周次；空数组表示每周都上，预留单双周扩展 */
  weeks: number[];
  /** 卡片主题色，十六进制 */
  color: string;
  /** 完成打卡的日期列表 yyyy-MM-dd */
  completedDates: string[];
}

/** 待办任务 */
export interface Todo {
  id: string;
  title: string;
  /** 预计时长（分钟） */
  durationMinutes: number;
  /** 截止日期 yyyy-MM-dd，空字符串表示无截止日 */
  dueDate: string;
  priority: Priority;
  completed: boolean;
  /** 完成时间 ISO 字符串，未完成为空字符串 */
  completedAt: string;
  /** 创建时间 ISO 字符串 */
  createdAt: string;
}

/** 单节课的作息时间 */
export interface BellSlot {
  period: number;
  startTime: string;
  endTime: string;
}

/** 可编辑的作息时间表 */
export interface BellSchedule {
  slots: BellSlot[];
}

/** 今日计划中的一条时间轴项目 */
export interface PlanItem {
  id: string;
  kind: 'course' | 'todo';
  title: string;
  startTime: string;
  endTime: string;
  /** 对应 Course.id 或 Todo.id */
  sourceId: string;
  location?: string;
  teacher?: string;
  color: string;
  /** false 表示待办未能排入空闲时段 */
  scheduled: boolean;
  completed: boolean;
  durationMinutes: number;
}

/** 未能排入的待办及原因 */
export interface UnscheduledTodo {
  todo: Todo;
  reason: string;
}

/** 某一天生成的计划 */
export interface DailyPlan {
  date: string;
  weekday: Weekday;
  weekNumber: number;
  items: PlanItem[];
  unscheduled: UnscheduledTodo[];
  totalStudyMinutes: number;
}

/** 应用设置 */
export interface AppSettings {
  /** 提前多少分钟提醒 */
  reminderMinutes: number;
  notificationsEnabled: boolean;
  dialogReminderEnabled: boolean;
  /** 学期开始日期 yyyy-MM-dd，用于计算教学周；空字符串表示使用手动周次 */
  semesterStart: string;
  /** 手动指定的当前教学周（未设置学期开始日期时生效） */
  weekNumber: number;
}

/** 持久化到 localStorage 的整包数据 */
export interface AppData {
  version: number;
  courses: Course[];
  todos: Todo[];
  bellSchedule: BellSchedule;
  settings: AppSettings;
}
