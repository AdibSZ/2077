import { Task, UserProfile } from '../../types';
import { STORAGE_KEYS, INITIAL_TASKS } from './storageKeys';
import { StorageVault } from './vault';

export class TaskService {
  private tasks: Task[];

  constructor() {
    this.tasks = StorageVault.getItem<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  }

  getTasks(): Task[] {
    this.tasks = StorageVault.getItem<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    return [...this.tasks];
  }

  getUserTasks(userId: string, isAdmin: boolean): Task[] {
    const all = this.getTasks();
    if (isAdmin) {
      return all;
    }
    return all.filter((t) => t.isGlobal || t.assignedToId === 'ALL' || t.assignedToId === userId);
  }

  async addTask(
    task: Omit<Task, 'id' | 'createdAt' | 'isCompleted'> & { id?: string; isCompleted?: boolean }
  ): Promise<Task> {
    this.tasks = this.getTasks();
    const newTask: Task = {
      ...task,
      id: task.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      isCompleted: Boolean(task.isCompleted),
      createdAt: new Date().toISOString(),
    };

    this.tasks.unshift(newTask);
    this.saveTasksLocally();
    return newTask;
  }

  async toggleTaskCompleted(taskId: string, user: UserProfile): Promise<Task | null> {
    this.tasks = this.getTasks();
    const index = this.tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return null;

    const task = this.tasks[index];

    // Role-based authorization:
    // Global tasks can ONLY be toggled by Managers
    if (task.isGlobal || task.assignedToId === 'ALL') {
      if (!user.isAdmin) {
        throw new Error('فقط مدیران سیستم امکان تغییر وضعیت تسک‌های همگانی را دارند.');
      }
    } else {
      // Personal task: can be toggled by the assigned person or any admin
      if (!user.isAdmin && task.assignedToId !== user.id) {
        throw new Error('شما مجاز به تغییر وضعیت تسک اختصاصی سایر پرسنل نیستید.');
      }
    }

    const updated: Task = {
      ...task,
      isCompleted: !task.isCompleted,
      completedAt: !task.isCompleted ? new Date().toISOString() : undefined,
    };

    this.tasks[index] = updated;
    this.saveTasksLocally();
    return updated;
  }

  async deleteTask(taskId: string): Promise<boolean> {
    this.tasks = this.getTasks();
    const prevLength = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== taskId);
    if (this.tasks.length !== prevLength) {
      this.saveTasksLocally();
      return true;
    }
    return false;
  }

  setTasksFromRemote(remoteTasks: Task[]) {
    this.tasks = remoteTasks;
    this.saveTasksLocally();
  }

  private saveTasksLocally() {
    StorageVault.setItem(STORAGE_KEYS.TASKS, this.tasks);
  }
}
