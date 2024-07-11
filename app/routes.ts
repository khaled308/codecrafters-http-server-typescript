import fs from "node:fs";
import zlib from "node:zlib";

const parseRequest = (request: string) => {
  const requestArr = request.split("\r\n");
  const requestLine = requestArr[0];

  const [method, path] = requestLine.split(" ");

  const headers: { [key: string]: string } = {};

  for (let i = 1; i < requestArr.length; i++) {
    if (requestArr[i].trim() === "") break;
    const [key, value] = requestArr[i].split(": ");
    headers[key] = value;
  }

  const body = requestArr.slice(Object.keys(headers).length + 1).join("");

  return { method, path, headers, body };
};

const routes = (request: string) => {
  const { method, path, headers, body } = parseRequest(request);

  let httpResponse = `HTTP/1.1 404 Not Found\r\n\r\n`;

  if (method === "GET" && path === "/") {
    httpResponse = `HTTP/1.1 200 OK\r\n\r\n`;
  } else if (method === "GET" && path.startsWith("/echo/")) {
    const responseBody = path.split("/echo/")[1];

    if (
      headers["Accept-Encoding"] &&
      headers["Accept-Encoding"].includes("gzip")
    ) {
      const buffer = Buffer.from(responseBody, "utf-8");
      const gzippedBody = zlib.gzipSync(buffer);
      httpResponse =
        `HTTP/1.1 200 OK\r\n` +
        `Content-Type: text/plain\r\n` +
        `Content-Encoding: gzip\r\n` +
        `Content-Length: ${gzippedBody.length}\r\n` +
        `\r\n`;

      return Buffer.concat([Buffer.from(httpResponse), gzippedBody]);
    } else {
      httpResponse =
        `HTTP/1.1 200 OK\r\n` +
        `Content-Type: text/plain\r\n` +
        `Content-Length: ${responseBody.length}\r\n` +
        `\r\n${responseBody}`;
    }
  } else if (method === "GET" && path === "/user-agent") {
    httpResponse =
      `HTTP/1.1 200 OK\r\n` +
      `Content-Type: text/plain\r\n` +
      `Content-Length: ${headers["User-Agent"].length}\r\n` +
      `\r\n${headers["User-Agent"]}`;
  } else if (path.startsWith("/files/")) {
    const args = process.argv.slice(2);
    const [___, absPath] = args;
    const file = absPath + path.split("/files/")[1];

    if (method === "GET") {
      try {
        const content = fs.readFileSync(file);
        httpResponse =
          `HTTP/1.1 200 OK\r\n` +
          `Content-Type: application/octet-stream\r\n` +
          `Content-Length: ${content.length}\r\n` +
          `\r\n${content}`;
      } catch (error) {
        httpResponse = "HTTP/1.1 404 Not Found\r\n\r\n";
      }
    } else if (method === "POST") {
      fs.writeFileSync(file, body);
      httpResponse = "HTTP/1.1 201 Created\r\n\r\n";
    }
  }

  return httpResponse;
};

export default routes;
