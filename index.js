const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const url = require('url')
const port = process.env.PORT || 55810;

let server = http.createServer();

function uuid () {
  return Math.random().toString(36).substr(2, 12).toUpperCase();
};

const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws, req) {
  ws.uuid = uuid();
  ws.projectID = url.parse(req.url, true).query.id;
  console.log(`${ws.uuid}가 ${ws.projectID}에 연결함!`);
  
  ws.on('message', function incoming(data) {
    switch (JSON.parse(data).type) {
      case 'syncPls':
        const syncTarget = wss.clients.find(client => client.readyState === WebSocket.OPEN && client.projectID === ws.projectID)
        ws.syncPls = true;
        syncTarget.send(JSON.stringify({ type: "syncPls" }));
        break;
      case 'sync':
        const syncPls = wss.clients.find(client => client.readyState === WebSocket.OPEN && client.projectID === ws.projectID && syncPls)
        delete ws.syncPls;
        syncPls.send(JSON.stringify({ type: "sync", data: data }));
        break;
      default:
        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN && client.projectID === ws.projectID) {
            client.send(data);
          }
        });
        console.log(`${ws.uuid}가 ${ws.projectID}로 데이터를 보냄: ${data}`);
        break;
    }

  });

  ws.on('close', function close() {
    console.log(`${ws.uuid}의 연결이 끊김!`)
  });
});

server.listen(port, () => console.log(`포트 ${port}에 서버가 열림!`));