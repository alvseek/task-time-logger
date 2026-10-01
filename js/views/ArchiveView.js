'use strict';

/**
 * ArchiveView — renders archived work as one row per session, applies the
 * From/To date filter, and copies the visible rows for Excel. Owns the
 * session edit state; drives the store and asks the controller to re-render.
 */
class ArchiveView {
  constructor(store, els, controller) {
    this.store = store;
    this.els = els; // { tbody, empty, count, from, to }
    this.controller = controller;
    this.sessionEdit = null; // { taskId, sessionId, draft: { name, start, stop } }
  }

  // ---- filtering ----

  passesFilter(ms) {
    var d = Formatters.dateStr(ms);
    var from = this.els.from.value;
    var to = this.els.to.value;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  }

  /** Every archived session passing the filter, newest first. */
  rows() {
    var self = this;
    var rows = [];
    this.store.doneTasks().forEach(function (task) {
      task.sessions.forEach(function (session) {
        if (self.passesFilter(session.start)) rows.push({ task: task, session: session });
      });
    });
    rows.sort(function (a, b) { return b.session.start - a.session.start; });
    return rows;
  }

  // ---- rendering ----

  render() {
    var self = this;

    this.els.tbody.textContent = '';
    var rows = this.rows();

    rows.forEach(function (pair) {
      var task = pair.task;
      var session = pair.session;
      var tr = document.createElement('tr');

      tr.appendChild(self.textCell(task.name));

      var dateCell = self.textCell(Formatters.dateStr(session.start));
      dateCell.className = 'num';
      tr.appendChild(dateCell);

      var startCell = self.textCell(Formatters.fmtDateTime(session.start));
      startCell.className = 'num';
      tr.appendChild(startCell);

      var stopCell = self.textCell(Formatters.fmtDateTime(session.stop));
      stopCell.className = 'num';
      tr.appendChild(stopCell);

      var durCell = self.textCell(Formatters.fmtDuration(session.stop - session.start));
      durCell.className = 'num';
      tr.appendChild(durCell);

      var actionCell = document.createElement('td');
      actionCell.className = 'action';

      var restore = document.createElement('button');
      restore.type = 'button';
      restore.className = 'restore';
      restore.title = 'Restore this task to the open list';
      restore.setAttribute('aria-label', 'Restore this task');
      restore.textContent = '\u21a9';
      restore.addEventListener('click', function () { self.restoreTask(task.id); });
      actionCell.appendChild(restore);

      var edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'edit';
      edit.title = 'Edit this entry';
      edit.setAttribute('aria-label', 'Edit this entry');
      edit.textContent = '\u270e';
      edit.addEventListener('click', function () { self.openSessionEdit(task.id, session.id); });
      actionCell.appendChild(edit);

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'del';
      del.title = 'Delete this entry';
      del.setAttribute('aria-label', 'Delete this entry');
      del.textContent = '\u00d7';
      del.addEventListener('click', function () { self.deleteSession(task.id, session.id); });
      actionCell.appendChild(del);

      tr.appendChild(actionCell);
      self.els.tbody.appendChild(tr);

      if (self.sessionEdit && self.sessionEdit.sessionId === session.id) {
        self.els.tbody.appendChild(self.sessionEditRow(task, session));
      }
    });

    this.els.empty.style.display = rows.length === 0 ? 'block' : 'none';
    this.els.count.textContent = rows.length + (rows.length === 1 ? ' row' : ' rows');
  }

  clearEditFor(taskId) {
    if (this.sessionEdit && this.sessionEdit.taskId === taskId) this.sessionEdit = null;
  }

  textCell(text) {
    var td = document.createElement('td');
    td.textContent = text;
    return td;
  }

  // ---- session editing ----

  openSessionEdit(taskId, sessionId) {
    var task = this.store.find(taskId);
    if (!task) return;
    var session = null;
    task.sessions.forEach(function (s) { if (s.id === sessionId) session = s; });
    if (!session) return;
    this.sessionEdit = {
      taskId: taskId,
      sessionId: sessionId,
      draft: { name: task.name, start: Formatters.fmtInput(session.start), stop: Formatters.fmtInput(session.stop) }
    };
    this.controller.render();
    var box = document.querySelector('.sessrow input');
    if (box) box.focus();
  }

