const ClientSideMinigame = require("./base/client.js");
const ServerSideMinigame = require("./base/server.js");

const name = "dance";

const client = function(session, emit, tug) {
  ClientSideMinigame.call(this);

  this.name = name;
  this.instructions = "DANCE!!!";

  this.begin = () => {
    console.log(`Starting minigame: ${this.name}`)
    this.danceRandomly();
  }

  this.danceRandomly = () => {
    if (session.currGame === this.name) {
      tug();
      // Tug again in [0 - 1.5] seconds.
      const randTime = Math.floor(Math.random() * 1500);
      setTimeout(this.danceRandomly, randTime);
    }
  }
}

const server = function(emit) {
  ServerSideMinigame.call(this, emit);
  this.name = name;
};

module.exports = { client, server };
