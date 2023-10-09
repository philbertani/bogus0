import {useState, useEffect} from "react"
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowSize;
}

export function useMouseButton() {
  const [mouseButtonDown, setMouseButtonDown] = useState(false);
  useEffect(() => {

    window.addEventListener("mouseup", ev=>{ev.preventDefault(); setMouseButtonDown(false)} );
    window.addEventListener("mousedown", ev=>{ev.preventDefault(); setMouseButtonDown(true)} );

    return () => { 
      window.removeEventListener("mousedown", setMouseButtonDown);
      window.removeEventListener("mouseup",setMouseButtonDown)
    }

  }, []);
  return mouseButtonDown;
}

