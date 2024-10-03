const ClientSideMinigame = require("./base/client.js");
const ServerSideMinigame = require("./base/server.js");

const name = "clickPic";

const client = function(session, emit, tug) {
  ClientSideMinigame.call(this);

  this.name = name;
  this.instructions = "Click on the pic.";

  // Creates, appends, and adds click response to pic. Relies on class state.
  const makeClickPic = () => {
    const pic = $('<div class="click-pic"></div>');
    session.$wrapper.append(pic);
    pic.hide();
    pic.click(() => {
      if (session.currGame === this.name) {
        console.log('Clicked pic!');
        tug();
        movePic();
      }
    });
    return pic;
  }
  const pic = makeClickPic();

  // Randomly assign a new location, within 200px buffer from screen edge.
  const movePic = () => {
    const left = Math.floor(Math.random() * ($(document).width() - 400)) + 200;
    const top = Math.floor(Math.random() * ($(document).height() - 400)) + 200;
    const position = pic.position();
    position.left = left
    position.top = top;
    pic.offset(position);
  }

  this.begin = () => {
    console.log(`Starting minigame: ${this.name}`)
    pic.show();
  }

  this.cleanup = () => {
    console.log(`Cleaning up minigame: ${this.name}`)
    pic.hide();
  };
}

const server = function(emit) {
  ServerSideMinigame.call(this, emit);
  this.name = name;
};

module.exports = { client, server };
