'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import { api } from '@/lib/api-client'
import { ws } from '@/lib/ws-client'
import type { ToolTask, ToolType } from '@/types/tools'
import type { WSToolProgress, WSToolCompleted, WSToolError } from '@/types/websocket'

let _tasks: ToolTask[] = []
let _loading = true
let _version = 0
const _listeners = new Set<() => void>()

function notify() {
  _version++
  _listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  _listeners.add(listener)
  return () => { _listeners.delete(listener) }
}

function getSnapshot() {
  return _version
}

// Fetch tasks initially and sync
async function _fetchTasksGlobal() {
  try {
    const res = await api.getTasks()
    if (res.data) {
      _tasks = res.data as ToolTask[]
      _loading = false
      notify()
    }
  } catch {
    _loading = false
  }
}

// Global WebSocket listener registration
if (typeof window !== 'undefined') {
  _fetchTasksGlobal()

  ws.on('tool:progress', (data: any) => {
    let found = false
    _tasks = _tasks.map((t) => {
      if (t.id === data.taskId) {
        found = true
        return { ...t, progress: data.progress, total: data.total, status: 'running' }
      }
      return t
    })
    if (!found) {
      _fetchTasksGlobal()
    } else {
      notify()
    }
  })

  ws.on('tool:completed', (data: any) => {
    _tasks = _tasks.map((t) =>
      t.id === data.taskId ? { ...t, status: 'completed', results: data.results } : t
    )
    notify()
  })

  ws.on('tool:error', (data: any) => {
    _tasks = _tasks.map((t) =>
      t.id === data.taskId ? { ...t, status: 'error', error: data.error } : t
    )
    notify()
  })
}

/**
 * Hook que gerencia o estado global das tarefas em tempo real.
 * Preserva o progresso e estado ativo mesmo trocando de abas na UI.
 */
export function useTasks() {
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const fetchTasks = useCallback(async () => {
    await _fetchTasksGlobal()
  }, [])

  useEffect(() => {
    _fetchTasksGlobal()
  }, [])

  const runTool = useCallback(async (tool: string, config: unknown) => {
    const res = await api.runTool(tool, config)
    await _fetchTasksGlobal()
    return res
  }, [])

  const cancelTask = useCallback(async (id: string) => {
    await api.cancelTask(id)
    await _fetchTasksGlobal()
  }, [])

  const clearCompleted = useCallback(async () => {
    await api.clearCompletedTasks()
    await _fetchTasksGlobal()
  }, [])

  const runningTasks = _tasks.filter((t) => t.status === 'running' || t.status === 'paused')

  return {
    tasks: _tasks,
    runningTasks,
    loading: _loading,
    runTool,
    cancelTask,
    clearCompleted,
    refetch: fetchTasks,
  }
}

/**
 * Retorna se existe uma tarefa ativa para o tipo de ferramenta especificado,
 * garantindo persistência mesmo após alternar de abas.
 */
export function useActiveTask(toolType: string) {
  const { tasks, cancelTask } = useTasks()
  const activeTask = tasks.find(
    (t) => t.tool === toolType && (t.status === 'running' || t.status === 'paused')
  )

  return {
    isRunning: Boolean(activeTask),
    activeTask,
    cancel: () => activeTask && cancelTask(activeTask.id),
  }
}
