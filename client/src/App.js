import React, { useState, useEffect } from 'react';
import { socket } from './socket';
import { ConnectionState } from './components/ConnectionState';
import { ConnectionManager } from './components/ConnectionManager';
import { MyForm } from './components/MyForm';
import { Events} from './components/Events';
import { GameBoard } from './components/GameBoard';
import bogusMain from './common/bogus.js';
import {cloneArray} from './common/utils.js';
import {v4 as uuidv4} from 'uuid';

import './App.css';

export default function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [fooEvents, setFooEvents] = useState([]);
  const [mainGame, setMainGame] = React.useState(new bogusMain( ()=>{}, {words:["none"], definitions:["none"]} ) );
  const [doneOne, setDoneOne] = React.useState(false);
  const [reset, setReset] = React.useState(false);
  const [foundWords, setFoundWords] = React.useState( {} );

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
      socket.emit('current board',{userId,sessionId}); //since we are connected ask for the current board
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onFooEvent(value) {
      setFooEvents(previous => [...previous, value]);
    }

    function onNewBoard(msg) {
      //we do not want the previous state accumulated; just the new board and words
      //setBoard(msg.board);
      mainGame.board = cloneArray(msg.game.board);
      mainGame.output = cloneArray(msg.game.output);
      mainGame.words = [...msg.words];
      setMainGame( mainGame );
      setDoneOne(true);
      setFoundWords({});
      setReset(true);
      console.log('setting mainGame');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('chat message', onFooEvent);
    socket.on('new board', onNewBoard);
    socket.on('current board', onNewBoard);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('chat message', onFooEvent);
      socket.off('new board', onNewBoard);
      socket.off('current board', onNewBoard);
    };
  }, [mainGame]);

  const props={game:mainGame,reset,setReset,foundWords,setFoundWords};
  return (
    [
      doneOne && <GameBoard key="k05" props={props}
       // game={mainGame} reset={reset} setReset={setReset}
       // foundWords={foundWords} setFoundWords={setFoundWords}
      />,
      
      <div key="k00" className="App">
        <ConnectionState key="k01" isConnected={ isConnected } />
        <Events key="k02" events={ fooEvents } />
        <ConnectionManager key="k03" />
        <MyForm key="k04"/>
      </div>
    ]
  );
}
