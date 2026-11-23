import { useState, type ReactElement } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BellScheduleEditor from '../components/BellScheduleEditor';
import CourseEditor from '../components/CourseEditor';
import CourseList from '../components/CourseList';
import ImportDialog from '../components/ImportDialog';
import { useAppData } from '../storage/AppDataContext';
import { db } from '../storage/db';
import { formatDate } from '../utils/time';
import type { Course } from '../types';

/** 课表页：导入、增删改课程与作息设置 */
export default function SchedulePage(): ReactElement {
  const data = useAppData();
  const [importOpen, setImportOpen] = useState<boolean>(false);
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [bellEditorOpen, setBellEditorOpen] = useState<boolean>(false);

  function openAddCourse(): void {
    setEditingCourse(null);
    setEditorOpen(true);
  }

  function openEditCourse(course: Course): void {
    setEditingCourse(course);
    setEditorOpen(true);
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1.5 }}>
        我的课表
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<PhotoCameraIcon />}
          onClick={() => setImportOpen(true)}
          sx={{ flex: '1 1 140px' }}
        >
          截图导入
        </Button>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={openAddCourse}
          sx={{ flex: '1 1 120px' }}
        >
          添加课程
        </Button>
        <Button
          variant="outlined"
          startIcon={<AccessTimeIcon />}
          onClick={() => setBellEditorOpen(true)}
          sx={{ flex: '1 1 120px' }}
        >
          作息时间
        </Button>
      </Box>

      {data.courses.length === 0 ? (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            课表还是空的
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            可以上传课表截图自动识别，或直接添加课程；也可以载入示例数据体验。
          </Typography>
          <Button variant="contained" onClick={() => db.loadSampleData()}>
            载入示例课表
          </Button>
        </Card>
      ) : (
        <CourseList
          courses={data.courses}
          bellSchedule={data.bellSchedule}
          completionDate={formatDate(new Date())}
          onEdit={openEditCourse}
          onDelete={(id) => db.deleteCourse(id)}
          onToggleComplete={(id, date) => db.toggleCourseCompletion(id, date)}
        />
      )}

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={(courses) => db.addCourses(courses)}
      />
      <CourseEditor
        open={editorOpen}
        course={editingCourse}
        bellSchedule={data.bellSchedule}
        onClose={() => setEditorOpen(false)}
        onSave={(course) => {
          if (editingCourse) {
            db.updateCourse(course.id, course);
          } else {
            db.addCourse(course);
          }
          setEditorOpen(false);
        }}
      />
      <BellScheduleEditor
        open={bellEditorOpen}
        value={data.bellSchedule}
        onClose={() => setBellEditorOpen(false)}
        onSave={(value) => {
          db.setBellSchedule(value);
          setBellEditorOpen(false);
        }}
      />
    </Box>
  );
}