  cancelSessionEdit() {
    this.sessionEdit = null;
    this.controller.render();
  }

  saveSessionEdit() {
    if (!this.sessionEdit) return;
    var edit = this.sessionEdit;
    var start = Formatters.parseLocal(edit.draft.start);
    var stop = Formatters.parseLocal(edit.draft.stop);

    if (isNaN(start)) { this.controller.setStatus('Pick a valid start'); return; }
    if (isNaN(stop)) { this.controller.setStatus('Pick a valid stop'); return; }
    if (stop <= start) { this.controller.setStatus('Stop must be after Start'); return; }

    this.store.updateSession(edit.taskId, edit.sessionId, start, stop, Formatters.clean(edit.draft.name) || 'Untitled task');
    this.sessionEdit = null;
    this.controller.afterChange('Updated');
  }

  sessionEditRow(task, session) {
    var self = this;
    var edit = this.sessionEdit;

    var tr = document.createElement('tr');
    tr.className = 'editrow sessrow';

    var cell = document.createElement('td');
    cell.colSpan = 6;

    var fields = document.createElement('div');
    fields.className = 'editfields';

    var dur = document.createElement('span');
    dur.className = 'editdur';

    function refresh() {
      var a = Formatters.parseLocal(edit.draft.start);
      var b = Formatters.parseLocal(edit.draft.stop);
      dur.textContent = (isNaN(a) || isNaN(b) || b <= a) ? '\u2014' : Formatters.fmtDuration(b - a);
    }

    var nameBox = document.createElement('input');
    nameBox.type = 'text';
    nameBox.value = edit.draft.name;
    nameBox.setAttribute('aria-label', 'Task name');
    nameBox.addEventListener('input', function () { edit.draft.name = nameBox.value; });

    function timeBox(label, key) {
      var box = document.createElement('input');
      box.type = 'datetime-local';
      box.step = '1';
      box.value = edit.draft[key];
      box.setAttribute('aria-label', label);
      box.addEventListener('input', function () {
        edit.draft[key] = box.value;
        refresh();
      });
      return box;
    }

    var save = document.createElement('button');
    save.type = 'button';
    save.textContent = 'Save';
    save.addEventListener('click', function () { self.saveSessionEdit(); });

    var cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'cancel';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', function () { self.cancelSessionEdit(); });

    fields.appendChild(nameBox);
    fields.appendChild(timeBox('Start time', 'start'));
    fields.appendChild(timeBox('Stop time', 'stop'));
    fields.appendChild(dur);
    fields.appendChild(save);
    fields.appendChild(cancel);
    cell.appendChild(fields);
    tr.appendChild(cell);

    tr.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        if (event.target.tagName === 'BUTTON') return;
        event.preventDefault();
        self.saveSessionEdit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        self.cancelSessionEdit();
      }
    });

    refresh();
    return tr;
  }

  // ---- actions ----

  restoreTask(taskId) {
    this.clearEditFor(taskId);
    this.store.restoreTask(taskId);
    this.controller.afterChange('Restored');
  }

  deleteSession(taskId, sessionId) {
    if (this.sessionEdit && this.sessionEdit.sessionId === sessionId) this.sessionEdit = null;
    this.store.deleteSession(taskId, sessionId);
    this.controller.afterChange();
  }

  // ---- Excel export ----

  asTsv() {
    var lines = ['Task\tDate\tStart\tStop\tDuration'];
    this.rows().forEach(function (pair) {
      lines.push([
        Formatters.clean(pair.task.name),
        Formatters.dateStr(pair.session.start),
        Formatters.fmtDateTime(pair.session.start),
        Formatters.fmtDateTime(pair.session.stop),
        Formatters.fmtDuration(pair.session.stop - pair.session.start)
      ].join('\t'));
    });
    return lines.join('\n');
  }

  copy() {
    if (this.rows().length === 0) { this.controller.setStatus('Nothing archived to copy'); return; }
    var text = this.asTsv();
    var self = this;
    var done = function () { self.controller.setStatus('Copied \u2014 paste into Excel'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { self.legacyCopy(text, done); });
    } else {
      this.legacyCopy(text, done);
    }
  }

  legacyCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    ta.remove();
    if (ok) { done(); } else { this.controller.setStatus('Copy blocked \u2014 select the table and copy manually'); }
  }
}
