const ClientSideMinigame = require("./base/client.js");
const ServerSideMinigame = require("./base/server.js");

const name = "teekey";

const client = function(session, emit, tug) {
  ClientSideMinigame.call(this);

  this.name = name;
  this.instructions = "Press the T key over and over as fast as you can!";

  this.inputEventResponseMap.keyup = (event) => {
    if (event.keyCode == 84) return tug();
  }
}

const server = function(emit) {
  ServerSideMinigame.call(this, emit);
  this.name = name;
};

module.exports = { client, server };
