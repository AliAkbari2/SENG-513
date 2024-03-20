const express = require("express");
const socket = require("socket.io");
const http = require("http");

const app = express();
const PORT = 3000 || process.env.PORT;
const server = http.createServer(app);

// Set static folder
app.use(express.static("public"));

// Socket setup
const io = socket(server);

// rooms array
let rooms = [];

io.on("connection", (socket) => {
  console.log("Made socket connection", socket.id);

  socket.on("createRoom", (data) => {
    console.log("Rooms, before: ", rooms);
    let room = rooms.find((room) => room.roomId === data.gameRoomPass);
    let sockets = [];
    if (!room) {
      sockets.push(socket);
      let room = {
        roomId: data.gameRoomPass,
        playerOneName: data.firstPlayerName,
        playerTwoName: "",
        playerThreeName: "",
        numberOfPlayersThatNeedToJoin: data.numberOfPlayers - 1,
        totalNumberOfPlayers: data.numberOfPlayers,
        sockets: sockets,
      };
      rooms.push(room);
      socket.join(data.gameRoomPass);
      console.log("Rooms, after: ", rooms);
    } else {
      if (room.numberOfPlayersThatNeedToJoin !== 0) {
        let indexOfClientWhoLeft = room.sockets.indexOf("socketLeft");
        if (indexOfClientWhoLeft !== -1) {
          console.log("Room before joining1: ", room);
          room.sockets[indexOfClientWhoLeft] = socket;
          room.numberOfPlayersThatNeedToJoin -= 1;
          clientRejoined = true;
          socket.join(data.gameRoomPass);
          console.log("Room After joining: ", room);
        }
      } else {
        socket.emit("message", "Sorry lobby is filled up.");
      }
    }
  });

  socket.on("joinRoom", (data) => {
    let room = rooms.find((room) => room.roomId === data.gameRoomPass);
    let clientRejoined = false;
    let clientJoined = false;
    if (room && room.sockets.length <= room.totalNumberOfPlayers) {
      if (room.playerTwoName === "") {
        room.playerTwoName = data.playerName;
      } else {
        room.playerThreeName = data.playerName;
      }
      if (room.sockets.length < room.totalNumberOfPlayers) {
        let indexOfClientWhoLeft = room.sockets.indexOf("socketLeft");
        if (indexOfClientWhoLeft !== -1) {
          console.log("index is: ", indexOfClientWhoLeft);
          console.log("Room before joining1: ", room);
          room.sockets[indexOfClientWhoLeft] = socket;
          clientRejoined = true;
        } else {
          console.log("Room before joining2: ", room);
          room.sockets.push(socket);
          clientJoined = true;
        }
        room.numberOfPlayersThatNeedToJoin -= 1;
        socket.join(data.gameRoomPass);
        console.log("Room After joining: ", room);
      } else if (room.sockets.length === room.totalNumberOfPlayers) {
        let indexOfClientWhoLeft = room.sockets.indexOf("socketLeft");
        if (indexOfClientWhoLeft !== -1) {
          console.log("index is: ", indexOfClientWhoLeft);
          console.log("Room before joining3: ", room);
          room.sockets[indexOfClientWhoLeft] = socket;
          room.numberOfPlayersThatNeedToJoin -= 1;
          clientRejoined = true;
          socket.join(data.gameRoomPass);
          console.log("Room After joining: ", room);
        }
      }

      if (clientRejoined) {
        socket.emit("rejoinedGame");
        socket.emit("openWaiting");
        if (room.numberOfPlayersThatNeedToJoin === 0) {
          socket.emit("removeWaitingModal");
          socket.to(data.gameRoomPass).emit("removeWaitingModal");
        }
      }
      if (room.numberOfPlayersThatNeedToJoin === 0 && !clientRejoined) {
        if (clientJoined) {
          room.sockets.forEach((socket, i) => {
            dataToSend = {
              gameId: data.gameRoomPass,
              playerNumber: i + 1,
              numberOfPlayer: room.totalNumberOfPlayers,
              playerOneName: room.playerOneName,
              playerTwoName: room.playerTwoName,
              playerThreeName: room.playerThreeName,
            };
            socket.emit("startGame", dataToSend);
          });
        } else {
          socket.emit("message", "Sorry lobby is filled up.");
        }
      }
    } else {
      socket.emit("message", "No room with that password to join!");
    }
  });

  socket.on("highLightForOthers", (data) => {
    socket.to(data.gameRoomPass).emit("highlight", data);
  });

  socket.on("lineDrawn", (data) => {
    socket.to(data.gameRoomPass).emit("drawOthersLines", data);
  });

  socket.on("changePlayerTurn", (data) => {
    socket.to(data.gameRoomPass).emit("changeTurns", data);
  });

  socket.on("disconnect", () => {
    rooms.forEach((room) => {
      console.log("Room before disconnect: ", room);
      room.sockets.forEach((socketInArray, i) => {
        if (socketInArray.id === socket.id) {
          console.log("Player ", i + 1, "disconnected");
          room.sockets[i] = "socketLeft";
          room.numberOfPlayersThatNeedToJoin += 1;
          console.log("Room after disconnect: ", room);
          socket.to(room.roomId).emit("openWaiting");
        }
      });
    });
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
