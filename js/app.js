'use strict';

/**
 * App — the controller. Owns the store and the two views, wires the
 * header/manual/form controls, and runs the one-second live tick.
 * Views call back into afterChange()/setStatus()/render().
 */
class App {
  constructor() {
    this.MESSAGE_HOLD_MS = 2000;
    this.statusHoldUntil = 0;

    this.store = new TaskStore(window.localStorage);
    this.store.load();

    this.statusEl = this.el('status');

    this.taskList = new TaskListView(this.store, {
      tbody: this.el('taskrows'),
      empty: this.el('tasksempty')
    }, this);

    this.archive = new ArchiveView(this.store, {
      tbody: this.el('archrows'),
      empty: this.el('archempty'),
      count: this.el('archcount'),
      from: this.el('from'),
      to: this.el('to')
    }, this);

    this.bind();
    this.render();
    setInterval(this.updateRunning.bind(this), 1000);
  }

  el(id) {
    return document.getElementById(id);
  }

  // ---- controller surface used by views ----

  render() {
    this.taskList.render();
    this.archive.render();
    this.updateRunning();
  }

  afterChange(message) {
    this.render();
    if (message) this.setStatus(message);
  }

  setStatus(message) {
    this.statusEl.textContent = message;
    this.statusHoldUntil = Date.now() + this.MESSAGE_HOLD_MS;
  }

  updateRunning() {
    var running = this.store.running;
    if (running) {
      var elapsed = Formatters.fmtDuration(Date.now() - running.start);
      this.taskList.updateLive();
      if (Date.now() >= this.statusHoldUntil) this.statusEl.textContent = 'Running \u00b7 ' + elapsed;
      document.title = '\u25cf ' + elapsed + ' \u2014 Time Tracker';
    } else {
      document.title = 'Time Tracker';
      if (Date.now() >= this.statusHoldUntil) {
        this.statusEl.textContent = this.store.openTasks().length + ' open \u00b7 ' + this.store.doneTasks().length + ' archived';
      }
    }
  }

  // ---- actions ----

  addTask() {
    var name = Formatters.clean(this.el('task').value);
    if (!name) { this.setStatus('Type a task name'); this.el('task').focus(); return; }
    this.store.addTask(name);
    this.el('task').value = '';
    this.afterChange('Added');
    this.el('task').focus();
  }

  addManual() {
    var when = this.el('when');
    var minutesField = this.el('minutes');
    var start = Formatters.parseLocal(when.value);
    var minutes = Number(minutesField.value);

    if (isNaN(start)) { this.setStatus('Pick when it happened'); when.focus(); return; }
    if (!isFinite(minutes) || minutes <= 0) { this.setStatus('Enter how long, in minutes'); minutesField.focus(); return; }

    var duration = Math.round(minutes * 60000);
    var stop = start + duration;
    if (isNaN(new Date(stop).getTime())) { this.setStatus('That duration is out of range'); minutesField.focus(); return; }

    var name = Formatters.clean(this.el('task').value) || 'Untitled task';
    this.store.addManual(name, start, stop);

    this.el('task').value = '';
    when.value = Formatters.nowValue();
    minutesField.value = '';
    this.afterChange('Added \u2014 ' + Formatters.fmtDuration(duration));
    this.el('task').focus();
  }

  clearAll() {
    if (this.store.tasks.length === 0 && !this.store.running) return;
    var question = this.store.running
      ? 'Delete all tasks and stop the running timer?'
      : 'Delete all tasks and their entries?';
    if (!window.confirm(question)) return;
    this.taskList.renamingId = null;
    this.taskList.renameDraft = '';
    this.archive.sessionEdit = null;
    this.store.clearAll();
    this.el('task').value = '';
    this.afterChange();
  }

  setManualOpen(open) {
    var panel = this.el('manual');
    var button = this.el('addman');
    panel.hidden = !open;
    button.textContent = open ? 'Close' : 'Add manually';
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      this.el('when').value = Formatters.nowValue();
      this.el('when').focus();
    }
  }

  toggleManual() {
    this.setManualOpen(this.el('manual').hidden);
  }

  // ---- wiring ----

  bind() {
    var self = this;
    var enterAdds = function (event) {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      self.addManual();
    };

    this.el('addtask').addEventListener('click', function () { self.addTask(); });
    this.el('copy').addEventListener('click', function () { self.archive.copy(); });
    this.el('clear').addEventListener('click', function () { self.clearAll(); });
    this.el('addman').addEventListener('click', function () { self.toggleManual(); });
    this.el('add').addEventListener('click', function () { self.addManual(); });
    this.el('from').addEventListener('input', function () { self.archive.render(); self.updateRunning(); });
    this.el('to').addEventListener('input', function () { self.archive.render(); self.updateRunning(); });
    this.el('when').addEventListener('keydown', enterAdds);
    this.el('minutes').addEventListener('keydown', enterAdds);
    this.el('task').addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      self.addTask();
    });
  }
}

new App();
