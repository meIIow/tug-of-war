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
