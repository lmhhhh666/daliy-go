import { createWorker } from 'tesseract.js';
import type { Weekday } from '../types';

/** OCR 后待用户确认/修改的课程草稿 */
export interface CourseDraft {
  id: string;
  name: string;
  weekday: Weekday;
  startPeriod: number;
  endPeriod: number;
  location: string;
  teacher: string;
  weeks: number[];
  /** 对应的识别原文，便于用户核对 */
  raw: string;
}

/** OCR 解析结果：成功结构化的草稿 + 无法识别的原文行 */
export interface OcrParseResult {
  drafts: CourseDraft[];
  unmatched: string[];
}

const CN_DIGITS: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  日: 7,
  天: 7,
};

const WEEKDAY_RE = /(?:周|星期|礼拜)\s*([一二三四五六日天1-7])/u;
const PERIOD_RE = /第?\s*(\d{1,2})\s*(?:[-~—～至到]\s*(\d{1,2}))?\s*节/u;
const RANGE_RE = /(?:^|[\s,，、])(\d{1,2})\s*[-~—～至到]\s*(\d{1,2})(?=[\s,，、]|$)/u;
const TEACHER_RE = /([^\s,，、;；|｜]{1,10}(?:老师|教师|讲师|教授))/u;
const LOCATION_RE = /(主教|东教|西教|南教|北教|教学楼|教室|实验室|图书馆|体育馆|操场|[A-Za-z]?\d{3,4})[^\s,，、;；|｜]*/u;

/** OCR 进度文案映射 */
const STATUS_LABELS: Record<string, string> = {
  'loading tesseract core': '正在加载识别核心…',
  'initializing tesseract': '正在初始化识别引擎…',
  'loading language traineddata': '正在下载中文语言包（首次使用需联网）…',
  'initializing api': '正在准备识别…',
  'recognizing text': '正在识别图片文字…',
};

/**
 * 在浏览器端用 tesseract.js 识别中文课表截图。
 * @param file 用户选择的图片文件
 * @param onProgress 进度回调（0-100 与中文状态说明）
 * @returns 按行切分的识别文本
 */
export async function recognizeScheduleImage(
  file: File,
  onProgress?: (percent: number, label: string) => void,
): Promise<string[]> {
  const worker = await createWorker('chi_sim+eng', 1, {
    logger: (message: { status?: string; progress?: number }) => {
      const status = message.status ?? '';
      const label = STATUS_LABELS[status] ?? '正在处理…';
      const percent = Math.max(0, Math.min(100, Math.round((message.progress ?? 0) * 100)));
      onProgress?.(percent, label);
    },
  });

  try {
    const result = await worker.recognize(file);
    return result.data.text
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } finally {
    await worker.terminate();
  }
}

/** 从一行文本中解析星期 */
function parseWeekday(line: string): Weekday | null {
  const match = WEEKDAY_RE.exec(line);
  if (!match) {
    return null;
  }
  const token = match[1];
  const value = CN_DIGITS[token] ?? Number(token);
  return value >= 1 && value <= 7 ? (value as Weekday) : null;
}

/** 从一行文本中解析节次范围 */
function parsePeriod(line: string): { start: number; end: number } | null {
  const withWord = PERIOD_RE.exec(line);
  const match = withWord ?? RANGE_RE.exec(line);
  if (!match) {
    return null;
  }
  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : start;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < start || end > 20) {
    return null;
  }
  return { start, end };
}

/** 解析单双周标记；未标记时返回空数组（每周生效） */
function parseWeeks(line: string): { weeks: number[]; rest: string } {
  if (/单周|单周次|奇周/u.test(line)) {
    return {
      weeks: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19],
      rest: line.replace(/单周次?|奇周/gu, ' '),
    };
  }
  if (/双周|双周次|偶周/u.test(line)) {
    return {
      weeks: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
      rest: line.replace(/双周次?|偶周/gu, ' '),
    };
  }
  return { weeks: [], rest: line };
}

/** 把一行识别文本结构化为课程草稿；解析失败返回 null */
function parseLineToDraft(line: string, index: number): CourseDraft | null {
  const weekday = parseWeekday(line);
  const period = parsePeriod(line);
  if (weekday === null || period === null) {
    return null;
  }

  const weekInfo = parseWeeks(line);
  let rest = weekInfo.rest
    .replace(/\d{1,2}\s*[-~—～至到]\s*\d{1,2}\s*周/gu, ' ')
    .replace(/第?\s*\d{1,2}\s*周/gu, ' ')
    .replace(WEEKDAY_RE, ' ')
    .replace(PERIOD_RE, ' ')
    .replace(RANGE_RE, ' ');

  // 先剥离教师，再剥离地点，剩下的视为课程名。
  let teacher = '';
  const teacherMatch = TEACHER_RE.exec(rest);
  if (teacherMatch) {
    teacher = teacherMatch[1];
    rest = rest.replace(teacherMatch[1], ' ');
  }

  let location = '';
  const locationMatch = LOCATION_RE.exec(rest);
  if (locationMatch) {
    location = locationMatch[0];
    rest = rest.replace(locationMatch[0], ' ');
  }

  const name = rest
    .split(/[\s,，、;；|｜•·]+/u)
    .map((token) => token.replace(/^[0-9一二三四五六七八九十]+[.、.]?/u, '').trim())
    .filter((token) => token.length > 0)
    .join('')
    .trim();

  return {
    id: `draft-${Date.now()}-${index}`,
    name: name || '未命名课程',
    weekday,
    startPeriod: period.start,
    endPeriod: period.end,
    location,
    teacher,
    weeks: weekInfo.weeks,
    raw: line,
  };
}

/**
 * 将 OCR 文本行解析为课程草稿。
 * 无法解析的行原样返回，供界面展示并允许用户手动转为课程。
 */
export function parseCourseLines(lines: string[]): OcrParseResult {
  const drafts: CourseDraft[] = [];
  const unmatched: string[] = [];

  lines.forEach((line, index) => {
    const clean = line.replace(/\s+/gu, ' ').trim();
    if (!clean) {
      return;
    }
    const draft = parseLineToDraft(clean, index);
    if (draft) {
      drafts.push(draft);
    } else {
      unmatched.push(clean);
    }
  });

  return { drafts, unmatched };
}
