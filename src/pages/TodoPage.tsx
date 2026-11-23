import { useState, type ReactElement } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import TodoEditor from '../components/TodoEditor';
import TodoList from '../components/TodoList';
import { useAppData } from '../storage/AppDataContext';
import { db } from '../storage/db';
import type { Todo } from '../types';

/** 待办页：增删改待办，应用自动把它们排入空闲时段 */
export default function TodoPage(): ReactElement {
  const data = useAppData();
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [filter, setFilter] = useState<'all' | 'active'>('active');

  const visibleTodos =
    filter === 'active' ? data.todos.filter((todo) => !todo.completed) : data.todos;
  const activeCount = data.todos.filter((todo) => !todo.completed).length;

  function openAddTodo(): void {
    setEditingTodo(null);
    setEditorOpen(true);
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 1.5 }}>
        待办任务
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {activeCount} 条未完成 · 系统会按优先级和截止日自动安排到空闲时段
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          size="small"
          onChange={(_event, value: 'all' | 'active' | null) => {
            if (value) {
              setFilter(value);
            }
          }}
          fullWidth
        >
          <ToggleButton value="active">未完成</ToggleButton>
          <ToggleButton value="all">全部</ToggleButton>
        </ToggleButtonGroup>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAddTodo} sx={{ flexShrink: 0 }}>
          新增
        </Button>
      </Box>

      {visibleTodos.length === 0 ? (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {filter === 'active' ? '太棒了，没有未完成的待办！' : '还没有待办，添加一条试试。'}
          </Typography>
          <Button variant="contained" onClick={openAddTodo} sx={{ mt: 2 }}>
            新增待办
          </Button>
        </Card>
      ) : (
        <TodoList
          todos={visibleTodos}
          onEdit={(todo) => {
            setEditingTodo(todo);
            setEditorOpen(true);
          }}
          onDelete={(id) => db.deleteTodo(id)}
          onToggle={(id) => db.toggleTodo(id)}
        />
      )}

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
