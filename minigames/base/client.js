const ClientSideMinigame = function() {
  this.name = null;
  this.instructions = null;

  this.inputEventResponseMap = {};
  this.socketResponseMap = {};

  this.begin = () => {
    console.log(
      `Starting minigame with default (empty) initialization: ${this.name}`);
  };

  this.cleanup = () => {
    console.log(`Ending minigame with default (empty) cleanup: ${this.name}`);
  };

  this.enforceInterface = () => {
    if (!this.name) throw Error("Minigame must have name.");
    if (!this.instructions) throw Error(`Minigame ${this.name} must have instructions.`);
    for (inputEvent in this.inputEventResponseMap) {
      if (typeof this.inputEventResponseMap[inputEvent] !== 'function') {
        throw Error(
          `Minigame ${this.name} response to global ${inputEvent} must be a function`);
      }
    }
    for (socketResponse in this.socketResponseMap) {
      if (typeof this.socketResponseMap[socketResponse] !== 'function') {
        throw Error(
          `Minigame ${this.name} response to socket event ${inputEvent} must be a function.`);
      }
    }
    return this;
  }
}

module.exports = ClientSideMinigame;
