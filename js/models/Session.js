'use strict';

/**
 * Session — one timed run of a task: a start and a stop.
 */
class Session {
  constructor(props) {
    this.id = props.id;
    this.start = props.start;
    this.stop = props.stop;
  }

  get duration() {
    return this.stop - this.start;
  }

  toJSON() {
    return { id: this.id, start: this.start, stop: this.stop };
  }
}
