# 个人课表计划（Schedule App）

一款移动端优先的「个人课表计划」应用：截图 OCR 导入课表、自动生成今日计划、课前提醒、完成打卡与学习统计。

当前交付形态为 **PWA 移动 Web 应用**（可添加到主屏幕全屏运行），并附 **Capacitor 配置**，可自行打包为 Android / iOS 原生 App。

## 功能

- **课表管理**：手动新增/编辑/删除课程（星期、节次范围、地点、教师、单双周、颜色），按星期分组展示。
- **截图 OCR 导入**：浏览器端 tesseract.js 识别中文课表截图（chi_sim），解析为结构化课程；提供识别原文 + 结构化编辑表格，失败行可手动转换/新增，作为 OCR 纠错兜底。
- **自定义作息时间**：编辑每一节课的起止时间；时间轴、排程、统计均按最新作息计算。
- **今日计划**：按时间排序展示当天课程；待办按「优先级 → 截止日 → 创建时间」贪心填入空闲时段，放不下的待办给出明确提示。
- **待办管理**：标题、预计时长、截止日、优先级、完成状态；支持筛选未完成/全部。
- **课前提醒**：提前 N 分钟（可配置）触发浏览器 Notification 与应用内弹窗，可分别开关。
- **完成打卡与统计**：今日完成率环形图、连续打卡天数、本周学习时长柱状图、待办完成进度。
- **示例数据**：首次打开可在空状态一键载入示例课表与待办。
- **本地持久化**：所有数据保存在浏览器 localStorage，存储逻辑统一封装在 `src/storage/db.ts`。

## 运行

```bash
cd schedule-app
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`，按 F12 打开开发者工具，切换到手机模拟视图体验最佳。

生产构建：

```bash
npm run build     # tsc 类型检查 + vite 构建，输出到 dist/
npm run preview   # 本地预览构建产物
```

## 添加到主屏幕（PWA）

1. 用手机浏览器访问已部署的 HTTPS 地址（PWA 要求 HTTPS，localhost 除外）。
2. Android Chrome：菜单 → 「添加到主屏幕」/「安装应用」。
3. iOS Safari：分享 → 「添加到主屏幕」。

应用包含 `manifest`（名称、主题色 `#0f766e`、`display: standalone`、SVG 图标）与 Service Worker，安装后可离线打开。图标目前使用 SVG；若目标平台要求 PNG 图标，可自行用设计工具导出 192/512 PNG 并更新 `vite.config.ts` 的 manifest 配置。

## 打包为 Android APK

**推荐：云端自动打包（无需本机安装 Java / Android Studio）**。项目已配置 GitHub Actions，把代码推到 GitHub 后自动产出 APK，详见 **[打包APK指南.md](./打包APK指南.md)**。简要流程：

1. 在 GitHub 新建空仓库，把本项目 `git init` / `git add .` / `git commit` / `git push` 上去
2. 打开仓库的 **Actions** 页，等待 **Build Android APK** 任务变绿
3. 在任务详情页 **Artifacts** 下载 `个人课表计划-APK`，解压得到 `personal-schedule.apk`
4. 传到手机点击安装（需允许"未知来源"）

以后改代码只要 `git push`，会自动重新构建 APK。

## Capacitor 打包原生 App（本地方式）

项目已包含 `capacitor.config.ts` 与依赖脚本：

```bash
npm install
npm run cap:add:android   # 构建并添加 Android 工程
npm run cap:add:ios       # 构建并添加 iOS 工程（需 macOS + Xcode）
npm run cap:sync          # 代码更新后同步到原生工程
```

添加原生平台后，用 Android Studio / Xcode 打开生成的 `android/` 或 `ios/` 目录进行签名与打包。注意：原生 WebView 中的通知能力与浏览器 Notification API 不同，如需原生本地通知，可后续接入 `@capacitor/local-notifications` 并在 `src/utils/notification.ts` 中适配。

## OCR 说明与局限

- 识别在设备本地进行，不上传图片；首次使用需联网下载 `chi_sim` 语言包（约数十 MB）。
- tesseract.js 对**表格线、倾斜、复杂背景、手写体**的识别效果有限，经常出现错字、漏行、列错位。
- 因此识别结果**必须经过人工校对**：界面同时显示识别原文和可编辑的结构化表格，支持逐项修改、删除、把未解析行转为课程、手动新增。
- 常见可解析格式示例：`周一 第1-2节 高等数学 主教101 张老师`、`星期三 3-4节 大学英语 A302 李老师`；其他格式会保留原文供手动处理。

## 提醒的局限

浏览器在页面关闭/进入后台后，JS 定时器和 Notification 触发**不可靠**（尤其 iOS）——这是 Web 平台限制。应用保持打开时会每 30 秒检查一次即将开始的课程，同一次课当天只提醒一次。建议同时开启「系统通知提醒」与「应用内弹窗提醒」，并保持应用在前台。原生打包后可接入 Capacitor 本地通知来解决后台提醒问题。

## 目录结构

```text
src/
  App.tsx                  应用入口与全局提醒
  theme.ts                 MUI 主题
  types.ts                 数据模型
  storage/                 localStorage 封装、订阅与 React Context
  utils/                   OCR 解析、排程算法、时间工具、通知
  components/              导航、列表/编辑器、导入、时间轴、统计、设置、提醒弹窗
  pages/                   今日 / 课表 / 待办 / 统计 / 设置
```

## 数据模型要点

- `Course.weeks`：生效周次数组，空数组表示每周，已预留单双周扩展。
- `BellSchedule.slots`：可编辑的节次时间表，兜底为 08:00 起每节 45 分钟、课间 10 分钟。
- `Todo.durationMinutes` + `priority` + `dueDate`：排程算法的输入。
- `DailyPlan.items`：今日时间轴项目；`DailyPlan.unscheduled`：未排入的待办及原因。
- 数据版本键：`personal-schedule-app-v1`。

## 已知局限

- PWA 图标为 SVG，个别旧版浏览器/系统可能回退到默认图标。
- 完成率按「当天有课 + 当天到期/完成的待办」计算，不含未到期待办。
- 统计的连续打卡按自然日计算，不含教学周概念。
- 所有数据仅存本机浏览器，清除浏览器数据会丢失内容；暂无云同步。
