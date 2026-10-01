'use strict';

/**
 * Storage keys. v1 is the pre-task-list schema (a flat entries array);
 * it is read once to migrate and then left in place as a backup.
 */
var StorageKeys = {
  TASKS: 'time-tracker.tasks.v2',
  RUNNING: 'time-tracker.running.v2',
  LEGACY_ENTRIES: 'time-tracker.entries.v1'
};

/**
 * TaskStore — owns all task state and persistence: load, migration,
 * the running timer, and every mutation. Views call these methods and
 * then ask the controller to re-render; the store never touches the DOM.
 */
class TaskStore {
  constructor(storage) {
    this.storage = storage || (typeof window !== 'undefined' ? window.localStorage : null);
    this.tasks = [];
    this.running = null; // { taskId, start } or null
  }

  // ---- persistence ----

  uid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  readRaw(key) {
    try { return this.storage.getItem(key); } catch (err) { return null; }
  }

  parseArray(raw) {
    if (raw === null) return null;
    try {
      var value = JSON.parse(raw);
      return Array.isArray(value) ? value : null;
    } catch (err) {
      return null;
    }
  }

  load() {
    var raw = this.readRaw(StorageKeys.TASKS);
    if (raw !== null) {
      // The key exists, so migration already happened (or the store is
      // corrupt). Never re-migrate — that would resurrect the old log.
      this.tasks = (this.parseArray(raw) || []).map(function (t) { return new Task(t); });
    } else {
      this.tasks = this.migrate();
    }

    var runRaw = this.readRaw(StorageKeys.RUNNING);
    var parsed = null;
    try { parsed = runRaw === null ? null : JSON.parse(runRaw); } catch (err) { parsed = null; }
    this.running = (parsed && parsed.taskId && this.isOpen(parsed.taskId)) ? parsed : null;
  }

  /** Convert the pre-task-list entries log into archived tasks. */
  migrate() {
    var legacy = this.parseArray(this.readRaw(StorageKeys.LEGACY_ENTRIES));
    var migrated = [];
    var self = this;
    if (Array.isArray(legacy)) {
      legacy.forEach(function (entry) {
        if (!entry || typeof entry !== 'object') return;
        var start = Number(entry.start);
        var stop = Number(entry.stop);
        if (!isFinite(start) || !isFinite(stop) || stop <= start) return;
        migrated.push(new Task({
          id: self.uid(),
          name: Formatters.clean(entry.task) || 'Untitled task',
          status: 'done',
          createdAt: start,
          doneAt: stop,
          sessions: [{ id: self.uid(), start: start, stop: stop }]
        }));
      });
    }
    try { this.storage.setItem(StorageKeys.TASKS, JSON.stringify(migrated)); } catch (err) {}
    return migrated;
  }

  save() {
    try {
      this.storage.setItem(StorageKeys.TASKS, JSON.stringify(this.tasks));
      this.storage.setItem(StorageKeys.RUNNING, JSON.stringify(this.running));
    } catch (err) {
      return false;
    }
    return true;
  }

  // ---- queries ----

  find(id) {
    for (var i = 0; i < this.tasks.length; i++) {
      if (this.tasks[i].id === id) return this.tasks[i];
    }
    return null;
  }

  isOpen(id) {
    var task = this.find(id);
    return !!task && task.isOpen;
  }

  openTasks() {
    return this.tasks.filter(function (task) { return task.isOpen; });
  }

  doneTasks() {
    return this.tasks.filter(function (task) { return task.isDone; });
  }

  // ---- mutations (each persists) ----

  addTask(name) {
    var task = new Task({
      id: this.uid(),
      name: name,
      status: 'open',
      createdAt: Date.now(),
      doneAt: null,
      sessions: []
    });
    this.tasks.push(task);
    this.save();
    return task;
  }

  startTimer(taskId) {
    if (this.running) return false;
    var task = this.find(taskId);
    if (!task || task.isDone) return false;
    this.running = { taskId: taskId, start: Date.now() };
    this.save();
    return true;
  }

  stopTimer() {
    if (!this.running) return;
    var task = this.find(this.running.taskId);
    if (task) task.addSession(this.running.start, Date.now(), this.uid());
    this.running = null;
    this.save();
  }

  /** Returns 'ok', 'empty' (no time to archive), or 'missing'. */
  markDone(taskId) {
    if (this.running && this.running.taskId === taskId) this.stopTimer();
    var task = this.find(taskId);
    if (!task) return 'missing';
    if (task.sessions.length === 0) return 'empty';
    task.status = 'done';
    task.doneAt = Date.now();
    this.save();
    return 'ok';
  }

  restoreTask(taskId) {
    var task = this.find(taskId);
    if (!task) return;
    task.status = 'open';
    task.doneAt = null;
    this.save();
  }

  deleteTask(taskId) {
    if (this.running && this.running.taskId === taskId) this.running = null;
    this.tasks = this.tasks.filter(function (t) { return t.id !== taskId; });
    this.save();
  }

  deleteSession(taskId, sessionId) {
    var task = this.find(taskId);
    if (!task) return;
    task.sessions = task.sessions.filter(function (s) { return s.id !== sessionId; });
    if (task.sessions.length === 0) {
      this.deleteTask(taskId);
      return;
    }
    this.save();
  }

  renameTask(taskId, name) {
    var task = this.find(taskId);
    if (!task) return;
    task.name = name;
    this.save();
  }

  updateSession(taskId, sessionId, start, stop, name) {
    var task = this.find(taskId);
    if (!task) return;
    var session = null;
    task.sessions.forEach(function (s) { if (s.id === sessionId) session = s; });
    if (!session) return;
    if (name !== null && name !== undefined) task.name = name;
    session.start = start;
    session.stop = stop;
    this.save();
  }

  /** Log a past session as an already-archived task. */
  addManual(name, start, stop) {
    this.tasks.push(new Task({
      id: this.uid(),
      name: name,
      status: 'done',
      createdAt: start,
      doneAt: stop,
      sessions: [{ id: this.uid(), start: start, stop: stop }]
    }));
    this.save();
  }

  clearAll() {
    this.tasks = [];
    this.running = null;
    this.save();
  }
}
