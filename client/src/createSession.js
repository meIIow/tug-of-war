
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
