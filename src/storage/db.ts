import type { AppData, BellSchedule, Course, Todo, AppSettings } from '../types';
import { addDays, addMinutes, formatDate } from '../utils/time';

/** localStorage 键名 */
export const STORAGE_KEY = 'personal-schedule-app-v1';

/** 生成唯一 ID */
export function createId(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 默认作息时间表：10 节课 */
export function createDefaultBellSchedule(): BellSchedule {
  const times: Array<[string, string]> = [
    ['08:00', '08:45'],
    ['08:55', '09:40'],
    ['10:00', '10:45'],
    ['10:55', '11:40'],
    ['14:00', '14:45'],
    ['14:55', '15:40'],
    ['16:00', '16:45'],
    ['16:55', '17:40'],
    ['19:00', '19:45'],
    ['19:55', '20:40'],
  ];
  return {
    slots: times.map(([startTime, endTime], index) => ({
      period: index + 1,
      startTime,
      endTime,
    })),
  };
}

/** 默认设置 */
function createDefaultSettings(): AppSettings {
  return {
    reminderMinutes: 15,
    notificationsEnabled: false,
    dialogReminderEnabled: true,
    semesterStart: '',
    weekNumber: 1,
  };
}

/** 空白数据 */
function createEmptyData(): AppData {
  return {
    version: 1,
    courses: [],
    todos: [],
    bellSchedule: createDefaultBellSchedule(),
    settings: createDefaultSettings(),
  };
}

/** 示例课表与待办，用于空状态一键体验 */
export function createSampleData(): AppData {
  const today = new Date();
  const isoNow = new Date().toISOString();
  const course = (
    id: string,
    name: string,
    weekday: Course['weekday'],
    startPeriod: number,
    endPeriod: number,
    location: string,
    teacher: string,
    color: string,
  ): Course => ({
    id,
    name,
    weekday,
    startPeriod,
    endPeriod,
    location,
    teacher,
    weeks: [],
    color,
    completedDates: [],
  });

  const todo = (
    id: string,
    title: string,
    durationMinutes: number,
    dayOffset: number,
    priority: Todo['priority'],
    completed = false,
  ): Todo => ({
    id,
    title,
    durationMinutes,
    dueDate: formatDate(addDays(today, dayOffset)),
    priority,
    completed,
    completedAt: completed ? isoNow : '',
    createdAt: isoNow,
  });

  const courses: Course[] = [
    course('sample-1', '高等数学', 1, 1, 2, '主教101', '张老师', '#0ea5e9'),
    course('sample-2', '大学英语', 1, 5, 6, '文科楼302', '李老师', '#8b5cf6'),
    course('sample-3', '数据结构', 2, 3, 4, '信息楼205', '王老师', '#14b8a6'),
    course('sample-4', '线性代数', 3, 1, 2, '主教207', '陈老师', '#f59e0b'),
    course('sample-5', '计算机网络', 4, 5, 6, '信息楼401', '刘老师', '#ef4444'),
    course('sample-6', '体育', 5, 7, 8, '操场', '赵老师', '#22c55e'),
    course('sample-7', '数据结构实验', 5, 3, 4, '实验楼B203', '王老师', '#6366f1'),
  ];

  const todos: Todo[] = [
    todo('sample-todo-1', '复习高数第三章', 60, 0, 1),
    todo('sample-todo-2', '完成数据结构作业', 90, 1, 2),
    todo('sample-todo-3', '背英语单词', 30, 2, 3),
    todo('sample-todo-4', '整理课堂笔记', 40, 0, 3, true),
  ];

  return {
    version: 1,
    courses,
    todos,
    bellSchedule: createDefaultBellSchedule(),
    settings: createDefaultSettings(),
  };
}

/** 读取并校验存储数据，损坏时回退到空白数据 */
function loadStoredData(): AppData {
  if (typeof localStorage === 'undefined') {
    return createEmptyData();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyData();
    }
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      version: 1,
      courses: Array.isArray(parsed.courses) ? parsed.courses : [],
      todos: Array.isArray(parsed.todos) ? parsed.todos : [],
      bellSchedule:
        parsed.bellSchedule && Array.isArray(parsed.bellSchedule.slots) && parsed.bellSchedule.slots.length > 0
          ? parsed.bellSchedule
          : createDefaultBellSchedule(),
      settings: { ...createDefaultSettings(), ...(parsed.settings ?? {}) },
    };
  } catch (error) {
    console.warn('读取本地数据失败，已使用空白数据', error);
    return createEmptyData();
  }
}

/** 内存缓存，保证所有页面共享同一份数据 */
let cache: AppData = loadStoredData();

