const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const url = require('url')
const port = process.env.PORT || 55810;
var _ = require('lodash');

let server = http.createServer();

function uuid () {
  return Math.random().toString(36).substr(2, 12).toUpperCase();
};

class Project {
  constructor(id) {
    this.id = id;
    this.clients = [];
    this.vc = [];
  }
  join(uuid) {
    this.clients.push(uuid);
  }
  unjoin(uuid) {
    _.remove(this.clients, (e) => e == uuid);
  }
  broadcast(msg) {    
    let sendTarget = _.filter([...wss.clients], ({ uuid }) => _.includes(this.clients, uuid));
    const sendMsg = JSON.stringify(msg);
    _.forEach(sendTarget, (client) => {
      console.log(client.uuid)
      client.send(sendMsg)
    })
    console.log(`${this.id}이 [ ${_.map(sendTarget, (e) => e.uuid).join(', ')} ]에게 데이터를 보냄: ${sendMsg}`)
  }
  initVariable(id, val) {
    return this.vc.push({ id: id, value: val }) -1
  }
  getVariable(id) {
    return _.find(this.vc, { id: id }) || this.vc[this.initVariable(id, 0)];
  }
  getList(id) {
    return _.find(this.vc, { id: id }) || this.vc[this.initVariable(id, [])];
  }
}
function isNumber(value) {
  if ("number" == typeof value) return true;
  return !("string" != typeof value || !/^-?\d+\.?\d*$/.test(value))
}

let projects = {};

const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws, req) {
  ws.uuid = uuid();
  ws.projectID = url.parse(req.url, true).query.id;
  if (!projects.hasOwnProperty(ws.projectID)) {
    projects[ws.projectID] = new Project(ws.projectID);
  }
  projects[ws.projectID].join(ws.uuid);

  console.log(`${ws.uuid}가 ${ws.projectID}에 연결함!`);
  
  ws.on('message', function incoming(data) {
    const message = JSON.parse(data);
    console.log(`${ws.uuid}가 ${ws.projectID}로 보낸 데이터를 받음: ${data}`);

    let variable;
    switch (message.type) {
      case 'setVariable':
        variable = projects[ws.projectID].getVariable(message.target.id);
        variable.value = message.value;
        projects[ws.projectID].broadcast({type: 'variable', target: message.target, value: variable.value});
        break;
      case 'changeVariable':
        variable = projects[ws.projectID].getVariable(message.target.id);
        let sumValue;
        if(isNumber(variable.value) && isNumber(message.value))
          sumValue = Number(variable.value) + Number(message.value)
        else
          sumValue = `${variable.value}${message.value}`
        variable.value = sumValue;
        projects[ws.projectID].broadcast({ type: 'variable', target: message.target, value: variable.value });
        break;
      case 'pushList': 
        variable = projects[ws.projectID].getList(message.target.id);
        variable.value.push({ data: message.value })
        projects[ws.projectID].broadcast({ type: 'list', target: message.target, value: variable.value });
        break;
      case 'removeList':
        variable = projects[ws.projectID].getList(message.target.id);
        variable.value.splice(message.value - 1, 1);
        projects[ws.projectID].broadcast({ type: 'list', target: message.target, value: variable.value });
        break;
      case 'insertList':
        variable = projects[ws.projectID].getList(message.target.id);
        variable.value.splice(message.value.index - 1, 0, { data: message.value.data });
        projects[ws.projectID].broadcast({ type: 'list', target: message.target, value: variable.value });
        break;
      case 'changeList':
        // TODO: 통신 지연 시 실제 데이터와 작품의 데이터에 차이가 생겨 [(리스트)의 항목 수] 같은 블록이 실제와 다름. 이 경우 index값이 달라 에러가 생길 수 있음. 해결책 필요
        variable = projects[ws.projectID].getList(message.target.id);
        variable.value[message.value.index - 1].data = message.value.data;
        projects[ws.projectID].broadcast({ type: 'list', target: message.target, value: variable.value });
        break;
      case 'message':
        projects[ws.projectID].broadcast(message);
        break;
      case 'sync':
        ws.send(JSON.stringify({ type: 'sync', data: projects[ws.projectID].vc }))
      default:
        break;
      }
  });

  ws.on('close', function close() {
    projects[ws.projectID].unjoin(ws.uuid);
    console.log(`${ws.uuid}의 연결이 끊김!`)
  });
});

server.listen(port, () => console.log(`포트 ${port}에 서버가 열림!`));