const ServerSideMinigame = function(emit) {
  this.name = null;
  this.socketResponseMap = {};

  this.initiate = () => {
    console.log(
      `Kicking off minigame with default (empty) socket emission: ${this.name}`);
    emit(this.name);
  };

  this.cleanup = () => {
    console.log(
      `No cleanup actions to take for minigame: ${this.name}`);
  };

  this.enforceInterface = () => {
    if (!this.name) throw Error("Minigame must have name.");
    for (socketResponse in this.socketResponseMap) {
      if (typeof this.socketResponseMap[socketResponse] !== 'function') {
        throw Error(
          `Minigame ${this.name} response to socket event ${inputEvent} must be a function.`);
      }
    }
    return this;
  }
}

module.exports = ServerSideMinigame;
