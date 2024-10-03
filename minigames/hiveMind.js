const ClientSideMinigame = require("./base/client.js");
const ServerSideMinigame = require("./base/server.js");
const timer =  require("./misc/timer.js").rundownTimer;

/**
 * As timer runs down, all users choose a side (left or right).
 * Those who are in the majority get a point! Then the game repeats.
 * 
 * Server .. starts timeout for total time for client to everything (show results, accept choice, and send over)
 * Server -> hiveMind, lock img-l (left choice), img-r (right choice), prev-majority (0 first time / on tie, then + or - num)
 * Client .. some time to post results of last round, highlights in winner/loser color and (on win) tugs
 * Client .. Resets game, using new left and right choice imgs, new timer
 * Client .. Waits until response timer hits 0, tracks current choice
 * Client -> hiveMind, lock, choice (0 for no choice, -1 or 1 for left/right)
 * Server .. recieves choices, calculates majority
 * [REPEAT]
 */
const name = "hiveMind";
const HIVE_CHOICE_TAG = "hiveChoice"
const IMG_COUNT = 10
const RESULT_TIMEOUT_MS = 1000;
const RESPONSE_TIMEOUT_MS = 2000;
const PROCESSING_TIMEOUT_MS = 500;
const CYCLE_TIME_MS = RESULT_TIMEOUT_MS + RESPONSE_TIMEOUT_MS + PROCESSING_TIMEOUT_MS;

const ACTIVE_COLOR = 'purple'

// Generate array that contains all rorschach blob relative paths
const array_01_to_10 = Array.from(
  {length:IMG_COUNT},
  (v,k)=>(k+1).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})
);
const backgroundOptionUrls = array_01_to_10.map((i) => `../client/img/Rorschach_blot_${i}.jpg`);

const client = function(session, emit, tug) {
  ClientSideMinigame.call(this);

  this.name = name;
  this.instructions = "Tap into the Hivemind. Left - or Right?";
  this.timer = new timer(RESPONSE_TIMEOUT_MS, 16, ACTIVE_COLOR);
  this.choice = 0;
  this.locked_choice = 0;

  this.begin = (lock, leftImageId, rightImageId, result) => {
    const container = this.generateGameBoard();
    this.timer.appendTo(container.children('.hive-center').first())

    this.choice = 0;
    this.timer.countdown(this.timer.lock, new Date().getTime(), 1);
    console.log(`Starting minigame: ${this.name}`)
    this.showResults(lock, leftImageId, rightImageId, result);
  }

  this.inputEventResponseMap.keyup = (event) => {
    if (event.keyCode === 37) this.choice = -1;
    if (event.keyCode === 39) this.choice = 1;
  };

  this.generateGameBoard = () => {
    const container = $(`<div class="hive-container"></div>`);

    const left = $(`<div class="hive-left"></div>`);
    const right = $(`<div class="hive-right"></div>`);
    const center = $(`<div class="hive-center"></div>`);
    container.append(left);
    container.append(right);
    container.append(center);

    const leftOption = $(`<div class="hive-option"></div>`);
    const rightOption = $(`<div class="hive-option"></div>`);
    left.append(leftOption);
    right.append(rightOption);

    session.$gameboard.append(container);
    return container;
  }

  this.showResults = (lock, leftImageId, rightImageId, result) => {
    inMajority = result * this.locked_choice > 0;
    console.log(`Was in majority? ${inMajority}`)
    // TODO: locked choice becomes color based on majority or not
    if (inMajority) tug();

    setTimeout(() => this.startResponsePhase(lock, leftImageId, rightImageId), RESULT_TIMEOUT_MS);
  }

  this.startResponsePhase = (lock, leftImageId, rightImageId) =>  {
    // TODO: start timer
    setTimeout(() => this.sendResponse(lock), RESPONSE_TIMEOUT_MS);
  }

  this.sendResponse = (lock) =>  {
    this.locked_choice = this.choice;
    console.log(this.locked_choice, this.choice, lock)
    // TODO: Fade everything else
    emit(HIVE_CHOICE_TAG, lock, this.locked_choice);
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
    this.cycleHivemind(this.lock);
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

  this.cycleHivemind = (lock) => {
    console.log(lock, this.lock)
    if (lock < this.lock) return;
    console.log(`Another round of minigame: ${this.name}`)
    const [leftImageId, rightImageId] = this.chooseImageIds();
    console.log(`Emitting: minigame ${this.name} with images ${leftImageId} & ${rightImageId} and previous vote diff ${this.voteDifference}`)
    emit(this.name, lock, leftImageId, rightImageId, this.voteDifference);
    this.reset();
    setTimeout(() => this.cycleHivemind(lock), CYCLE_TIME_MS);
  }

  this.socketResponseMap[HIVE_CHOICE_TAG] = (lock, direction) => {
    if (lock == this.lock) this.voteDifference += direction;
  };
};

module.exports = { client, server };