/** 订阅者列表 */
const listeners = new Set<() => void>();

/** 获取当前数据快照（引用稳定，可用于 useSyncExternalStore） */
export function getAppData(): AppData {
  return cache;
}

/** 订阅数据变化，返回取消订阅函数 */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 提交数据变更：写入 localStorage 并通知订阅者 */
function commit(next: AppData): void {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('保存本地数据失败', error);
  }
  listeners.forEach((listener) => listener());
}

/** 数据存储操作集合（所有读写都通过这里，避免散落在组件中） */
export const db = {
  /** 新增课程 */
  addCourse(course: Course): void {
    commit({ ...cache, courses: [...cache.courses, course] });
  },

  /** 更新课程字段 */
  updateCourse(id: string, patch: Partial<Course>): void {
    commit({
      ...cache,
      courses: cache.courses.map((course) => (course.id === id ? { ...course, ...patch } : course)),
    });
  },

  /** 删除课程 */
  deleteCourse(id: string): void {
    commit({ ...cache, courses: cache.courses.filter((course) => course.id !== id) });
  },

  /** 切换某门课程在某天的完成打卡 */
  toggleCourseCompletion(id: string, date: string): void {
    commit({
      ...cache,
      courses: cache.courses.map((course) => {
        if (course.id !== id) {
          return course;
        }
        const completedDates = course.completedDates.includes(date)
          ? course.completedDates.filter((item) => item !== date)
          : [...course.completedDates, date];
        return { ...course, completedDates };
      }),
    });
  },

  /** 批量导入课程（OCR 场景） */
  addCourses(courses: Course[]): void {
    commit({ ...cache, courses: [...cache.courses, ...courses] });
  },

  /** 新增待办 */
  addTodo(todo: Todo): void {
    commit({ ...cache, todos: [...cache.todos, todo] });
  },

  /** 更新待办字段 */
  updateTodo(id: string, patch: Partial<Todo>): void {
    commit({
      ...cache,
      todos: cache.todos.map((todo) => (todo.id === id ? { ...todo, ...patch } : todo)),
    });
  },

  /** 切换待办完成状态 */
  toggleTodo(id: string): void {
    commit({
      ...cache,
      todos: cache.todos.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              completed: !todo.completed,
              completedAt: todo.completed ? '' : new Date().toISOString(),
            }
          : todo,
      ),
    });
  },

  /** 删除待办 */
  deleteTodo(id: string): void {
    commit({ ...cache, todos: cache.todos.filter((todo) => todo.id !== id) });
  },

  /** 保存整份作息时间表 */
  setBellSchedule(bellSchedule: BellSchedule): void {
    commit({ ...cache, bellSchedule });
  },

  /** 更新单节课时间 */
  updateBellSlot(period: number, patch: Partial<BellSchedule['slots'][number]>): void {
    commit({
      ...cache,
      bellSchedule: {
        slots: cache.bellSchedule.slots.map((slot) =>
          slot.period === period ? { ...slot, ...patch } : slot,
        ),
      },
    });
  },

  /** 添加一节课到作息表 */
  addBellSlot(): void {
    const periods = cache.bellSchedule.slots.map((slot) => slot.period);
    const nextPeriod = periods.length > 0 ? Math.max(...periods) + 1 : 1;
    const last = cache.bellSchedule.slots[cache.bellSchedule.slots.length - 1];
    const startTime = last ? addMinutes(last.endTime, 10) : '08:00';
    const endTime = addMinutes(startTime, 45);
    commit({
      ...cache,
      bellSchedule: {
        slots: [...cache.bellSchedule.slots, { period: nextPeriod, startTime, endTime }],
      },
    });
  },

  /** 删除一节课时间设置 */
  deleteBellSlot(period: number): void {
    commit({
      ...cache,
      bellSchedule: {
        slots: cache.bellSchedule.slots.filter((slot) => slot.period !== period),
      },
    });
  },

  /** 更新设置 */
  updateSettings(patch: Partial<AppSettings>): void {
    commit({ ...cache, settings: { ...cache.settings, ...patch } });
  },

  /** 载入示例数据（替换当前数据） */
  loadSampleData(): void {
    commit(createSampleData());
  },

  /** 清空全部数据并恢复默认设置 */
  resetAll(): void {
    commit(createEmptyData());
  },

  /** 仅清空课程 */
  clearCourses(): void {
    commit({ ...cache, courses: [] });
  },

  /** 仅清空待办 */
  clearTodos(): void {
    commit({ ...cache, todos: [] });
  },
};
