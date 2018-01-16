const async = require('async');

class Queue {
  constructor(connections, fn) {
    this.connections = connections || 8;
    this.queue = async.queue(fn, this.connections);
  }

  setDrain(fn) {
    this.queue.drain = fn;
  }

  push(arr) {
    this.queue && this.queue.push(arr);
  }
}

module.exports = Queue;
