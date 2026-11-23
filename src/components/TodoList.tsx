import type { ReactElement } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import type { Todo } from '../types';
import { formatDate, formatDuration } from '../utils/time';

interface TodoListProps {
  todos: Todo[];
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

const PRIORITY_LABEL: Record<Todo['priority'], string> = { 1: '高', 2: '中', 3: '低' };
const PRIORITY_COLOR: Record<Todo['priority'], 'error' | 'warning' | 'info'> = {
  1: 'error',
  2: 'warning',
  3: 'info',
};

/** 待办列表：未完成优先、优先级高优先、截止日期早优先 */
export default function TodoList({ todos, onEdit, onDelete, onToggle }: TodoListProps): ReactElement {
  const sorted = [...todos].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
  });

  const todayKey = formatDate(new Date());

  return (
    <Box>
      {sorted.map((todo) => {
        const overdue = !todo.completed && Boolean(todo.dueDate) && todo.dueDate < todayKey;
        return (
          <Card key={todo.id} sx={{ mb: 1.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 1.5, gap: 1 }}>
              <Checkbox
                size="small"
                checked={todo.completed}
                onChange={() => onToggle(todo.id)}
                inputProps={{ 'aria-label': `完成 ${todo.title}` }}
                sx={{ mt: -0.25 }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  sx={{
                    wordBreak: 'break-all',
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    color: todo.completed ? 'text.disabled' : 'text.primary',
                  }}
                >
                  {todo.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mt: 0.5 }}>
                  <Chip
                    size="small"
                    label={`优先级${PRIORITY_LABEL[todo.priority]}`}
                    color={PRIORITY_COLOR[todo.priority]}
                    variant="outlined"
                    sx={{ height: 22, fontSize: 11 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    预计 {formatDuration(todo.durationMinutes)}
                  </Typography>
                  <Typography variant="caption" color={overdue ? 'error' : 'text.secondary'}>
                    {todo.dueDate ? `截止 ${todo.dueDate}` : '无截止日'}
                    {overdue ? '（已逾期）' : ''}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                  <Button size="small" onClick={() => onEdit(todo)}>
                    编辑
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      if (window.confirm(`确定删除待办「${todo.title}」吗？`)) {
                        onDelete(todo.id);
                      }
                    }}
                  >
                    删除
                  </Button>
                </Box>
              </Box>
            </Box>
          </Card>
        );
      })}
    </Box>
  );
}
