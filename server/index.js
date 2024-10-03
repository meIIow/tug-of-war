// Setup basic express server
var express = require("express");
var app = express();
var path = require("path");
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var port = process.env.PORT || 9000;
var minigames = require("./bindMinigames.js");

server.listen(port, function() {
  console.log("Server listening at port %d", port);
});

// Routing
app.use(express.static(path.join(__dirname + './..', "client")));

const createSession = (id) => {
  const session = {
    numPlayers: 0,
    teamAScore: 0,
    teamBScore: 0,
    started: false,
    teamCount: [0, 0],
    complete: false,
    id,
  };
  const emit = (...args) => io.to(session.id).emit(...args);
  session.gameCycle = minigames.generateGameCycle(emit, session);
  session.gameKickoffCycle = minigames.generateGameKickoffCycle(session.gameCycle);
  session.gameCleanupCycle = minigames.generateGameCleanupCycle(session.gameCycle);
  return session;
}

// Game Data
const secs = 3; // 10; // countdown in secs
const cycleTimer = 15000;
const winMargin = 100;
const teams = ["teamA", "teamB"];
let gamesPlayed = 0;
let nextGame = createSession(gamesPlayed);

const countdown = (session, time) => {
  if (time > 0) {
    io.emit("countdown", time); // emit new countdown num
    setTimeout(() => countdown(session, time - 1), 1000); // calls itself again after one sec
  } else {
    start(session);
    cycle(session, 0)
  }
}

const start = (session) => {
  session.started = true;
  gamesPlayed ++;
  nextGame = createSession(gamesPlayed);
  io.emit("start"); // tells all sockets the game has begun
  console.log(`Starting new game session: ${session.id}`);
}

const cycle = (session, cycleCount) => {
  session.gameCleanupCycle[(cycleCount+session.gameKickoffCycle.length-1) % session.gameKickoffCycle.length]();
  if (session.complete) return;
  session.gameKickoffCycle[cycleCount % session.gameKickoffCycle.length]();
  setTimeout(() => cycle(session, cycleCount + 1), cycleTimer);
}

const getWeightedScores = (session) => { // weights scores, finds difference
  let weightedA = session.teamAScore * (session.teamCount[1] || 1) / session.numPlayers;
  let weightedB = session.teamBScore * (session.teamCount[0] || 1) / session.numPlayers;
  return (weightedA - weightedB);
}

io.on("connection", function(socket) {

  socket.on("reset", function() {
    // called by all active sockets when game ends
    socket.session = false;
  });

  socket.on("newPlayer", function(player) {
    if (socket.session) return; // cannot join if already joined or game started
    if (!nextGame.numPlayers) {
      countdown(nextGame, secs);
    } // start countdown on first added player

    // we store the player information in the socket session for this client
    //socket.player = player;
    socket.session = nextGame;
    socket.team = teams[socket.session.numPlayers % 2]; // alternates teamA and teamB
    socket.session.teamCount[socket.session.numPlayers % 2]++;
    socket.session.numPlayers++;
    minigames.bindGameSocketResponses(socket.session.gameCycle, socket, socket.session);
    socket.join(socket.session.id);


    // emit to that particular player what team he/she is on
    socket.emit("teamAssign", {
      team: socket.team,
      id: nextGame.id,
    });
  });

  socket.on("tug", function(num, team, tugs) {
    const session = socket.session; // convenience
    // If this game just ended, ignore.
    if (!session || !session.started || session.complete) return;

    // update score based on team
    if (team === "teamA") {
      session.teamAScore++;
    } else {
      session.teamBScore++;
    }
    // check for win
    const weightedScores = getWeightedScores(session);
    if (Math.abs(weightedScores) >= winMargin) {
      const winner = weightedScores > 0 ? "teamA" : "teamB";
      io.to(session.id).emit("win", winner);
      session.complete = true;
    }
    // emit updated score
    let percent = (50 * weightedScores / winMargin) + 50;
    if (percent > 100) percent = 100;
    if (percent < 0) percent = 0;
    io.to(session.id).emit("updateScore", {
      teamA: session.teamAScore,
      teamB: session.teamBScore,
      percentA: percent,
      percentB: 100 - percent,
    });
  });
});
