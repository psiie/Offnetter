class Terminal {
  constructor(listLength) {
    this.startTime = Date.now() / 1000;
    this.logCounter = 0;
    this.listLength = 0;
  }

  print(msg) {
    const timeDiff = Date.now() / 1000 - this.startTime;
    const timePer = timeDiff / this.logCounter;
    const timeRemaining = (this.listLength - this.logCounter) * timePer;
    const hoursRemaining = parseInt(timeRemaining / 60 / 60, 10);
    const minutesRemaining = parseInt(timeRemaining / 60 % 60, 10);

    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`  ┗ ${hoursRemaining}:${minutesRemaining} | ${this.logCounter}/${this.listLength} | ${msg}`);
  }

  incLogCounter() {
    this.logCounter++;
  }
}

module.exports = Terminal;
