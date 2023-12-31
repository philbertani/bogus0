import React, { useState, useEffect, useDebugValue } from 'react';
import { socket } from './socket';

//import { ConnectionState } from './components/ConnectionState';
//import { Events} from './components/Events';


import { GameBoard } from './components/GameBoard';
import bogusMain from './common/bogus.js';
import {cloneArray} from './common/utils.js';
import {v4 as uuidv4} from 'uuid';
import './App.css';


//import GPU from './components/3d/GPU.js';

//if we lose connection and reload page, load the previous board from
//localStorage

export default function App() {

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [fooEvents, setFooEvents] = useState([]);
  const [mainGame, setMainGame] = React.useState();
  const [doneOne, setDoneOne] = React.useState(false);
  const [reset, setReset] = React.useState(false);

  const foundWordsRef = React.useRef({words:[]});
  const [foundWords, setFoundWords] = React.useState( {} );  //we need to persist this across page refreshes and reconnects
  const [isDuplicateProcess, setIsDuplicateProcess] = React.useState(false);
  const [checkConnection, setCheckConnection] = React.useState(false);

  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  const [allWordsFound, setAllWordsFound] = React.useState( {} );

  const [heartbeatTime, setHeartbeatTime] = React.useState(0);
  const [waitingForHeartbeat,setWaitingForHeartbeat] = React.useState(false);

  const [stats, setStats] = React.useState({});
  const [is3d, setIs3d] = React.useState(false);
  const [roomInfo,setRoomInfo] = React.useState([]);

  const [currentRoomId, setCurrentRoomId] = React.useState(0);
  const [latestWord, setLatestWord] = React.useState("");
  const [playerInfo, setPlayerInfo] = React.useState([]);

  //const countx = React.useRef(0);
  //countx.current ++;
  //if ( countx.current%100===0) console.log('App count',countx.current);

  useEffect(() => {

    if (isConnected && !waitingForHeartbeat) {
      const heartbeatId = uuidv4();
      const time = Date.now();
      socket.emit("heartbeat", {heartbeatId, time });
      setHeartbeatTime(0);
      setWaitingForHeartbeat(true);
    }

    //return () => clearInterval(heartbeat);
  }, [isConnected, waitingForHeartbeat]);

  useEffect( ()=> {
    const hb = setInterval( ()=>{
      setHeartbeatTime(heartbeatTime + 1)
    }, 1000);

    //what to do if heartbeatTime gets too big??
    //if (heartbeatTime > 3) console.log(Date.now(),heartbeatTime);

    return ()=> clearInterval(hb);

  }, [heartbeatTime]);

  useEffect ( ()=>{

    if (checkConnection && !isDuplicateProcess ) {
      console.log("trying to reconnect");
      //on disconnect we needed to actually close the socket to force the server to remove it
      //reinitialize the socket connection so it will automatically try to reconnect
      socket.connect();
      setCheckConnection(false);
    }

  } ,[checkConnection, isDuplicateProcess] );

  useEffect(() => {

    function onConnect(msg) {
      setIsConnected(true);

      let userId = localStorage.getItem("bogusId");
      if ( !userId ) {
        const uuid = uuidv4();
        localStorage.setItem("bogusId",uuid);
        userId = uuid;
      } 

      let sessionId = sessionStorage.getItem("bogusId");
      if ( !sessionId ) {
        const uuid = uuidv4();
        sessionStorage.setItem("bogusId",uuid);
        sessionId = uuid;        
      }
      setReset(true);

      let roomId = localStorage.getItem("bogusRoomId");
      if (roomId == null) roomId = 0;
      setCurrentRoomId(roomId);

      const userName = localStorage.getItem("bogusUserName");

      console.log("current room id",roomId);

      socket.emit('current board',{userId,sessionId,roomId,userName}); //since we are connected ask for the current board

    }

    function onDisconnect() {
      socket.disconnect();
      setIsConnected(false);

      if ( !isDuplicateProcess) {
        setCheckConnection(true);
      }
    }

    function onFooEvent(value) {
      setFooEvents(previous => [...previous, value]);
    }

    function onNewBoard(msg) {

      //if the boards are the same then do not clear the found words array
      //if ( !mainGame.boardsAreSame(msg.game.board) ) { setFoundWords({});}
      //we need to save found words in local storage or on server

      //const mainGameX = new bogusMain( {words:["none"], definitions:["none"]} );

      const mainGameX = new bogusMain( {words:msg.words, definitions:msg.defs},msg.boardType, msg.gameType );
      console.log('new board msg',msg.game);

      mainGameX.board = cloneArray(msg.game.board);
      mainGameX.output = cloneArray(msg.game.output);

      mainGameX.boardId = msg.boardId;
      mainGameX.roomId = msg.roomId;

      if ( msg.bogus3d ) {
        console.log('3d is coming through!', msg.bogus3d);
        setIs3d(true);
      }

      setMainGame(mainGameX);
      //console.log(mainGame.definitions);
      window.bogus = mainGameX;  //remove this when we are live on the internet obviously

      localStorage.setItem("bogusMain",JSON.stringify(mainGameX));
      localStorage.setItem("bogusRoomId", msg.roomId);
      
      setDoneOne(true);
 
      setReset(true);
      console.log('setting mainGame', mainGameX.boardId);

      const td = window.matchMedia("(pointer: coarse)").matches;

      //not working
      //if (td) {  setTimeout(()=>{window.screen.orientation.lock("portrait")},2000); }
      setIsTouchDevice(td);
    
    }

    function onDupe(msg) {
      //this logic was causing too many problems so just let a user have multiple instances - for now
      console.log('duplicate process');
      setIsDuplicateProcess(true);
      socket.disconnect();
    }

    function onAllWordsFound(msg) {

      //console.log('all words', msg, currentRoomId);

      if (msg.roomId == currentRoomId) {
        setAllWordsFound(msg.words);
        setLatestWord(msg.latestWord);
      }
    }

    function onHeartBeat(msg) {
      //five seconds is good enough
      setRoomInfo(msg.roomInfo);
      setTimeout( ()=>{setWaitingForHeartbeat(false); }, 5000 );
    }

    function onStats(msg) {
      //console.log('stats',msg);
      //need to differentiate gameRooms
      if (msg.roomId == currentRoomId) {

        setStats(msg.stats);

        //console.log(msg.players);

        const playerInfoOutput = [
          <tr style={{textAlign:"left"}}>
            <th>Name</th>
            <th>Words</th>
            <th>Score</th>
          </tr>,
        ];

        //this is real shit and is what we deserve when we create stupid data structures
        const sortIndex=[];
        for ( const [key,val] of Object.entries(msg.players) ) {
          sortIndex.push( {id:key, score:val.score} );
        } 
        sortIndex.sort( (a,b) => b.score - a.score );

        for ( const sortedObj of sortIndex) {
        //for ( const [key,val] of Object.entries(msg.players)) {
          //playerInfoOutput.push( <div>{val.wordCount} "\u00a0" {val.score} </div>)
          //console.log( val.wordCount, val.score);

          const key = sortedObj.id;
          const val = msg.players[key];

          const userId = localStorage.getItem("bogusId");
          let userName = val.name ? val.name.substring(0,16) : key.substring(0,16);

          const style={textAlign:"center"}
          //console.log('stats',userName);
          if (userId) {
            if ( userId == key ) {
              userName = "You:" + userName;
              style.fontWeight = "bold";
              style.color = "red";
              style.backgroundColor = "yellow";
            }
          }
          
          //more waste of memory - but who really cares for this kind of thing?
          const style2 = {...style};
          style2.textAlign = "left";

          playerInfoOutput.push(
            <tr>
              <td style={style2}>{userName.substring(0,14)}</td>
              <td style={style}>{val.wordCount}</td>
              <td style={style}>{val.score}</td>
            </tr>
          )

        }
        setPlayerInfo( playerInfoOutput );
      }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat message', onFooEvent);
    socket.on('new board', onNewBoard);
    socket.on('current board', onNewBoard);
    socket.on('duplicate',onDupe);
    socket.on('allWordsFound', onAllWordsFound);
    socket.on('heartbeat', onHeartBeat);
    socket.on('stats', onStats);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat message', onFooEvent);
      socket.off('new board', onNewBoard);
      socket.off('current board', onNewBoard);
      socket.off('duplicate', onDupe);
      socket.off('allWordsFound', onAllWordsFound);
      socket.off('heartbeat', onHeartBeat);
      socket.off('stats', onStats);
    };

  }, [mainGame, isDuplicateProcess, currentRoomId]);

  const props = {
    game: mainGame,
    reset,
    setReset,
    foundWords,
    setFoundWords,
    isTouchDevice,
    socket,
    allWordsFound,
    isConnected,
    stats,
    foundWordsRef,
    is3d,
    roomInfo,
    currentRoomId,
    setCurrentRoomId,
    setAllWordsFound,
    latestWord,
    playerInfo
  };

  //this stops all the crappy ios events but then also prevents
  //click event from happening

  
  React.useEffect( ()=>{

    window.addEventListener('touchstart',ev=>ev.preventDefault());
    window.addEventListener('touchmove', ev=>ev.preventDefault());
    //window.addEventListener('touchend',processTouch);
    return ()=> { 
      window.removeEventListener('touchstart',null);
      window.removeEventListener('touchmove',null);
    }
  },[]);

  

  /*  here is how to use refs for form control instead of states which may cause re rendering 
  const inputRef = React.useRef();
  const formValueRef = React.useRef("balls");

  //formValueRef.current=Date.now();

  return [

    <input key="painInTheAss" id="inputRef" className="inputRef" 
      ref={inputRef}
      defaultValue={formValueRef.current} 
      onChange={ev=>{formValueRef.current=ev.target.value }}
      //onClick={ev=>{console.dir(ev.target)}} 
      />,

      <br></br>, <br></br>,
    
  */

  return [
    doneOne && !isDuplicateProcess && mainGame ? (
      <div key="app">
        <GameBoard key="k05" props={props} /> 
      </div>
    ) : (
      <div key="serverConnProb">Server Connection Problems, try refreshing Page</div>
    ),

    isDuplicateProcess && <div key="conn">You already are Connected</div>
    
  ];

}
