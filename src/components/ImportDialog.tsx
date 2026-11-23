import { useRef, useState, type ChangeEvent, type ReactElement } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ImageIcon from '@mui/icons-material/Image';
import type { Course, Weekday } from '../types';
import { createId } from '../storage/db';
import { parseCourseLines, recognizeScheduleImage, type CourseDraft } from '../utils/ocr';
import { WEEKDAY_LABELS, WEEKDAY_ORDER } from '../utils/time';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (courses: Course[]) => void;
}

const COLORS = ['#0ea5e9', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e', '#6366f1', '#ec4899'];

/** 截图 OCR 导入弹窗：上传 -> 识别 -> 原文校对 -> 结构化导入 */
export default function ImportDialog({ open, onClose, onImport }: ImportDialogProps): ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [lines, setLines] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<CourseDraft[]>([]);
  const [unmatched, setUnmatched] = useState<string[]>([]);
  const [recognizing, setRecognizing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  function reset(): void {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setFile(null);
    setLines([]);
    setDrafts([]);
    setUnmatched([]);
    setRecognizing(false);
    setProgress(0);
    setStatus('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleClose(): void {
    reset();
    onClose();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const selected = event.target.files?.[0] ?? null;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(selected);
    setPreviewUrl(selected ? URL.createObjectURL(selected) : '');
    setDrafts([]);
    setUnmatched([]);
    setLines([]);
    setError('');
    setStatus(selected ? '已选择截图，点击「开始识别」' : '');
  }

  async function handleRecognize(): Promise<void> {
    if (!file || recognizing) {
      return;
    }
    setRecognizing(true);
    setError('');
    setDrafts([]);
    setUnmatched([]);
    try {
      const recognizedLines = await recognizeScheduleImage(file, (percent, label) => {
        setProgress(percent);
        setStatus(label);
      });
      const parsed = parseCourseLines(recognizedLines);
      setLines(recognizedLines);
      setDrafts(parsed.drafts);
      setUnmatched(parsed.unmatched);
      setStatus(`识别完成：${parsed.drafts.length} 行成功解析，${parsed.unmatched.length} 行需手动处理`);
    } catch (caught) {
      setError(`识别失败：${caught instanceof Error ? caught.message : String(caught)}`);
    } finally {
      setRecognizing(false);
    }
  }

  function updateDraft(id: string, patch: Partial<CourseDraft>): void {
    setDrafts((current) => current.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));
  }

  function addDraft(name: string, raw: string): void {
    setDrafts((current) => [
      ...current,
      {
        id: `draft-${Date.now()}-${current.length}`,
        name,
        weekday: 1,
        startPeriod: 1,
        endPeriod: 2,
        location: '',
        teacher: '',
        weeks: [],
        raw,
      },
    ]);
  }

  function handleImport(): void {
    const courses: Course[] = drafts
      .filter((draft) => draft.name.trim() && draft.endPeriod >= draft.startPeriod)
      .map((draft, index) => ({
        id: createId('course'),
        name: draft.name.trim(),
        weekday: draft.weekday,
        startPeriod: Math.max(1, Math.round(draft.startPeriod)),
        endPeriod: Math.max(1, Math.round(draft.endPeriod)),
        location: draft.location.trim(),
        teacher: draft.teacher.trim(),
        weeks: draft.weeks,
        color: COLORS[index % COLORS.length],
        completedDates: [],
      }));
    if (courses.length === 0) {
      return;
    }
    onImport(courses);
    reset();
  }

  const importableCount = drafts.filter(
    (draft) => draft.name.trim() && draft.endPeriod >= draft.startPeriod,
  ).length;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle sx={{ fontWeight: 700 }}>截图识别导入课表</DialogTitle>
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 2 }}>
          首次识别需要联网下载中文语言包。OCR 对表格识别可能出错，请在下方逐行校正后再导入。
        </Alert>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />
        <Button
          variant="outlined"
          startIcon={<ImageIcon />}
          onClick={() => fileInputRef.current?.click()}
          fullWidth
        >
          {file ? '重新选择截图' : '选择课表截图'}
        </Button>
        {file ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {file.name}
          </Typography>
        ) : null}
        {previewUrl ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
            <Box
              component="img"
              src={previewUrl}
              alt="课表截图预览"
              sx={{ maxHeight: 180, maxWidth: '100%', borderRadius: 2 }}
            />
          </Box>
        ) : null}

        <Button
          variant="contained"
          onClick={handleRecognize}
          disabled={!file || recognizing}
          fullWidth
          sx={{ mt: 2 }}
        >
          {recognizing ? '识别中…' : '开始识别'}
        </Button>
        {recognizing ? (
          <Box sx={{ mt: 1.5 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" color="text.secondary">
              {status} {progress}%
            </Typography>
          </Box>
        ) : status ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {status}
          </Typography>
        ) : null}
        {error ? (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            {error}
          </Alert>
        ) : null}

        {lines.length > 0 ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              识别原文（{lines.length} 行）
            </Typography>
            <Box
              sx={{
                maxHeight: 110,
                overflowY: 'auto',
                bgcolor: '#f8fafc',
                borderRadius: 2,
                p: 1.25,
              }}
            >
              {lines.map((line, index) => (
                <Typography key={`${line}-${index}`} variant="caption" component="div">
                  {index + 1}. {line}
                </Typography>
              ))}
            </Box>
          </Box>
        ) : null}

        {drafts.length > 0 ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              结构化结果（可直接修改）
            </Typography>
            {drafts.map((draft, index) => (
              <Card key={draft.id} variant="outlined" sx={{ p: 1.5, mb: 1.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    第 {index + 1} 项
                  </Typography>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="删除该项"
                    onClick={() => setDrafts((current) => current.filter((item) => item.id !== draft.id))}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <TextField
                    label="课程名称"
                    size="small"
                    value={draft.name}
                    onChange={(event) => updateDraft(draft.id, { name: event.target.value })}
                    fullWidth
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      select
                      label="星期"
                      size="small"
                      value={draft.weekday}
                      onChange={(event) =>
                        updateDraft(draft.id, { weekday: Number(event.target.value) as Weekday })
                      }
                      sx={{ width: 110 }}
                    >
                      {WEEKDAY_ORDER.map((day) => (
                        <MenuItem key={day} value={day}>
                          {WEEKDAY_LABELS[day]}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="开始节"
                      type="number"
                      size="small"
                      value={draft.startPeriod}
                      onChange={(event) =>
                        updateDraft(draft.id, { startPeriod: Number(event.target.value) })
                      }
                      inputProps={{ min: 1, max: 20 }}
                      fullWidth
                    />
                    <TextField
                      label="结束节"
                      type="number"
                      size="small"
                      value={draft.endPeriod}
                      onChange={(event) =>
                        updateDraft(draft.id, { endPeriod: Number(event.target.value) })
                      }
                      inputProps={{ min: 1, max: 20 }}
                      fullWidth
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      label="地点"
                      size="small"
                      value={draft.location}
                      onChange={(event) => updateDraft(draft.id, { location: event.target.value })}
                      fullWidth
                    />
                    <TextField
                      label="教师"
                      size="small"
                      value={draft.teacher}
                      onChange={(event) => updateDraft(draft.id, { teacher: event.target.value })}
                      fullWidth
                    />
                  </Box>
                  <TextField
                    label="周次（留空=每周）"
                    size="small"
                    value={draft.weeks.join(',')}
                    onChange={(event) => {
                      const weeks = (event.target.value.match(/\d+/g) ?? [])
                        .map(Number)
                        .filter((week) => week >= 1 && week <= 30);
                      updateDraft(draft.id, { weeks });
                    }}
                    fullWidth
                  />
                  <Typography variant="caption" color="text.secondary">
                    原文：{draft.raw}
                  </Typography>
                </Box>
              </Card>
            ))}
          </Box>
        ) : null}

        {unmatched.length > 0 ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              未能自动解析的行（可手动转为课程）
            </Typography>
            {unmatched.map((line, index) => (
              <Box
                key={`${line}-${index}`}
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                  {line}
                </Typography>
                <Button size="small" onClick={() => {
                  addDraft(line, line);
                  setUnmatched((current) => current.filter((_, itemIndex) => itemIndex !== index));
                }}>
                  转为课程
                </Button>
              </Box>
            ))}
          </Box>
        ) : null}

        {lines.length > 0 ? (
          <Button variant="outlined" onClick={() => addDraft('新课程', '手动添加')} fullWidth sx={{ mt: 2 }}>
            手动添加一项
          </Button>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>取消</Button>
        <Button onClick={handleImport} variant="contained" disabled={importableCount === 0}>
          导入 {importableCount} 门课程
        </Button>
      </DialogActions>
    </Dialog>
  );
}
