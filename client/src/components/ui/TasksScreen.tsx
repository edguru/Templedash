import React, { useState } from 'react';
import { Plus, Calendar, Clock, CheckCircle, Circle, Star, Zap } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  category: string;
}

const TasksScreen: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Bridge tokens to Base Camp',
      description: 'Move USDC from Ethereum to Base Camp testnet for gas fees',
      completed: false,
      priority: 'high',
      dueDate: '2025-08-18',
      category: 'DeFi'
    },
    {
      id: '2',
      title: 'Check NFT marketplace trends',
      description: 'Monitor OpenSea for trending collections and price movements',
      completed: true,
      priority: 'medium',
      category: 'NFTs'
    },
    {
      id: '3',
      title: 'Stake ETH rewards',
      description: 'Compound staking rewards from Lido protocol',
      completed: false,
      priority: 'low',
      dueDate: '2025-08-20',
      category: 'Staking'
    }
  ]);

  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    category: 'General'
  });

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const addTask = () => {
    if (!newTask.title.trim()) return;
    
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      completed: false,
      priority: newTask.priority,
      category: newTask.category
    };
    
    setTasks([task, ...tasks]);
    setNewTask({ title: '', description: '', priority: 'medium', category: 'General' });
    setShowNewTaskForm(false);
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
    }
  };

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks & Automation</h1>
            <p className="text-gray-600 mt-1">Manage your Web3 tasks and automate workflows</p>
          </div>
          <button
            onClick={() => setShowNewTaskForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={20} />
            <span>New Task</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Circle className="text-blue-600" size={20} />
              <span className="text-blue-600 font-semibold">Pending</span>
            </div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{pendingTasks.length}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-green-600 font-semibold">Completed</span>
            </div>
            <div className="text-2xl font-bold text-green-900 mt-1">{completedTasks.length}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Zap className="text-purple-600" size={20} />
              <span className="text-purple-600 font-semibold">Automated</span>
            </div>
            <div className="text-2xl font-bold text-purple-900 mt-1">2</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* New Task Form */}
        {showNewTaskForm && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Task description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="General">General</option>
                    <option value="DeFi">DeFi</option>
                    <option value="NFTs">NFTs</option>
                    <option value="Staking">Staking</option>
                    <option value="Trading">Trading</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={addTask}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create Task
                </button>
                <button
                  onClick={() => setShowNewTaskForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-lg shadow-sm border p-4 transition-all ${
                task.completed ? 'opacity-75' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <button
                  onClick={() => toggleTask(task.id)}
                  className="mt-1 flex-shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <Circle className="text-gray-400 hover:text-blue-600" size={20} />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {task.category}
                      </span>
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className={`mt-1 text-sm ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                      {task.description}
                    </p>
                  )}
                  
                  {task.dueDate && (
                    <div className="flex items-center space-x-1 mt-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-xs text-gray-500">Due: {task.dueDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <Zap className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No tasks yet</h3>
            <p className="mt-1 text-gray-500">Get started by creating your first automation task.</p>
            <button
              onClick={() => setShowNewTaskForm(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksScreen;