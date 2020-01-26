# 엔트리 '바람' 서버
'바람'의 서버 코드입니다.  
바람 서버는 Node.js로 작동되며, WebSocket을 이용해 클라이언트와 통신합니다.

## '바람'이란?
누구나 소프트웨어 교육을 받을 수 있게 개발된 블록 코딩 플랫폼 [엔트리](https://playentry.org/#!/)의 작품에서  
실시간 변수, 리스트, 신호를 사용할 수 있게 해주는 엔트리 비공식 확장기능입니다.

## 시작하기
```bash
npm install # 의존성 모듈 설치
npm start # 서버 열기
```
환경 변수 PORT에 지정된 포트(없으면 55810)로 서버가 열립니다.  
보안을 위하여 `wss://` 을 사용하는 것을 권장합니다.
