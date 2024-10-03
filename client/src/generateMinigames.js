const bulk = require('bulk-require');

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
    bulk(__dirname + './../../minigames/', ['*.js']),
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
