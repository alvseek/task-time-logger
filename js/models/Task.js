'use strict';

/**
 * Task — a named unit of work holding zero or more timed Sessions.
 * status is 'open' or 'done'; a done task is archived.
 */
class Task {
  constructor(props) {
    this.id = props.id;
    this.name = props.name;
    this.status = props.status || 'open';
    this.createdAt = props.createdAt;
    this.doneAt = props.doneAt || null;
    this.sessions = (props.sessions || []).map(function (s) {
      return s instanceof Session ? s : new Session(s);
    });
  }

  get isDone() {
    return this.status === 'done';
  }

  get isOpen() {
    return this.status !== 'done';
  }

  addSession(start, stop, id) {
    this.sessions.push(new Session({ id: id, start: start, stop: stop }));
  }

  /**
   * Total time in ms. Pass runningStart to include an in-flight run
   * (the caller also passes nowMs so elapsed is computed against one clock read).
   */
  total(nowMs, runningStart) {
    var total = 0;
    this.sessions.forEach(function (s) { total += s.duration; });
    if (runningStart !== null && runningStart !== undefined) total += (nowMs - runningStart);
    return total;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      createdAt: this.createdAt,
      doneAt: this.doneAt,
      sessions: this.sessions.map(function (s) { return s.toJSON(); })
    };
  }
}
