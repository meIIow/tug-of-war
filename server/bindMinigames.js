const ClickPic = require("./../minigames/clickPic.js");
const Dance = require("./../minigames/dance.js");
const EatMan = require("./../minigames/eatMan.js");
const Spacebar = require("./../minigames/spacebar.js");
const Typing = require("./../minigames/typing.js");
const TeeKey = require("./../minigames/teekey.js");
const HiveMind = require("./../minigames/hiveMind.js");

const GAME_CYCYLE = [
  ClickPic,
  HiveMind,
  Dance,
  EatMan,
  Spacebar,
  Typing,
  // TeeKey,
];

/* Binds server side minigame list to a specific game sessions emission func. */
const generateGameCycle = (emit, session) => {
  return GAME_CYCYLE.map((game) => new game.server(emit));
}

/* Convenience function, creates list of start functions to easily call. */
const generateGameKickoffCycle = (gameCycle) => {
  return gameCycle.map((game) => game.initiate);
};

/* Convenience function, creates list of cleanup functions to easily call. */
const generateGameCleanupCycle = (gameCycle) => {
  return gameCycle.map((game) => game.cleanup);
};

/* Binds minigame responses to client-side emissions. */
const bindGameSocketResponses = (gameCycle, socket, session) => {
  gameCycle.forEach((game) => {
    for (const socketResponse in game.socketResponseMap) {
      socket.on(socketResponse, (id, ...args) => {
        if (session.id != id) return;
        game.socketResponseMap[socketResponse](...args);
      });
    }
  });
}

module.exports = {
  generateGameCycle,
  generateGameKickoffCycle,
  generateGameCleanupCycle,
  bindGameSocketResponses,
};
