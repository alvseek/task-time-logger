'use strict';

/**
 * TaskListView — renders the open-task list and drives its actions
 * (start/stop, done, rename, delete). Talks to the store for state and
 * to the controller to re-render / toast.
 */
class TaskListView {
  constructor(store, els, controller) {
    this.store = store;
    this.els = els; // { tbody, empty }
    this.controller = controller;
    this.renamingId = null;
    this.renameDraft = '';
    this.runningCell = null;
  }

  render() {
    var self = this;
    var running = this.store.running;

    this.els.tbody.textContent = '';
    this.runningCell = null;

    var list = this.store.openTasks().slice().sort(function (a, b) { return b.createdAt - a.createdAt; });
    var now = Date.now();

    list.forEach(function (task) {
      var isRunning = !!running && running.taskId === task.id;
      var tr = document.createElement('tr');

      var nameCell = document.createElement('td');
      nameCell.textContent = task.name;
      tr.appendChild(nameCell);

      var timeCell = document.createElement('td');
      timeCell.className = 'num';
      timeCell.textContent = Formatters.fmtDuration(task.total(now, isRunning ? running.start : null));
      if (isRunning) self.runningCell = timeCell;
      tr.appendChild(timeCell);

      var actionCell = document.createElement('td');
      actionCell.className = 'action';

      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'toggle';
      if (isRunning) {
        toggle.textContent = 'Stop';
        toggle.classList.add('stop');
        toggle.title = 'Stop timing this task';
      } else {
        toggle.textContent = 'Start';
        toggle.disabled = !!running;
        toggle.title = running ? 'Stop the running task first' : 'Start timing this task';
      }
      toggle.addEventListener('click', function () {
        if (self.store.running && self.store.running.taskId === task.id) {
          self.store.stopTimer();
          self.controller.afterChange();
        } else {
          self.store.startTimer(task.id);
          self.controller.afterChange();
        }
      });
      actionCell.appendChild(toggle);

      var done = document.createElement('button');
      done.type = 'button';
      done.className = 'donebtn';
      done.textContent = 'Done';
      if (task.sessions.length === 0 && !isRunning) {
        done.disabled = true;
        done.title = 'Start the task first — there is no time to archive';
      } else {
        done.title = 'Mark done and archive';
      }
      done.addEventListener('click', function () {
        var result = self.store.markDone(task.id);
        if (result === 'empty') { self.controller.setStatus('Start the task first'); return; }
        if (self.renamingId === task.id) { self.renamingId = null; self.renameDraft = ''; }
        self.controller.afterChange('Archived');
      });
      actionCell.appendChild(done);

      var edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'edit';
      edit.title = 'Rename this task';
      edit.setAttribute('aria-label', 'Rename this task');
      edit.textContent = '\u270e';
      edit.addEventListener('click', function () { self.openRename(task.id); });
      actionCell.appendChild(edit);

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'del';
      del.title = 'Delete this task';
      del.setAttribute('aria-label', 'Delete this task');
      del.textContent = '\u00d7';
      del.addEventListener('click', function () { self.deleteTask(task.id); });
      actionCell.appendChild(del);

      tr.appendChild(actionCell);
      self.els.tbody.appendChild(tr);

      if (self.renamingId === task.id) self.els.tbody.appendChild(self.renameRow(task));
    });

    this.els.empty.style.display = list.length === 0 ? 'block' : 'none';
  }

  /** Repaint the running task's live total without a full re-render. */
  updateLive() {
    var running = this.store.running;
    if (!running || !this.runningCell) return;
    var task = this.store.find(running.taskId);
    if (task) this.runningCell.textContent = Formatters.fmtDuration(task.total(Date.now(), running.start));
  }

  renameRow(task) {
    var self = this;
    var tr = document.createElement('tr');
    tr.className = 'editrow renamerow';

    var cell = document.createElement('td');
    cell.colSpan = 3;

    var fields = document.createElement('div');
    fields.className = 'editfields';

    var box = document.createElement('input');
    box.type = 'text';
    box.value = this.renameDraft;
    box.setAttribute('aria-label', 'Task name');
    box.addEventListener('input', function () { self.renameDraft = box.value; });

    var save = document.createElement('button');
    save.type = 'button';
    save.textContent = 'Save';
    save.addEventListener('click', function () { self.saveRename(task.id); });

    var cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'cancel';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', function () { self.cancelRename(); });

    fields.appendChild(box);
    fields.appendChild(save);
    fields.appendChild(cancel);
    cell.appendChild(fields);
    tr.appendChild(cell);

    tr.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        if (event.target.tagName === 'BUTTON') return;
        event.preventDefault();
        self.saveRename(task.id);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        self.cancelRename();
      }
    });

    return tr;
  }

  openRename(taskId) {
    var task = this.store.find(taskId);
    if (!task) return;
    this.renamingId = taskId;
    this.renameDraft = task.name;
    this.controller.render();
    var box = document.querySelector('.renamerow input');
    if (box) { box.focus(); box.select(); }
  }

  cancelRename() {
    this.renamingId = null;
    this.renameDraft = '';
    this.controller.render();
  }

  saveRename(taskId) {
    this.store.renameTask(taskId, Formatters.clean(this.renameDraft) || 'Untitled task');
    this.renamingId = null;
    this.renameDraft = '';
    this.controller.afterChange('Renamed');
  }

  deleteTask(taskId) {
    var task = this.store.find(taskId);
    if (!task) return;
    if (task.sessions.length && !window.confirm('Delete "' + task.name + '" and its ' + task.sessions.length + ' entr' + (task.sessions.length === 1 ? 'y' : 'ies') + '?')) return;
    if (this.renamingId === taskId) { this.renamingId = null; this.renameDraft = ''; }
    this.store.deleteTask(taskId);
    this.controller.afterChange();
  }
}
