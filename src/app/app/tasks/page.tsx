"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Measure living room",
      description: "Take measurements for the new flooring project",
      status: "in-progress",
      priority: "high",
      assignedTo: "John Doe",
      dueDate: "2026-01-05",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      id: "2",
      title: "Create estimate",
      description: "Generate estimate for client",
      status: "pending",
      priority: "high",
      assignedTo: "Jane Smith",
      dueDate: "2026-01-06",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    {
      id: "3",
      title: "Order materials",
      description: "Order oak hardwood flooring",
      status: "pending",
      priority: "medium",
      assignedTo: "Manager",
      dueDate: "2026-01-10",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      filterStatus === "all" || task.status === filterStatus;
    const matchesPriority =
      filterPriority === "all" || task.priority === filterPriority;
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    inProgress: tasks.filter((t) => t.status === "in-progress").length,
    pending: tasks.filter((t) => t.status === "pending").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600";
      case "in-progress":
        return "bg-blue-600";
      case "pending":
        return "bg-yellow-600";
      default:
        return "bg-gray-600";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-400";
      case "medium":
        return "text-yellow-400";
      case "low":
        return "text-green-400";
      default:
        return "text-muted";
    }
  };

  const openTaskModal = (task: Task | null = null) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const closeTaskModal = () => {
    setShowModal(false);
    setSelectedTask(null);
  };

  const updateTaskStatus = (taskId: string, newStatus: Task["status"]) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
          : t,
      ),
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Tasks</h1>
          <p className="text-secondary mt-1">Manage and track your workflow</p>
        </div>
        <button
          onClick={() => openTaskModal()}
          className="bg-input text-primary px-4 py-2 rounded-lg font-semibold hover:brightness-110 transition border-soft"
        >
          + Create Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="ui-text-muted text-sm">Total Tasks</p>
            <p className="text-3xl font-bold text-primary mt-2">
              {stats.total}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="ui-text-muted text-sm">In Progress</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">
              {stats.inProgress}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="ui-text-muted text-sm">Pending</p>
            <p className="text-3xl font-bold text-yellow-400 mt-2">
              {stats.pending}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="ui-text-muted text-sm">Completed</p>
            <p className="text-3xl font-bold text-green-400 mt-2">
              {stats.completed}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-input text-primary border-soft rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Priority
              </label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Tasks</CardTitle>
          <CardDescription>
            {filteredTasks.length} task(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary">No tasks found</p>
              <button
                onClick={() => openTaskModal()}
                className="mt-4 bg-input text-primary px-4 py-2 rounded-lg font-semibold hover:brightness-110 transition"
              >
                Create your first task
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="ui-surface-muted rounded-lg p-4 hover:brightness-110 transition cursor-pointer"
                  onClick={() => openTaskModal(task)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-primary">
                          {task.title}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded font-semibold text-white ${getStatusColor(task.status)}`}
                        >
                          {task.status.replace("-", " ")}
                        </span>
                        <span
                          className={`text-xs font-bold ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                      {task.description && (
                        <p className="ui-text-muted text-sm mt-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs">
                        {task.assignedTo && (
                          <span className="text-secondary">
                            👤 {task.assignedTo}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="text-secondary">
                            📅 {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {task.status !== "completed" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTaskStatus(task.id, "completed");
                          }}
                          className="px-3 py-1 bg-green-600 text-primary text-xs rounded font-medium hover:brightness-110 transition"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Delete functionality
                          setTasks((prev) =>
                            prev.filter((t) => t.id !== task.id),
                          );
                        }}
                        className="px-3 py-1 bg-red-600 text-primary text-xs rounded font-medium hover:brightness-110 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay bg-opacity-60">
          <div className="bg-surface rounded-lg shadow-lg max-w-lg w-full p-6 relative border-soft">
            <button
              className="absolute top-2 right-2 text-muted hover:text-primary text-2xl font-bold"
              onClick={closeTaskModal}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-primary">
              {selectedTask ? "Edit Task" : "Create New Task"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Task title"
                  defaultValue={selectedTask?.title || ""}
                  className="w-full bg-input text-primary border-soft rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Task description"
                  defaultValue={selectedTask?.description || ""}
                  rows={3}
                  className="w-full bg-input text-primary border-soft rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Status
                  </label>
                  <select
                    defaultValue={selectedTask?.status || "pending"}
                    className="w-full"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Priority
                  </label>
                  <select
                    defaultValue={selectedTask?.priority || "medium"}
                    className="w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Assign To
                  </label>
                  <input
                    type="text"
                    placeholder="Person's name"
                    defaultValue={selectedTask?.assignedTo || ""}
                    className="w-full bg-input text-primary border-soft rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    defaultValue={selectedTask?.dueDate || ""}
                    className="w-full bg-input text-primary border-soft rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={closeTaskModal}
                  className="flex-1 px-4 py-2 bg-card text-primary rounded-lg font-semibold hover:brightness-110 transition border-soft"
                >
                  Cancel
                </button>
                <button
                  onClick={closeTaskModal}
                  className="flex-1 px-4 py-2 bg-input text-primary rounded-lg font-semibold hover:brightness-110 transition border-soft"
                >
                  {selectedTask ? "Update Task" : "Create Task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
