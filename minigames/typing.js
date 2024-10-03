const ClientSideMinigame = require("./base/client.js");
const ServerSideMinigame = require("./base/server.js");

const name = "typeGame";

const textOptions = [
  `In the beginning the Universe was created. This has made a lot of people very angry and been widely regarded as a bad move.`,
  `Don’t Panic.`,
  `There is an art, it says, or rather, a knack to flying. The knack lies in learning how to throw yourself at the ground and miss.`,
  `A common mistake that people make when trying to design something completely foolproof is to underestimate the ingenuity of complete fools.`,
];

const client = function(session, emit, tug) {
  ClientSideMinigame.call(this);

  this.name = name;
  this.instructions = "Type out the text! Stay on the highlighted character.";

  let text = "";
  let index = 0;

  this.inputEventResponseMap.keyup = (event) => {
    let matchCode = text.charCodeAt(index);
    if (!event.shiftKey && matchCode < 123 && matchCode > 96) matchCode -= 32;
    if (event.keyCode === matchCode || matchCode < 65 || matchCode > 122) {
      $(`.text${index}`).css(
        "background-color",
        "transparent"
      );
      index = (index + 1) % text.length;
      $(`.text${index}`).css("background-color", "lightblue");
      tug();
    }
  }

  this.begin = (typeText) => {
    console.log(`Initializing ${this.name} minigame with phrase: ${typeText}`);
    let textHTML = "";
    let i = 0;
    for (t of typeText) {
      textHTML += `<span class="text${i}">${t}</span>`;
      i++;
    }

    text = typeText;
    index = 0;

    session.$gameboard.html(textHTML);
    $(".text0").css("background-color", "lightblue");
  };
}

const server = function(emit) {
  ServerSideMinigame.call(this, emit);
  this.name = name;

  this.initiate = () => {
    console.log(
      `Kicking off minigame with socket emission: ${this.name}`);
    emit(
      this.name, textOptions[Math.floor(Math.random() * textOptions.length)]);
  };
};

module.exports = { client, server };
