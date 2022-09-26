import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 4200;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("hi there");
});

app.get("/directory-files", (req, res) => {
  fs.readdir("./", (err, files) => {
    res.json(files);
  });
});

app.get("/cwd", (req, res) => {
  res.send(path.basename(process.cwd()));
});

app.post("/new_file", (req, res) => {
  const { name } = req.body;
  fs.writeFile(`./${name}`, "", (e) => {
    if (e) {
      res.sendStatus(200);
    } else {
      res.send("Created");
    }
  });
});

io.on("connection", () => {
  console.log("got connection");
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
