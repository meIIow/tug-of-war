const ClientSideMinigame = require("./base/client.js");
const ServerSideMinigame = require("./base/server.js");
const timer =  require("./misc/timer.js").rundownTimer;

/**
 * As timer runs down, all users choose a side (left or right).
 * Those who are in the majority get a point! Then the game repeats.
 * 
 * Server .. starts timeout for total time for client to everything (show results, accept choice, and send over)
 * Server -> hiveMind, lock img-l (left choice), img-r (right choice)
 * Client .. Resets game, using new left and right choice imgs, new timer
 * Client .. Waits until response timer hits 0, tracks current choice
 * Client -> hiveMind, lock, choice (0 for no choice, -1 or 1 for left/right)
 * Server .. recieves choices, calculates majority
 * Server -> hiveMindResult, lock, vote difference
 * Client .. some time to post results of last round, highlights in winner/loser color and (on win) tugs
 * [REPEAT]
 */
const name = "hiveMind";
const HIVE_CHOICE_TAG = "hiveChoice"
const HIVE_RESULT_TAG = "hiveResult"
const IMG_COUNT = 10
const RESULT_TIMEOUT_MS = 1000;
const RESPONSE_TIMEOUT_MS = 2000;
const PROCESSING_TIMEOUT_MS = 500;
const CYCLE_TIME_MS = RESULT_TIMEOUT_MS + RESPONSE_TIMEOUT_MS + PROCESSING_TIMEOUT_MS;

const ACTIVE_COLOR = 'cyan'

// Generate array that contains all rorschach blob relative paths
const array_01_to_10 = Array.from(
  {length:IMG_COUNT},
  (v,k)=>(k+1).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})
);
const backgroundOptionUrls = array_01_to_10.map((i) => `./img/Rorschach_blot_${i}.jpg`);

const client = function(session, emit, tug) {
  ClientSideMinigame.call(this);

  this.name = name;
  this.instructions = "Tap into the Hivemind. Left - or Right?";
  this.state = {};
  this.lock = -1
  this.choice = 0;

  this.begin = (lock, leftImageId, rightImageId) => {
    this.lock = lock;

    const container = this.generateGameBoard(leftImageId, rightImageId);
    this.state[lock] = this.generateState(container);
    this.state[lock].timer.appendTo(container.children('.hive-center').first())

    console.log(`Starting minigame: ${this.name}`)
    this.startResponsePhase(lock);
  }

  this.inputEventResponseMap.keyup = (event) => {
    if (event.keyCode === 37) {
      console.log('recieved left input');
      left = session.$gameboard.find('.hive-left.hive-chooseable');
      right = session.$gameboard.find('.hive-right.hive-chooseable');
      if (left.length) left.first().css('background-color', ACTIVE_COLOR);
      if (right.length) right.first().css('background-color', 'darkgray');
      this.choice = -1;
    }
    if (event.keyCode === 39) {
      console.log('recieved right input');
      left = session.$gameboard.find('.hive-left.hive-chooseable');
      right = session.$gameboard.find('.hive-right.hive-chooseable');
      if (left.length) left.first().css('background-color', 'darkgray');
      if (right.length) right.first().css('background-color', ACTIVE_COLOR);
      this.choice = 1;
    }
  };

  this.socketResponseMap[HIVE_RESULT_TAG] = (lock, result) => {
    inMajority = result * this.state[lock].locked_choice > 0;
    console.log(`Was in Hivemind majority? ${inMajority}`)

    // Choose option border highlight colors based on result
    leftHighlight = 'slategray';
    rightHighlight = 'slategray';
    if (result < 0) {
      leftHighlight = inMajority ? 'greenyellow' : 'maroon';
    } else if (result > 0) {
      rightHighlight = inMajority ? 'greenyellow' : 'maroon';
    }

    let resultText = inMajority ? 'Success!' : 'Failure.';
    resultText = !result ? 'Deadlock...' : resultText;
    const resultBox = $(`<div class="hive-result"></div>`);
    resultBox.html(`<span class="text-overflow-center">${resultText}</span>`);
    this.state[lock].container.append(resultBox);

    this.state[lock].left.css("background-color", leftHighlight)
    this.state[lock].right.css("background-color", rightHighlight)

    if (inMajority) tug();
  }

  this.generateState = (container) => {
    return {
      choice: 0,
      choice_lock: 0,
      timer: new timer(RESPONSE_TIMEOUT_MS, 32, ACTIVE_COLOR),
      container: container,
      left: container.find(".hive-left"),
      right: container.find(".hive-right"),
    };
  }

  this.generateResultBorderHighlights = (result, choice) => {
    return [leftHighlight, rightHighlight];
  }

  this.generateGameBoard = (leftImageId, rightImageId) => {
    const container = $(`<div class="hive-container"></div>`);

    const left = $(`<div class="hive-left hive-chooseable"></div>`);
    const right = $(`<div class="hive-right hive-chooseable"></div>`);
    const center = $(`<div class="hive-center"></div>`);
    container.append(left);
    container.append(right);
    container.append(center);

    const leftOption = $(`<div class="hive-option"></div>`);
    const rightOption = $(`<div class="hive-option"></div>`);
    leftOption.css('background-image', `url(${backgroundOptionUrls[leftImageId]})`);
    rightOption.css('background-image', `url(${backgroundOptionUrls[rightImageId]})`);
    left.append(leftOption);
    right.append(rightOption);

    session.$gameboard.append(container);
    return container;
  }

  this.startResponsePhase = (lock, leftImageId, rightImageId) =>  {
    if (lock < this.lock) return
    this.choice = 0;
    this.state[lock].timer.reset();
    this.state[lock].timer.countdown(
      this.state[lock].timer.lock, new Date().getTime(), 1, () => this.sendResponse(lock));
  }

  this.sendResponse = (lock) =>  {
    if (lock < this.lock) return;
    this.state[lock].left.removeClass('hive-chooseable');
    this.state[lock].right.removeClass('hive-chooseable');
    this.state[lock].locked_choice = this.choice;
    console.log(`Choice for hivemand round ${lock}: ${this.state[lock].locked_choice}`);
    emit(HIVE_CHOICE_TAG, lock, this.state[lock].locked_choice);
  }
}

