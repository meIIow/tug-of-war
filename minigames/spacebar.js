const ClientSideMinigame = require("./base/client.js");
const ServerSideMinigame = require("./base/server.js");

const name = "spacebar";

const client = function(session, emit, tug) {
  ClientSideMinigame.call(this);

  this.name = name;
  this.instructions = "PRESS THE SPACE BAR!";

  this.inputEventResponseMap.keyup = (event) => {
    if (event.keyCode === 32) return tug();
  }
}

const server = function(emit) {
  ServerSideMinigame.call(this, emit);
  this.name = name;
};

module.exports = { client, server };
