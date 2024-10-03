(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

const createSession = (socket) => {
  const session = {
    $gameboard: $(".gameboard"),
    $promptWrap: $(".prompt-wrap"),
    $promptSuper: $(".super-text"),
    $prompt: $(".prompt"),
    $wrapper: $(".wrapper"),
    $join: $("#join"),
    $teamA: $("#teamA"),
    $teamB: $("#teamB"),
    $teamDiv: undefined, //assigned team div
    team: undefined, // a or b
    currGame: "",
    gameStarted: false,
    id: undefined,
  };

  session.flash = (sec) => session.$teamDiv.fadeOut(sec).fadeIn(sec);
  session.tug = () => {
    session.flash(10);
    socket.emit("tug", session.id, session.team);
  };

  return session;
};

module.exports = createSession;

},{}],2:[function(require,module,exports){

const generateCycleMethods = (socket, session, minigames) => {

  function resetState() {
    session.$teamA.width("50%");
    session.$teamB.width("50%");
    session.gameStarted = false;
    session.currGame = "";
    session.$teamDiv = undefined; //assigned team div
    session.team = undefined;
    session.$promptWrap.hide();
    session.id = undefined;

    for (minigame in minigames) {
      minigames[minigame].cleanup()
    }
  }

  session.$join.on("click", function() {
    session.$teamA.width("50%");
    session.$teamB.width("50%");
    session.$join.hide("slow");
    session.$promptWrap.show();

    socket.emit("newPlayer");
  });

  socket.on("teamAssign", function(response) {
    session.team = response.team; // teamA || teamB
    session.id = response.id;
    console.log(`Team: ${session.team}`, `Starting Game: ${session.id}`);
    session.$teamDiv = $("#" + session.team);
  });

  socket.on("countdown", function(sec) {
    if (session.gameStarted) return;
    console.log(`Starting in ${sec} seconds.`);
    session.$promptWrap.show();
    session.$prompt.text(sec);

    // game started variable + team is null > wait til game ends
    if (session.team && !session.gameStarted) {
      session.$promptSuper.text(`You are on: ${session.team}. Game starting in:`);
    } else {
      session.$promptSuper.text("Join the game! Game starting in:");
    }
  });

  socket.on("start", function() {
    if (session.gameStarted) return;
    if (!session.team) return resetState();

    session.$promptWrap.hide();
    session.gameStarted = true;
    session.$gameboard.show();
  });

  socket.on("updateScore", function(scoreObj) {
    // These checks should be unnecessary.
    if (!session.gameStarted || !session.team)   return;
    if (!session.team) return;

    session.$teamA.width(scoreObj.percentA + "%");
    session.$teamB.width(scoreObj.percentB + "%");
  });

  //reset on end
  socket.on("win", function(winner) {
    socket.emit("reset");

    resetState();
    session.$join.show();
    session.$promptWrap.show();
    session.$promptSuper.text(winner + " won!");
    session.$prompt.text("Play again!");
    session.$promptWrap.fadeOut(2000);
    session.$gameboard.hide();
  });

  resetState();
}

module.exports = generateCycleMethods;

},{}],3:[function(require,module,exports){


/* Extracts minigames initialized against client side state into map. */
const extractImportFileMap = (importFileMap, extractImportFile) => {
  return Object.assign({}, ...Object.keys(importFileMap).map(key => {
    console.log(`Adding minigame: ${key}`);
    const extracted = extractImportFile(importFileMap[key]);
    return { [extracted.name]: extracted };
  }));
};

/* Generates a map of minigames initialized to this client's state. */
const generateMinigames = (socket, tug, session) => {
  // Inject ID of current game session into game emissions.
  const emit = (tag, ...args) => socket.emit(tag, session.id, ...args);
  // Automatically import all minigame JS file outputs, extract client logic.
  const minigames = extractImportFileMap(
    ({"clickPic":require("..\\..\\minigames\\clickPic.js"),"dance":require("..\\..\\minigames\\dance.js"),"eatMan":require("..\\..\\minigames\\eatMan.js"),"hiveMind":require("..\\..\\minigames\\hiveMind.js"),"roboPirate":require("..\\..\\minigames\\roboPirate.js"),"spacebar":require("..\\..\\minigames\\spacebar.js"),"teekey":require("..\\..\\minigames\\teekey.js"),"typing":require("..\\..\\minigames\\typing.js")}),
    (minigame) => (new minigame.client(session, emit, tug)).enforceInterface()
  );

  Object.keys(minigames).forEach((minigameName) => {
    const minigame = minigames[minigameName];
    // Build up map of all minigame communication channels to response function
    Object.keys(minigame.socketResponseMap).forEach((key) => {
      socket.on(key, minigame.socketResponseMap[key]);
    })

    // Switch to new minigame and clean up old one on Server signal.
    socket.on(minigameName, (...args) => {
      const lastGame = minigames[session.currGame];
      const nextGame = minigames[minigameName];
      console.log(lastGame, nextGame, args);

      if (lastGame && lastGame.cleanup) lastGame.cleanup();

      session.currGame = minigameName;
      session.$gameboard.html(minigame.instructions);
      if (nextGame && nextGame.begin) nextGame.begin(...args);
    })
  });

  const inputs = ['keyup']; // add to this list to enable more window imputs
  inputs.forEach((input) => {
    $(window)[input](function(event) {
      if (minigames[session.currGame].inputEventResponseMap[input]) {
        minigames[session.currGame].inputEventResponseMap[input](event);
      }
    })
  });

  return minigames;
}

module.exports = generateMinigames;

},{"..\\..\\minigames\\clickPic.js":8,"..\\..\\minigames\\dance.js":9,"..\\..\\minigames\\eatMan.js":10,"..\\..\\minigames\\hiveMind.js":11,"..\\..\\minigames\\roboPirate.js":12,"..\\..\\minigames\\spacebar.js":13,"..\\..\\minigames\\teekey.js":14,"..\\..\\minigames\\typing.js":15}],4:[function(require,module,exports){
//const io = require('socket.io-client');
const createSession = require('./createSession.js');
const generateMinigames = require('./generateMinigames.js');
const generateCycleMethods = require('./generateCycleMethods.js');

$(function() {
  const socket = io();
  const session = createSession(socket);
  const minigames = generateMinigames(socket, session.tug, session);
  generateCycleMethods(socket, session, minigames);
});

},{"./createSession.js":1,"./generateCycleMethods.js":2,"./generateMinigames.js":3}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){

const timer = function(totalMs, increments) {

  const sectionWidth = 5; // px
  const increment = totalMs / increments;
  const sections = [];
  let lock = 0;
  let parent = $(`<div class="timer-container"></div>`);
  this.root = parent;


  for (let i = 0; i < increments; i ++) {
    // const section = $(`<div class="timer" id="timer-${i}"></div>`);
    const section = $(`<div class="timer"></div>`);
    const size = (increments - i) * sectionWidth * 2;
    sections.push(section);

    section.css({
      'width': size,
      'height': size,
      'border-radius': size / 2,
    });

    parent.append(section);
    parent = section;
  }

  this.countdown = (lock, startTimeMs, i) => {
    if (this.lock != lock) return;
    const elapsed = new Date().getTime() - startTimeMs;
    sections[i-1].css({ 'background-color': 'transparent' });

    if (i >= increments) return;
    const nextInverval =
      startTimeMs + ((i + 1) * increment) - new Date().getTime();
    setTimeout(() => this.countdown(lock, startTimeMs, i + 1), nextInverval);
  }

  this.reset = () => {
    lock ++;
    for (const section in sections) {
      sections[section].css({ 'background-color': 'Grey' });
    }
  }

  this.appendTo = (element) => {
    element.append(this.root);
  }

}

module.exports = { timer };

},{}],7:[function(require,module,exports){
const ServerSideMinigame = function(emit) {
  this.name = null;
  this.socketResponseMap = {};

  this.initiate = () => {
    console.log(
      `Kicking off minigame with default (empty) socket emission: ${this.name}`);
    emit(this.name);
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

},{}],8:[function(require,module,exports){
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

},{"./base/client.js":5,"./base/server.js":7}],9:[function(require,module,exports){
const ClientSideMinigame = require("./base/client.js");
const ServerSideMinigame = require("./base/server.js");

const name = "dance";

const client = function(session, emit, tug) {
  ClientSideMinigame.call(this);

  this.name = name;
  this.instructions = "Just DANCE!!";

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

},{"./base/client.js":5,"./base/server.js":7}],10:[function(require,module,exports){
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

},{"./base/client.js":5,"./base/server.js":7}],11:[function(require,module,exports){
const ClientSideMinigame = require("./base/client.js");
const ServerSideMinigame = require("./base/server.js");
const timer =  require("./base/misc.js").timer;

const name = "hiveMind";
const backgroundOptions = [

];

// const hiveDiv = $('<div id="hive"></div>');
// const hiveLeft = $('<div id="hive-left"></div>');
// const hiveRight = $('<div id="hive-right"></div>');
// const timer =

const client = function(session, emit, tug) {
  ClientSideMinigame.call(this);

  this.name = name;
  this.instructions = "Tap into the Hivemind.";
  this.timer = new timer(2000, 16);

  this.begin = () => {
    const left = $(`<div class="hive-left"></div>`);
    const right = $(`<div class="hive-right"></div>`);
    const center = $(`<div class="hive-center"></div>`);
    const container = $(`<div class="hive-container"></div>`);
    const leftOption = $(`<div class="hive-option"></div>`);
    const rightOption = $(`<div class="hive-option"></div>`);
    const input = $(`<div class="input-timer-container"></div>`);
    const leftArrow = $(`<div class="arrow-icon arrow-icon-left"></div>`);
    const rightArrow = $(`<div class="arrow-icon arrow-icon-right"></div>`);
    const leftArrowContainer = $(`<div></div>`);
    const rightArrowContainer = $(`<div></div>`);
    leftArrowContainer.css({
      "position": "absolute",
      "top": "50%",
      "left": "5px",
      "transform": "translate(0%, -50%)",
    })
    rightArrowContainer.css({
      "position": "absolute",
      "top": "50%",
      "right": "5px",
      "transform": "translate(0%, -50%)",
    })

    //const xxx = $(`<div id="xxx"></div>`);

    session.$gameboard.append(container);
    container.append(left);
    container.append(right);
    container.append(center);
    left.append(leftOption);
    right.append(rightOption);
    //center.append(input);
    this.timer.appendTo(center);
    center.append(input);
    input.append(leftArrowContainer);
    input.append(rightArrowContainer);
    leftArrowContainer.append(leftArrow);
    rightArrowContainer.append(rightArrow);
    //center.append(x);



    this.timer.countdown(this.timer.lock, new Date().getTime(), 1);
    console.log(`Starting minigame: ${this.name}`)
  }
}

const server = function(emit) {
  ServerSideMinigame.call(this, emit);
  this.name = name;
};

module.exports = { client, server };

},{"./base/client.js":5,"./base/misc.js":6,"./base/server.js":7}],12:[function(require,module,exports){
const ClientSideMinigame = require("./base/client.js");
const ServerSideMinigame = require("./base/server.js");

const name = "roboPirate";

const client = function(session, emit, tug) {
  ClientSideMinigame.call(this);

  this.name = name;
  this.instructions =
    `They sent RoboPirate from the past and future to destroy the present. Guide her to your team's treasure!`;

  this.begin = () => {
    console.log(`Starting minigame: ${this.name}`)
  }
}

const server = function(emit) {
  ServerSideMinigame.call(this, emit);
  this.name = name;
};

module.exports = { client, server };

},{"./base/client.js":5,"./base/server.js":7}],13:[function(require,module,exports){
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

},{"./base/client.js":5,"./base/server.js":7}],14:[function(require,module,exports){
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

},{"./base/client.js":5,"./base/server.js":7}],15:[function(require,module,exports){
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

},{"./base/client.js":5,"./base/server.js":7}]},{},[4]);
