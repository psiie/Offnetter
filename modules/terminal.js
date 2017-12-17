class Terminal {
  constructor(listLength = -1) {
    this.listLength = listLength;
    this.startTime = Date.now() / 1000;
    this.logCounter = 0;
  }

  setListLength(listLength = 0) {
    this.listLength = listLength;
  }

  print(msg) {
    const timeDiff = Date.now() / 1000 - this.startTime;
    const timePer = timeDiff / this.logCounter;
    const timeRemaining = (this.listLength - this.logCounter) * timePer;
    const hoursRemaining = parseInt(timeRemaining / 60 / 60, 10);
    const minutesRemaining = parseInt(timeRemaining / 60 % 60, 10);

    const longLogLine = `  ┗ ${hoursRemaining}:${minutesRemaining} | ${this.logCounter}/${this.listLength} | ${msg}`;
    const shortLogLine = `  ┗ ${msg}`;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(this.listLength === -1 ? shortLogLine : longLogLine);
  }

  incLogCounter() {
    this.logCounter++;
  }
}

module.exports = Terminal;
