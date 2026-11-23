import { useState, type ReactElement } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import FormControlLabel from '@mui/material/FormControlLabel';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { useAppData } from '../storage/AppDataContext';
import { db } from '../storage/db';
import { isNotificationSupported, requestNotificationPermission } from '../utils/notification';
import { getWeekNumber } from '../utils/time';

interface SettingsViewProps {
  onOpenBellEditor: () => void;
}

/** 设置页：提醒、作息、教学周与数据管理 */
export default function SettingsView({ onOpenBellEditor }: SettingsViewProps): ReactElement {
  const data = useAppData();
  const { settings, bellSchedule, courses, todos } = data;
  const [permissionMessage, setPermissionMessage] = useState<string>('');

  const currentWeek = getWeekNumber(settings.semesterStart, new Date(), settings.weekNumber);

  async function handleNotificationToggle(enabled: boolean): Promise<void> {
    if (!enabled) {
      db.updateSettings({ notificationsEnabled: false });
      setPermissionMessage('已关闭系统通知');
      return;
    }
    if (!isNotificationSupported()) {
      setPermissionMessage('当前浏览器不支持通知 API，可使用弹窗提醒');
      return;
    }
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      db.updateSettings({ notificationsEnabled: true });
      setPermissionMessage('通知权限已开启');
    } else {
      db.updateSettings({ notificationsEnabled: false });
      setPermissionMessage(
        permission === 'denied' ? '通知权限被拒绝，请在浏览器设置中允许' : '未获得通知权限',
      );
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        设置
      </Typography>

      <Card sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          课前提醒
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={settings.notificationsEnabled}
              onChange={(event) => void handleNotificationToggle(event.target.checked)}
              color="primary"
            />
          }
          label="系统通知提醒"
        />
        <FormControlLabel
          control={
            <Switch
              checked={settings.dialogReminderEnabled}
              onChange={(event) =>
                db.updateSettings({ dialogReminderEnabled: event.target.checked })
              }
              color="primary"
            />
          }
          label="应用内弹窗提醒"
        />
        <Box sx={{ px: 1, pt: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            提前提醒时间：{settings.reminderMinutes} 分钟
          </Typography>
          <Slider
            value={settings.reminderMinutes}
            onChange={(_event, value: number | number[]) =>
              db.updateSettings({ reminderMinutes: Array.isArray(value) ? value[0] : value })
            }
            min={5}
            max={60}
            step={5}
            marks
            valueLabelDisplay="auto"
          />
        </Box>
        {permissionMessage ? (
          <Alert severity="info" sx={{ mt: 1 }}>
            {permissionMessage}
          </Alert>
        ) : null}
        <Alert severity="warning" sx={{ mt: 1.5 }}>
          浏览器在页面关闭后无法可靠执行 JS 定时器，因此提醒仅在应用保持打开时生效。
          建议「添加到主屏幕」后使用，并同时开启应用内弹窗提醒。
        </Alert>
      </Card>

      <Card sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <ScheduleIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>
            作息时间表
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          当前共 {bellSchedule.slots.length} 节课，可自定义每节课起止时间。
        </Typography>
        <Button variant="outlined" onClick={onOpenBellEditor} fullWidth>
          编辑作息时间
        </Button>
      </Card>

      <Card sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          教学周
        </Typography>
        <TextField
          label="学期开始日期（周一）"
          type="date"
          value={settings.semesterStart}
          onChange={(event) => db.updateSettings({ semesterStart: event.target.value })}
          InputLabelProps={{ shrink: true }}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="手动指定当前教学周"
          type="number"
          value={settings.weekNumber}
          onChange={(event) =>
            db.updateSettings({ weekNumber: Math.max(1, Number(event.target.value) || 1) })
          }
          disabled={Boolean(settings.semesterStart)}
          helperText={settings.semesterStart ? '已根据学期开始日期自动计算' : '未设置学期开始日期时使用此周次'}
          inputProps={{ min: 1 }}
          fullWidth
        />
        <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
          当前为第 {currentWeek} 教学周
        </Typography>
      </Card>

      <Card sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          数据管理
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          现有 {courses.length} 门课程、{todos.length} 条待办，数据保存在本机浏览器中。
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Button
            variant="contained"
            onClick={() => {
              if (window.confirm('载入示例数据会覆盖当前课程和待办，确定继续吗？')) {
                db.loadSampleData();
              }
            }}
          >
            载入示例课表
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              if (window.confirm('确定清空全部课程吗？')) {
                db.clearCourses();
              }
            }}
          >
            清空课程
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              if (window.confirm('确定清空全部待办吗？')) {
                db.clearTodos();
              }
            }}
          >
            清空待办
          </Button>
          <Button
            color="error"
            variant="outlined"
            onClick={() => {
              if (window.confirm('确定恢复默认设置并清空所有数据吗？此操作不可撤销。')) {
                db.resetAll();
              }
            }}
          >
            恢复默认
          </Button>
        </Box>
      </Card>

      <Card sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          关于
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          这是可添加到主屏幕的 PWA 应用。在浏览器菜单中选择「添加到主屏幕」，即可全屏使用。
        </Typography>
        <Typography variant="body2" color="text.secondary">
          截图识别在设备本地完成，首次使用需联网下载中文语言包；识别结果请务必人工校对。
        </Typography>
      </Card>
    </Box>
  );
}
