
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
