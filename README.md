# Tug of War

## For Users

### What even is this?
This app is a multiplayer tug-of-war over half-baked minigames. See https://github.com/iridium-cs/tug-of-war for the original team repo.

An up-to-date version is hosted via Google App Engine at https://tug-of-war-437621.appspot.com/

### How do I play?
Just head to [the site](https://tug-of-war-437621.appspot.com/) and click `Join` to start a game! You'll be bundled into a session together with anyone who joins during the countdown - so coordinate with some buddies if you want to play together (you'll be divided equally into two teams)!

Every time you do something right, you'll contribute a point for your team - see your team's side grow! Outscore the other team right off the screen to win the session.

The minigames are each a triumph of game design. If they don't actually feel fun to play, that probably says more about you. It takes a truly evolved person to appreciate the surprising/stressful/opaque/underwhelming in life.

## For Devs

### How does it work?
Tug of war is powered by web sockets. It feels almost as though this app was concieved as an excuse to mess around with them. The frontend is jquery with vanilla CSS and the backend is node/express.

There are three main subfolders;

* `/client` contains the style info and frontend lifecycle code.
* `/server` contains basic express boilerplate and the server-side websocket logic for managing a session.
* `/minigames` is the most friendly place to make changes - hopefully you can stay almost entirely in here if you just want to add more game modes.

### Adding new minigames
Each minigame has a client and server side implementation, which are defined in a single file. The psuedo- virtual classes for client and server are defined in `minigames/base`.

Deriving your minigame client and server classes from the base implementations means that the binding logic already present in the server and client code will easily integrate your minigame into the cycle. This is mostly automatic - you just need to import (`require()`) your minigame into `bindMinigames.js` in the server and add it to the `GAME_CYCYLE`.

Many minigames don't need anything besides boilerplate in their serverclass - see `typings.js` as an example. Others (`hiveMind.js`, etc) have user imputs being relayed to the backend for processing, with sockets passing info back and forth during the game.

I wouldn't claim that the design paradigms I used to generalize minigame creation are airtight - but they generally let you add a minigame with the functionality you want without having to worry about introducing bugs to the overall session cycle.

### How can I play around with it on my own?
1. Clone it to your computer. There's lots of guides online for "cloning a repo from github".
2. Make sure you have `npm`, install the node modules you'll need with `npm install` then try building and running the project with `npm run build` and `npm start`. With `npm run build` there's hot reloding (your changes will be reflected automatically in the server), for the most part. See the `package.json` config for the details here.
3. Mess around with the code, break things, and see what went wrong by opening the `Developer tools console` on the webpage and looking for error messages in the console where you ran your npm command. Using `npm run dev` is recommended, so error messages are less opaque.

### How can I host my own instance?
This is a simplified overview - hopefully at least enough so I can figure it out if I need to re-deploy.

1. Log into your Google Cloud Console and create a dedicated project
2. Create a new App Engine app
3. Add an `./app.yaml` file with a line specifying the node runtime (`runtime: nodejs20`) to the root folder of your local copy of the codebase
4. Use the GCloud CLI to deploy your project. See https://github.com/GoogleCloudPlatform/nodejs-docs-samples/tree/main/appengine#deploying

### Can I contribute?
You can clone this and host your own repo if you'd like. I'm unlikely to be actively merging anything here.
