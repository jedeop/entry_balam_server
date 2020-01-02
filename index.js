const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');
const url = require('url')
const option = {
  key: fs.readFileSync('./SSL/server-key.pem'),
  cert: fs.readFileSync('./SSL/server-crt.pem')
}
const port = process.env.PORT || 55810;

let server = https.createServer(option)

function uuid () {
  return Math.random().toString(36).substr(2, 12).toUpperCase();
};

const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws, req) {
  ws.uuid = uuid();
  ws.projectID = url.parse(req.url, true).query.id;
  console.log(`${ws.uuid}가 ${ws.projectID}에 연결함!`);
  
  ws.on('message', function incoming(data) {
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN && client.projectID === ws.projectID) {
        client.send(data);
      }
    });
    console.log(`${ws.uuid}가 ${ws.projectID}로 신호를 보냄: ${data}`);
  });

  ws.on('close', function close() {
    console.log(`${ws.uuid}의 연결이 끊김!`)
  });
});

server.listen(port, () => console.log(`포트 ${port}에 서버가 열림!`));