const server = function(emit) {
  ServerSideMinigame.call(this, emit);
  this.name = name;
  this.voteDifference = 0;
  this.lock = 0; // increments each time game is started/ended, so lingering processing can stop

  this.cleanup =() => {
    console.log(`Minigame lock is no longer active: ${this.name}`);
    this.lock++;
  }

  this.initiate = () => {
    this.reset();
    this.lock++;
    this.cycleHivemindSetup(this.lock);
  }

  this.reset = () => {
    this.voteDifference = 0
  }

  this.chooseImageIds = () => {
    // Choose left image index first
    const leftImageId = Math.floor(Math.random() * IMG_COUNT);
    // Then choose right image index from remaining ones
    let rightImageId = Math.floor(Math.random() * (IMG_COUNT-1));
    if (rightImageId >= leftImageId) rightImageId++
    return [leftImageId, rightImageId]
  }

  this.cycleHivemindSetup = (lock) => {
    console.log(lock, this.lock)
    if (lock < this.lock) return;
    console.log(`Kicking off round of minigame: ${this.name}`)
    const [leftImageId, rightImageId] = this.chooseImageIds();
    console.log(`Emitting: minigame ${this.name} with images ${leftImageId} & ${rightImageId}`)
    this.reset();
    emit(this.name, lock, leftImageId, rightImageId);
    setTimeout(() => this.cycleHivemindResult(lock), RESPONSE_TIMEOUT_MS + PROCESSING_TIMEOUT_MS);
  }

  this.cycleHivemindResult = (lock) => {
    if (lock < this.lock) return;
    console.log(`Emitting results of minigame: ${this.name} had vote difference ${this.voteDifference}`)
    emit(HIVE_RESULT_TAG, lock, this.voteDifference);
    setTimeout(() => this.cycleHivemindSetup(lock), RESULT_TIMEOUT_MS);
  }

  this.socketResponseMap[HIVE_CHOICE_TAG] = (lock, direction) => {
    if (lock == this.lock) this.voteDifference += direction;
  };
};

module.exports = { client, server };
