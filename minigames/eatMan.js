const ClientSideMinigame = require("./base/client.js");
const ServerSideMinigame = require("./base/server.js");

const name = "eatBlock";
const eatManStartPosition = {top: 300, left: 600};
const moveEatManTag = `moveEatMan`
const clonePosition = (position) => JSON.parse(JSON.stringify(position));

const client = function(session, emit, tug) {
  ClientSideMinigame.call(this);

  this.name = name;
  this.instructions = "EAT YOUR TEAM'S BLOCKS!";

  const eatMan = $('<div id="head"></div>');
  const targetPositions = {
    A: [
      {top: 50, left: 450},
      {top: 150, left: 950},
      {top: 250, left: 750},
      {top: 350, left: 150},
      {top: 450, left: 1150}
    ],
    B: [
      {top: 50, left: 150},
      {top: 150, left: 550},
      {top: 250, left: 1050},
      {top: 350, left: 850},
      {top: 450, left: 250}
    ]
  };

  this.inputEventResponseMap.keyup = (event) => {
    if (event.keyCode === 37) {
      return emit(moveEatManTag, 'left');
    }
    if (event.keyCode === 38) {
      return emit(moveEatManTag, 'up');
    }
    if (event.keyCode === 39) {
      return emit(moveEatManTag, 'right');
    }
    if (event.keyCode === 40) {
      return emit(moveEatManTag, 'down');
    }
  };

  this.socketResponseMap[moveEatManTag] = (position) => {
    console.log(position);
    eatMan.css(position);
    //if eatman is on any of the eatblocks...
    const Atugs = targetPositions.A;
    const Btugs = targetPositions.B;

    Atugs.forEach( (positionObj) => {
      if (position.top === positionObj.top && position.left === positionObj.left) {
        emit("tug", 'teamA');
      }
    });

    Btugs.forEach( (positionObj) => {
      if (position.top === positionObj.top && position.left === positionObj.left) {
        emit("tug", 'teamB');
      }
    });
  }

  this.begin = () => {
    session.$gameboard.append(eatMan);
    eatMan.css(clonePosition(eatManStartPosition));

    // Just hardcode the target/block positions in, so that they are common for all clients,
    // and the server doesn't have to do it.
    for (let i=0; i<5; i++){
      session.$gameboard.append($(`<div class="blockA" id="A${i}">A</div>`));
      $(`#A${i}`).css(targetPositions.A[i]);
      session.$gameboard.append($(`<div class="blockB" id="B${i}">B</div>`));
      $(`#B${i}`).css(targetPositions.B[i]);
    }
  };
}

const server = function(emit) {
  ServerSideMinigame.call(this, emit);
  this.name = name;

  let eatManPosition = clonePosition(eatManStartPosition);

  this.initiate = () => {
    console.log(
      `Kicking off minigame with socket emission: ${this.name}`);
    eatManPosition = clonePosition(eatManStartPosition);
    emit(this.name);
  }

  this.socketResponseMap[moveEatManTag] = (direction) => {
    if (direction === 'right'){
      eatManPosition.left+=50;
    } else if (direction === 'left') {
      eatManPosition.left-=50;
    } else if (direction === 'up') {
      eatManPosition.top-=50;
    } else if (direction === 'down') {
      eatManPosition.top+=50;
    }
    emit(moveEatManTag, eatManPosition);
  };
};

module.exports = { client, server };
