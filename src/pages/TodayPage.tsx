import { useMemo, useState, type ReactElement } from 'react';
import Box from '@mui/material/Box';
import TodayPlan from '../components/TodayPlan';
import TodoEditor from '../components/TodoEditor';
import { useAppData } from '../storage/AppDataContext';
import { db } from '../storage/db';
import { buildDailyPlan } from '../utils/scheduler';
import type { Todo } from '../types';

/** 今日页：课程时间轴 + 自动排程结果 */
export default function TodayPage(): ReactElement {
  const data = useAppData();
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const plan = useMemo(
    () =>
      buildDailyPlan(
        new Date(),
        data.courses,
        data.todos,
        data.bellSchedule,
        data.settings,
      ),
    [data],
  );

  function openAddTodo(): void {
    setEditingTodo(null);
    setEditorOpen(true);
  }

  return (
    <Box sx={{ p: 2 }}>
      <TodayPlan
        plan={plan}
        isEmpty={data.courses.length === 0 && data.todos.length === 0}
        onToggleCourse={(courseId, date) => db.toggleCourseCompletion(courseId, date)}
        onToggleTodo={(todoId) => db.toggleTodo(todoId)}
        onAddTodo={openAddTodo}
        onLoadSample={() => db.loadSampleData()}
      />
      <TodoEditor
        open={editorOpen}
        todo={editingTodo}
        onClose={() => setEditorOpen(false)}
        onSave={(todo) => {
          if (editingTodo) {
            db.updateTodo(todo.id, todo);
          } else {
            db.addTodo(todo);
          }
          setEditorOpen(false);
        }}
      />
    </Box>
  );
}
