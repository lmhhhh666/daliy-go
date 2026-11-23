# 个人课表计划 · 云端打包 APK 操作指南

本指南用 **GitHub Actions** 在云端免费编译 APK。你的电脑**不需要安装 Java、Android Studio 或 Android SDK**——只需要把代码推到 GitHub，云端自动产出 APK，下载后传到手机即可安装。

---

## 一、准备工作

1. 一个 GitHub 账号（免费即可）：https://github.com/signup
2. 本机安装 Git：https://git-scm.com/download/win（若已装可跳过）

---

## 二、第一次：把代码推到 GitHub

### 1. 在 GitHub 上新建一个空仓库

- 打开 https://github.com/new
- Repository name 填：`personal-schedule`（或任意名字）
- **不要**勾选 "Add a README file"、".gitignore"、"license"（保持空仓库）
- 点 **Create repository**

### 2. 在本机项目目录执行推送命令

在 `schedule-app` 目录下打开 Git Bash，依次执行（把 `你的用户名` 换成你的 GitHub 用户名）：

```bash
cd "C:/Users/HL/WorkBuddy/2026-11-23-20-21-22/schedule-app"

git init
git add .
git commit -m "个人课表计划初始版本"

# 关联远端仓库（注意替换成你自己的用户名和仓库名）
git remote add origin https://github.com/你的用户名/personal-schedule.git

# 推送到 main 分支
git branch -M main
git push -u origin main
```

> 推送时 GitHub 会弹出登录窗口（或要求 Personal Access Token），按提示登录即可。
> 若提示 token：GitHub → Settings → Developer settings → Personal access tokens → Tokens(classic) → 勾选 `repo` 权限生成，把它当密码输入。

### 3. 等待自动构建

- 打开你的仓库页面，点击顶部 **Actions** 标签
- 左侧选中 **Build Android APK**，右侧会看到一次正在运行（黄色圆圈）或已完成（绿色对勾）的任务
- 点击这次任务进入详情，等待所有步骤变绿（首次约 5–10 分钟）

### 4. 下载 APK

在任务详情页最下方 **Artifacts** 区域，找到 **个人课表计划-APK**，点击下载得到 zip，解压后就是 `personal-schedule.apk`。

---

## 三、安装到手机

1. 把 `personal-schedule.apk` 传到手机（微信文件传输助手、QQ、数据线、网盘均可）
2. 手机上点击该文件
3. 系统提示"未知来源应用"时，选择**允许安装**（设置 → 安全 → 允许安装未知应用）
4. 安装完成，桌面出现「个人课表计划」图标，打开即用

---

## 四、以后改了代码怎么更新 APK

修改代码后，在项目目录执行：

```bash
git add .
git commit -m "描述你改了什么"
git push
```

push 后 Actions 会自动重新构建，几分钟后到 Actions 页面下载新的 APK 即可。

也可以手动触发：Actions → Build Android APK → **Run workflow** → 绿色按钮。

---

## 五、遇到问题怎么办

| 现象 | 原因 | 处理 |
|---|---|---|
| Actions 里任务红色失败 | 点进去看报错步骤 | 常见是依赖下载超时，手动 Run workflow 重试一次 |
| 下载不了 Artifacts | 未登录 GitHub | 登录后重试，或换浏览器 |
| 手机无法安装 | 未开启未知来源 | 设置里允许该安装来源；部分机型需关闭"纯净模式" |
| 安装后打不开 | 手机系统版本过低 | 应用要求 Android 5.1（API 22）以上 |
| push 要求 token | GitHub 已停用密码登录 | 按上文生成 Personal Access Token |

---

## 六、可选：个性化设置

打包前可按需修改 `capacitor.config.ts`：

```ts
appId: 'com.workbuddy.scheduleplan',  // 应用唯一标识，改成 com.你的名字.课表
appName: '个人课表计划',               // 手机桌面显示的名称
```

改完后正常 push 即可自动生效。

---

## 七、关于提醒的重要说明

APK 内使用的是浏览器通知 API，**应用关闭或退到后台后提醒不可靠**。若你很依赖课前提醒，可后续接入 `@capacitor/local-notifications` 插件实现真正的系统级本地通知——告诉我，我可以帮你改好。
