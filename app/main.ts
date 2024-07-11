import * as net from "net";
import routes from "./routes";

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
  socket.on("close", () => {
    socket.end();
  });

  socket.on("data", (data) => {
    const request = data.toString();
    const httpResponse = routes(request);
    socket.write(httpResponse);

    socket.end();
  });
});

server.listen(4221, "localhost");
