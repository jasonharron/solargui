const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/my-solar-system_all_adapted-from-phet.xhtml");
});

////////////////////////
// Socket Connection //
//////////////////////

io.sockets.on("connection", (socket) => {
  socket.on("bodiesDown", function (data) {
    socket.broadcast.emit("bodiesDown", data);
  });
  socket.on("bodiesUp", function (data) {
    socket.broadcast.emit("bodiesUp", data);
  });
  socket.on("reset", function (data) {
    socket.broadcast.emit("reset", data);
  });
    socket.on("clearTrail", function (data) {
    socket.broadcast.emit("clearTrail", data);
  });
  socket.on("clearTrails", function (data) {
    socket.broadcast.emit("clearTrails", data);
  });
  socket.on("play", function (data) {
    socket.broadcast.emit("play", data);
  });
    socket.on("playPosition", function (data) {
    socket.broadcast.emit("playPosition", data);
  });
  socket.on("slow", function (data) {
    socket.broadcast.emit("slow", data);
  });
  socket.on("normal", function (data) {
    socket.broadcast.emit("normal", data);
  });
  socket.on("fast", function (data) {
    socket.broadcast.emit("fast", data);
  });
  socket.on("down", function (data) {
    socket.broadcast.emit("down", data);
  });
  socket.on("up", function (data) {
    socket.broadcast.emit("up", data);
  });
  socket.on("reset", function (data) {
    socket.broadcast.emit("reset", data);
  });
  socket.on("rewind", function (data) {
    socket.broadcast.emit("rewind", data);
  });
  socket.on("slider", function (data) {
    socket.broadcast.emit("slider", data);
  });
  socket.on("sliderSelect", function (data) {
    socket.broadcast.emit("sliderSelect", data);
  });
  socket.on("selectedObjectMoved", function (data) {
    socket.broadcast.emit("selectedObjectMoved", data);
  });

  socket.on("updateBodies", function (data) {
    socket.broadcast.emit("updateBodies", data);
  });

  socket.on("updateBodiesAndMeshes", function (data) {
    socket.broadcast.emit("updateBodiesAndMeshes", data);
  });
   socket.on("userSelect", function (data) {
    socket.broadcast.emit("userSelect", data);
  });
});

//////////////////////////////////
//  Listen to the socket port  //
////////////////////////////////

server.listen(3000, () => {
  console.log("listening on *:3000");
});
