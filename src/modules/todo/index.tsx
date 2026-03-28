import { CheckSquare } from 'lucide-react'
import type { TabConfig } from '../../core/tabs'
import { TodoModule } from './components/TodoModule'

export const todoTab: TabConfig = {
  id: 'todo',
  label: 'To-do',
  icon: CheckSquare,
  component: TodoModule,
}
