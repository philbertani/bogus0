import React from "react";
import { useMouseButton } from "./uiHooks";
import { v4 as uuidv4 } from "uuid";
import { vec, blank2dArray } from "../common/utils.js"

//setting colors here
const boardColor = "radial-gradient(#FF7D00,#FFFF00)";
const textColor = "#0000A0";

const selectColor = "radial-gradient(#00FFFF,#0000FF)";
const selectTextColor = "#FFFFFF";

const wordColor = "radial-gradient(#001000,#00FF00)"; 
const wordTextColor = "#FFFFFF";//"#1000A0";

const hintColor = "radial-gradient(#FFFF00,#FF7D00)";
const hintTextColor = "#4040FF";


export function BoardDetails({ props }) {
  const {
    game,
    boardDims,
    cubeRefs,
    reset,
    setReset,
    foundWords,
    setFoundWords,
    isTouchDevice,
    searchString,
    setSearchString,
    touches,
    setTouchInfo,
    setIsWord,
    setSearchStringBackground,
    isWordRef,
    allWordsFound,
    setTotalScore,
    foundWordsRef,
    cubeStyles,
    setCubeStyles,
    socket
  } = props;

  const [output, setOutput] = React.useState([]);
  const counter = React.useRef(0);
  const { M, N } = game.rank;
  const mouseButtonDown = useMouseButton();

  //have to move all this sh.t up the flagpole, useState is such a waste of time
  //const [cubeStyles, setCubeStyles] = React.useState(blank2dArray(N, M, null));
  const [selected, setSelected] = React.useState([]);
  const [allSelected, setAllSelected] = React.useState(blank2dArray(N, M));
  //const [searchString, setSearchString] = React.useState("");
  //const [path, setPath] = React.useState([]);

  const lineHeight = React.useRef(0);
  const fontSize = React.useRef(0);
  const selectedRef = React.useRef([]);
  const pathRef = React.useRef([]); //may have to make this a useState
  const totalScoreRef = React.useRef(0);

  const [hints,setHints] = React.useState([]);

  //const countx = React.useRef(0);
  //countx.current ++;
  //if ( countx.current%100===0) console.log('BoardDetails count',countx.current);

  //console.log(game.words);

  React.useEffect(() => {
    //we do not need to access any of these from higher up, but we do
    //need to know when to reset from above
    if (reset) {
      console.log("resetting arrays");
      //setCubeStyles(blank2dArray(N, M, null));
      setSelected([]);
      setAllSelected(blank2dArray(N, M));
      setSearchString("");
      setReset(false);
      selectedRef.current = [];

      setFoundWords({});
      totalScoreRef.current = 0;
      foundWordsRef.current = {words:{},totalscore:0};

      const savedWords = JSON.parse( localStorage.getItem("bogusSavedWords") ) ?? {};
      if ( savedWords.boardId && savedWords.boardId === game.boardId) {
        //we could have just checked that the boards are the same but this is 
        //the lazy way - but still kind of annoying
        savedWords.foundWords && setFoundWords(savedWords.foundWords);

        foundWordsRef.current = {words:{...savedWords.foundWords},totalScore:savedWords.totalScore};

        console.log('words from local storage',savedWords, foundWordsRef.current);
        //setTotalScore(savedWords.totalScore);
        totalScoreRef.current = savedWords.totalScore;
      }

    }
  }, [reset, setReset, M, N, setFoundWords, game.boardId, setSearchString, foundWordsRef, setTotalScore]);

  function pathDiv(top,left,width,height,transformText) {
    return (
      <div
        key={uuidv4()}
        style={{
          transform: transformText,
          position: "absolute",
          top: top,
          left: left,
          zIndex: 50,
          width: width,
          height: height,
          backgroundImage: "linear-gradient(#FFF000,#FF0000)",
          opacity: "80%",
        }}
      ></div>
    );
  }

  const torusMovePath = React.useCallback( 
    (i,j,iOld,jOld,x,y,xOld,yOld) => {
    //we need 2 separate divs for path  
    //console.log("torusMove", i,j,iOld,jOld);
    const sc = 1.4;
    const {M,N} = game.rank;
    const height = ".55vh";
    let width = .6*boardDims.width / M;
    let transformText = "rotate(0deg)";

    const adj = 2;
    const adjX = 4;

    let dx1=0,dy1=0,dx2=0,dy2=0;
    //so annoying i,j,iold,jold are being converted to text somewhere

    //this section is ugly and repetitive but it works - so not wasting more time on it
    if ( jOld==0 && j==N-1 )  {
      if ( iOld==0 && i==M-1) {
        transformText = "rotate(45deg)"; dy1=-width/adj; dy2=-dy1; dx1=width/adjX; dx2=-dx1; width*=sc;
      }
      else if ( iOld==M-1 && i==0) {
        transformText = "rotate(-45deg)"; dy1=width/adj; dy2=-dy1; dx1=width/adjX; dx2=-dx1; width*=sc; 
      }
      else if ( i>iOld) {
        transformText = "rotate(-45deg)"; dy1=width/adj; dy2=-dy1; dx1=width/adjX; dx2=-dx1; width*=sc;
      }
      else if (i<iOld) {
        transformText = "rotate(45deg)"; dy1=-width/adj; dy2=-dy1; dx1=width/adjX; dx2=-dx1; width*=sc;       
      }

      return [
        pathDiv(yOld + dy1,xOld-width + dx1,width,height,transformText),
        pathDiv(y + dy2,x + dx2,width,height,transformText)
      ];
    }   
    else if ( jOld==N-1 && j==0) {
      if ( iOld==M-1 && i==0) {
        transformText = "rotate(45deg)"; dy1=width/adj; dy2=-dy1; dx1=-width/adjX; dx2=-dx1; width*=sc; 
      }
      else if (iOld==0 && i==M-1) {
        transformText = "rotate(-45deg)"; dy1=-width/adj; dy2=-dy1; dx1=-width/adjX; dx2=-dx1; width*=sc;
      }
      else if (i<iOld) {
        transformText = "rotate(-45deg)"; dy1=-width/adj; dy2=-dy1; dx1=-width/adjX; dx2=-dx1; width*=sc; 
      }
      else if (i>iOld) {
        transformText = "rotate(45deg)"; dy1=width/adj; dy2=-dy1; dx1=-width/adjX; dx2=-dx1; width*=sc;
      }
      
      return [
        pathDiv(yOld+dy1,xOld + dx1,width,height,transformText),
        pathDiv(y+dy2,x-width + dx2,width,height,transformText)     
      ]
    }
    else if ( iOld==0 && i==M-1) {
      transformText = "rotate(90deg)"

      if ( j>jOld) {
        transformText = "rotate(-45deg)"; dx1=width/adj; dx2=-dx1; dy1=width/adjX; dy2=-dy1; width*=sc;
      }
      else if ( j<jOld) {
        transformText = "rotate(45deg)"; dx1=-width/adj; dx2=-dx1; dy1=width/adjX; dy2=-dy1;width*=sc;
      }

      return [
        pathDiv(yOld-width/2 + dy1,xOld-width/2+dx1,width,height,transformText),
        pathDiv(y+width/2+dy2 ,x-width/2+dx2,width,height,transformText)     
      ]
    }
    else if ( iOld==M-1 && i==0) {
      transformText = "rotate(90deg)"
      
      if ( j<jOld) {
        transformText = "rotate(-45deg)"; dx1=-width/adj; dx2=-dx1; dy1=-width/adjX; dy2=-dy1; width*=sc;
      }
      else if (j>jOld) {
        transformText = "rotate(45deg)"; dx1=width/adj; dx2=-dx1; dy1=-width/adjX; dy2=-dy1; width*=sc;
      }

      return [
        pathDiv(yOld+width/2 +dy1,xOld-width/2+dx1,width,height,transformText),
        pathDiv(y-width/2+dy2,x-width/2+dx2,width,height,transformText)     
      ]
    }

    return null; 
    },[boardDims.width,game.rank]
  );

  const addPathDiv = React.useCallback(

    (style, prevStyle, i, j, iOld, jOld, torusMove) => {

      const y = style.top + SN(style.height) / 2;
      const x = style.left + SN(style.width) / 2;
      const yOld = prevStyle.top + SN(style.height) / 2;
      const xOld = prevStyle.left + SN(style.width) / 2;

      if (torusMove) return torusMovePath(i,j,iOld,jOld,x,y,xOld,yOld);

      let transformText = "rotate(0deg)";

      const left = Math.min(x, xOld);
      let top = Math.min(y, yOld);
      let height = ".55vh";
      const sc = 1.42;

      if (j === jOld) {
        //same column so we at 90 degrees
        top += SN(style.height) / 2;
        transformText = "translate(-50%,50%) rotate(90deg) ";

      } else if (i !== iOld && j !== jOld) {

        top += SN(style.height) / 1.9; //should be 2 but it is off by some factor

        height = ".4vh";
  
        if (i > iOld && j > jOld) {
          transformText = "rotate(45deg) scale(" + sc +  ")";
        } else if (i > iOld && j < jOld) {
          transformText = "rotate(135deg) scale(" + sc +  ")";
        } else if (i < iOld && j > jOld) {
          transformText = "rotate(-45deg) scale(" + sc +  ")";
        } else if (i < iOld && j < jOld) {
          transformText = "rotate(45deg) scale(" + sc +  ")";
        }
      }

      const width = boardDims.width / N;
    
      return pathDiv(top,left,width,height,transformText);

    }

  ,[boardDims, N, torusMovePath] );

  //need to regenerate pathRef to track new letter positions
  const resetPath = React.useCallback(() => {
    const refs = selectedRef.current;
    pathRef.current = [];

    //console.log('xxxxxxxx',refs);
    for (let n = 1; n < refs.length; n++) {
      const { i, j } = refs[n];
      const { i: iOld, j: jOld } = refs[n - 1];

      const style = cubeStyles[i][j];
      const prevStyle = cubeStyles[iOld][jOld];

      const [isValidMove, torusMove, debug] = 
        game.isValidMove(parseFloat(i),parseFloat(j),[iOld,jOld].map(x=>parseFloat(x)));
      //console.log(torusMove);

      pathRef.current.push(addPathDiv(style, prevStyle, i, j, iOld, jOld, torusMove));
    }
  }, [addPathDiv, cubeStyles, game]);


  React.useEffect(() => {
    counter.current++;
    let tmpStyles = [];
    let top = 3;
    const marginFac = 0.95;
    for (let j = 0; j < N; j++) {
      let left = 3;
      let row = [];
      for (let i = 0; i < M; i++) {
        let boxStyle = {
          color: textColor, //"#FFFFFF",
          position: "absolute",
          boxSizing: "borderBox",
          borderRadius: "10px",
          fontWeight: "700",
          fontFamily: "Times New Roman, Times, serif",
          backgroundImage: boardColor,
          userSelect: "none",
          top: top,
          left: left,
          height: (marginFac * boardDims.height) / N + "px",
          width: (marginFac * boardDims.width) / M + "px",
          fontSize: (0.6 * boardDims.height) / N + "px",
        };

        //this gets called before the reset useEffect gets called so
        //have to catch this here
        if (cubeStyles[j][i] && !reset) {
          //if cubeStyles elements have been set already then preserve the
          //colors which may have changed due to selection or found words
          boxStyle.backgroundImage = cubeStyles[j][i].backgroundImage;
          boxStyle.color = cubeStyles[j][i].color;
        }

        fontSize.current = (0.6 * boardDims.height) / N + "px";
        lineHeight.current = (0.9 * marginFac * boardDims.height) / N;
        left += boardDims.width / M;
        row.push(boxStyle);
      }
      tmpStyles.push(row);
      top += boardDims.height / N;
    }

    if (counter.current % 100 === 0) console.log("set styles useEffect", counter.current);

    //setTouchInfo(boardDims);
    //console.log("in first useEffect", reset);
    //we have to let React manage the styles using useState
    setCubeStyles(tmpStyles);
  }, [M, N, boardDims, cubeRefs, game.board, game.rank, reset]);
  //adding cubeStyles and resetPath causes infinite rerenders


  //reset path needed to be in its own useEffect
  React.useEffect( ()=>{ resetPath();  },[boardDims, resetPath]);

  function deepClone(B) {
    return JSON.parse(JSON.stringify(B));
  }

  function SN(str) {
    //parseFloat ?
    return Number(str.replace("px", ""));
  }

  function handleClick(ev, i, j, mbd = false) {

    //mbd=Mouse Button Down, also true if we are swiping on touch screen

    //not really onClick anymore because we need to use mousedown event

    //if mdb is true this is being called from
    //handleMouseOver with mouseButtonDown

    //some variations: if user clicks already selected remove all letters
    //after that one so she can restart quickly on the same path
    //double tap on the same letter would finally reset the whole path

    //need some special logic for disabling default iOs touch events
    //add option to reset path after touchend since it bugs Catalina

    if (ev) ev.preventDefault();

    let newStyles = deepClone(cubeStyles); //this is ugly
    let newSelected = deepClone(allSelected);

    const [iOld, jOld] = selected;

    //columns is j which is the x position - got it?
    const dir = vec.normalize([j - jOld, i - iOld]);

    let angle = 0;
    if (touches.useDir && vec.length(touches.dir) > 1e-4) {
      const cos = vec.dot(dir, touches.dir);
      angle = Math.acos(cos);
      if (angle > 0.2) {
        return;
      }
    }

    let flag = true;
    let resetAll = false;

    //console.log(searchString.length,allSelected[i][j],mbd);

    if (selected.length === 0) {
      newStyles[i][j].backgroundImage = selectColor;
      newStyles[i][j].color = selectTextColor;

    } else {

      //"weird" touchDevice is treating i,j,selected as numberic characters instead of numbers, who would have thought??
      const [validMove, torusMove, debug] = 
        game.isValidMove(parseFloat(i), parseFloat(j), selected.map(x=>parseFloat(x)));
      //console.log('isValidMove',validMove,torusMove, i,j,selected);

      //the annoying case of when using touch input we tap again on the last
      //letter selected in order to reset
      const klugeReset =
        !touches.useDir && touches.isTouchStart && i === iOld && j === jOld;

      //setTouchInfo(['y',torusMove, validMove, i,j,iOld,jOld,selected, debug]);

      if (validMove && allSelected[i][j] === 0) {

        //setTouchInfo(['z',torusMove, validMove, i,j,iOld,jOld,selected, debug]);

        //vary color tint from lighter to darker along path
        //need to be able to follow which letters are connected 
        //across edges for torus version

        const style = newStyles[i][j];
        const prevStyle = cubeStyles[iOld][jOld];

        style.backgroundImage = selectColor; 
        style.color = selectTextColor;  

        pathRef.current.push(addPathDiv(style, prevStyle, i, j, iOld, jOld, torusMove));

      } else if (!klugeReset && mbd && i === iOld && j === jOld) {
        flag = false;
      }

      else if (mbd && !touches.pos) {
        return;

      } else if (mbd && !touches.isTouchStart) {
        return;

      } else {

        resetAll = true;

        for (let j = 0; j < N; j++) {
          for (let i = 0; i < M; i++) {
            newStyles[i][j].backgroundImage = boardColor;
            newStyles[i][j].color = textColor; 
          }
        }

        newSelected = blank2dArray(M, N);

        if (
          searchString.length === 0 ||
          allSelected[i][j] === 0 ||
          (searchString.length === 1 && allSelected[i][j] === 1)
        ) {
          newStyles[i][j].backgroundImage = selectColor;
          newStyles[i][j].color = selectTextColor;
        } else {
          flag = false;
          setCubeStyles(newStyles);
          setSelected([]);
          setAllSelected(newSelected);
        }

        setSearchString("");
        selectedRef.current = [];
        pathRef.current = [];
      }
    }

    if (flag) {
  
      if ( game.boardType === game.BOARDTYPES.TORUS ) {

        function pmod(x, y) {
          //% for negative numbers still gives negative,
          //need to add the modulus back to result
          const a = x % y;
          return a < 0 ? a + y : a;
        }

        //this is really perturbing once again on mobile
        //devices i and j are text
        const [ix,jx] = [parseFloat(i),parseFloat(j)];

        if (hints && hints.length > 0) {
          //restore the normal colors
          for (const ij of hints) {
            const [ii,jj] = ij;
            
            if ( !(ii==ix && jj==jx) && (allSelected[ii][jj]==0 || resetAll) ) {
              const style = newStyles[ii][jj];
              //console.log('hints',ij,i,j);
              style.color = textColor;
              style.backgroundImage = boardColor;
            }
          }
        }
 
        const shit = [];

        const newHints = [];
        const { M, N } = game.rank;

        for (let row = ix - 1; row <= ix + 1; row++) {
          for (let col = jx - 1; col <= jx + 1; col++) {

            const [ii,jj] = [pmod(row,M),pmod(col,N)];

            shit.push([row,col,ii,jj]);

            if (  !(row === ix && col === jx) && (allSelected[ii][jj]==0 || resetAll) ) {
              const style = newStyles[ii][jj];
              style.color = hintTextColor;
              style.backgroundImage = hintColor;
              newHints.push([ii,jj]);
            }
          }
        }
        
        //console.log('hints',newHints);
        //socket.emit('info',JSON.stringify(shit));
        setHints(newHints);
      }
      

      //console.log("setting new colors 1");

      newSelected[i][j] = 1;
      setSelected([i, j]);
      setAllSelected(newSelected);
      setSearchString( prev => prev + game.board[i][j]);
      setCubeStyles(newStyles);
      selectedRef.current.push({ i, j });
    }
  }

  function handleMouseOver(ev, ix, jx, flag) {
    if (isTouchDevice) {
      return;
    }

    ev.preventDefault();

    let newStyles = deepClone(cubeStyles); //this is ugly

    //set all other fontSizes back to normal
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < M; i++) {
        newStyles[i][j].fontSize = fontSize.current;
      }
    }

    if (flag) newStyles[ix][jx].fontSize = (0.8 * boardDims.height) / N + "px";

    setCubeStyles(newStyles);

    if (mouseButtonDown) {
      //console.log("mouse down yippee", mouseButtonDown);
      handleClick(ev, ix, jx, true);
    }
  }

  React.useEffect(() => {
    //console.log(touches);
    if (touches.pos && touches.pos.x) {
      handleClick(null, touches.pos.x, touches.pos.y, true);
    }
  }, [touches]); //dont listen to React suggestions

  React.useEffect(() => {
    let tmpOutput = [];
    for (let j = 0; j < M; j++) {
      for (let i = 0; i < N; i++) {
        let letter = game.output[i][j]; //board[i][j];

        const keyVal = "letter" + i.toString() + j.toString() + letter;

        //we need to leave some room for the mouse or finger to squeeze between letters
        //so we can swipe a nice path, not enough we need to use swipe direction as well
        //to get a clear path
        const lh = lineHeight.current * 0.7 + "px";
        tmpOutput.push(
          <div
            id={keyVal}
            ref={(el) => (cubeRefs.current[i][j] = el)}
            //we need to ignore the mouseDown that is forwarded from touches
            onMouseDown={(ev) => {
              !isTouchDevice && handleClick(ev, i, j, false);
            }}
            style={cubeStyles[i][j]}
            key={"boxNum" + keyVal}
          >
            <div
              style={{
                textAlign: "center",
                lineHeight: lh,
                boxSizing: "border-box",
                position: "absolute",
                top: "15%",
                left: "15%",
                width: "70%",
                height: "70%",
                borderRadius: "10px",
                zIndex: 100,
              }}
              onMouseOver={(ev) => handleMouseOver(ev, i, j, true)}
              onMouseOut={(ev) => handleMouseOver(ev, i, j, false)}
            >
              {letter}
            </div>
          </div>
        );
      }
    }

    //we are going to need to detect mobile and touch events or else
    //many ui events just act stupid

    tmpOutput.push(...pathRef.current);

    //console.log("in second useEffect");

    setOutput(tmpOutput);
  }, [
    M,
    N,
    game,
    cubeRefs,
    cubeStyles,
    boardDims,
    selected,
    allSelected,
    searchString,
    mouseButtonDown,
    isTouchDevice
  ]);
  //don't listen to React about adding: handleClick and handleMouseOver

  React.useEffect(() => {

    const search = game.isWord(searchString, false);
    const ln = searchString.length - (game.minLetters-1);

    //console.log('1', searchString, foundWordsRef.current.words);
    //console.log(game.output);
    //console.log(searchString, search);

    if (!search[1]) {
      //set colors to Red ish
      setSearchStringBackground("");
      setIsWord(false);
      isWordRef.current = false;

    } else if (search[1]) {

      //console.log("setting new colors 2");
      
      //add it to the user's found words
      const newWords = foundWordsRef.current.words;

      isWordRef.current = true;

      let newBackgroundImage = wordColor;
      let newColor = wordTextColor;

      const thisUserFoundWord = newWords[searchString];

      //console.log("xxxxxx",thisUserFoundWord);

      //console.log('2', searchString, foundWordsRef.current.words);

      if ( thisUserFoundWord || allWordsFound[searchString]) {
        //if we already found this word color it grey-ish
        newBackgroundImage = "radial-gradient(#FFFFFF,#000000)";
        newColor = "#101010";
        isWordRef.current = false;
      }

      //add word to map for this user if it does not exist
      if ( !thisUserFoundWord && isWordRef.current) {  
        newWords[searchString] = ln ; 
        //console.log('3', searchString, foundWordsRef.current.words);
      }

      let newStyles = deepClone(cubeStyles); //this is ugly
      for (const Index of selectedRef.current) {
        const { i, j } = Index;
        const style = newStyles[i][j];
        style.backgroundImage = newBackgroundImage;
        style.color = newColor;
      }

      setCubeStyles(newStyles);
      if (isWordRef.current) {

        totalScoreRef.current += ln;
        foundWordsRef.current = {
          words: { ...newWords },
          totalScore: totalScoreRef.current,
        };

        localStorage.setItem(
          "bogusSavedWords",
          JSON.stringify({
            foundWords: newWords,
            boardId: game.boardId,
            totalScore: totalScoreRef.current,
          })
        );
      }

      setIsWord(true);
      setSearchStringBackground({back:newBackgroundImage,front:newColor});
    }
  }, [searchString, game ]);
  //React is wrong about adding foundWords and cubeStyles here: it causes infinite renders
  //also wrong about isWordRef

  return <div>{output}</div>;
}