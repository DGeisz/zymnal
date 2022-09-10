import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 4200;

app.get("/", (req, res) => {
  res.send("hi there");
});

io.on("connection", () => {
  console.log("got connection");
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
