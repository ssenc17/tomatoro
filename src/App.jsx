import { useState, useEffect, useRef } from 'react';
import './App.css';

export default function App() {
  const MAX_MINUTES = 180;
  const MIN_MINUTES = 1;

  const [secondsLeft, setSecondsLeft] = useState(25 * 60); 
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('FOCUS'); 
  const [rotationAngle, setRotationAngle] = useState(0);

  const [knobRotation, setKnobRotation] = useState(150);
  const isDragging = useRef(false);
  const lastAngle = useRef(0);
  const knobRef = useRef(null);

  const [tasks, setTasks] = useState([]);
  const [newCardText, setNewCardText] = useState('');

  const currentHours = Math.floor(secondsLeft / 3600);
  const currentMinutes = Math.floor((secondsLeft % 3600) / 60);
  const currentSeconds = secondsLeft % 60;

  const hoursStr = currentHours.toString().padStart(2, '0');
  const minutesStr = currentMinutes.toString().padStart(2, '0');
  const secondsStr = currentSeconds.toString().padStart(2, '0');

  useEffect(() => {
    const title = currentHours > 0 ? `${hoursStr}:${minutesStr}:${secondsStr}` : `${minutesStr}:${secondsStr}`;
    document.title = `${title} - tomatoro`;
  }, [secondsLeft]);
  
  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
        setRotationAngle((prevAngle) => prevAngle + 6); 
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      clearInterval(interval);
      setIsActive(false);
      if (mode === 'FOCUS') {
        alert("Focus done! Time for a break.");
        setMode('BREAK');
        setSecondsLeft(5 * 60);
      } else {
        alert("Break over! Ready to focus.");
        setMode('FOCUS');
        setSecondsLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft, mode]);

  useEffect(() => {
    const minutes = secondsLeft / 60;
    setKnobRotation(minutes * 6);
  }, []);

  const h1 = hoursStr[0];
  const h2 = hoursStr[1];
  const m1 = minutesStr[0];
  const m2 = minutesStr[1];
  const s1 = secondsStr[0];
  const s2 = secondsStr[1];

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newCardText.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newCardText, checked: false }]);
    newCardText;
    setNewCardText('');
  };

  const getMouseAngle = (e) => {
    if (!knobRef.current) return 0;
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radians = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    let degrees = radians * (180 / Math.PI);
    return degrees < 0 ? degrees + 360 : degrees;
  };

  const handleKnobMouseDown = (e) => {
    if (isActive) return; 
    isDragging.current = true;
    lastAngle.current = getMouseAngle(e);
    document.addEventListener('mousemove', handleKnobMouseMove);
    document.addEventListener('mouseup', handleKnobMouseUp);
  };

  const handleKnobMouseMove = (e) => {
    if (!isDragging.current) return;
    const currentAngle = getMouseAngle(e);
    let angleDiff = currentAngle - lastAngle.current;

    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;

    setKnobRotation(prev => {
      const nextRotation = prev + angleDiff;
      const minutes = Math.round(nextRotation / 6);
      const clampedMinutes = Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, minutes));
      setSecondsLeft(clampedMinutes * 60);
      return clampedMinutes * 6;
    });

    lastAngle.current = currentAngle;
  };

  const handleKnobMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleKnobMouseMove);
    document.removeEventListener('mouseup', handleKnobMouseUp);
  };

  return (
    <div className="screen">
      
      <div className="left-panel">
        
        <div className="timer-container">
          <div className="timer-banner">
            <div className="focus-break-indicator">
              <div className="vertical-text">{mode}</div>
            </div>
            
            <div className="digits-wrapper">
              <div className="digit-block">{h1}</div>
              <div className="digit-block">{h2}</div>
              <div className="digit-colon">:</div>
              <div className="digit-block">{m1}</div>
              <div className="digit-block">{m2}</div>
              <div className="digit-colon">:</div>
              <div className="digit-block">{s1}</div>
              <div className="digit-block">{s2}</div>
            </div>

          </div>

          <div className="dial-knob-zone">

            <div className="dial-ticks">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="tick" style={{transform: `rotate(${i * 30}deg)`}}
                />
              ))}
            </div>

            <div ref={knobRef} className="dial-knob"
              style={{transform: `rotate(${knobRotation}deg)`, transition: isDragging.current ? 'none' : 'transform 0.08s linear'}}
              onMouseDown={handleKnobMouseDown}
            >
              <div className="dial-notch"></div>
            </div>

            <span style={{fontSize: '0.65rem', marginTop: '6px', opacity: 0.5, fontWeight: 'bold'}}>
              spin knob
            </span>

          </div>
        </div>

        <div className="button-row">
          <button className="control-btn" onClick={() => { 
            setIsActive(false); 
            const resetMinutes =
              mode === 'FOCUS'
                ? 25
                : 5;
            setSecondsLeft(resetMinutes * 60);
            setKnobRotation(resetMinutes * 6);
          }}>
            reset
          </button>
          <button className="control-btn" onClick={() => setIsActive(!isActive)}>
            {isActive ? 'pause' : 'play'}
          </button>
          <button className="control-btn">mute</button>
        </div>

        <div className="tasks-box">
          <div className="tasks-scroll-area">
            {tasks.length === 0 ? (
              <p style={{ margin: 0, opacity: 0.5 }}>no tasks!</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="task-line">
                  <label className="task-left-side">
                    <input 
                      type="checkbox" 
                      className="checkbox" 
                      checked={task.checked}
                      onChange={() => setTasks(tasks.map(t => t.id === task.id ? { ...t, checked: !t.checked } : t))}
                    />
                    <span style={{ textDecoration: task.checked ? 'line-through' : 'none', opacity: task.checked ? 0.4 : 1 }}>
                      {task.text}
                    </span>
                  </label>
                  <button className="delete-btn" onClick={() => setTasks(tasks.filter(t => t.id !== task.id))}>×</button>
                </div>
              ))
            )}
          </div>

          <form className="task-form-bottom-bar" onSubmit={handleAddTask}>
            <input 
              type="text" 
              className="task-input" 
              placeholder="add task..." 
              value={newCardText}
              onChange={(e) => setNewCardText(e.target.value)}
            />
            <button type="submit" className="add-plus-btn">+</button>
          </form>
        </div>

      </div>

      <div 
        className="tomato"
        style={{ 
          transform: `translateY(-50%) rotate(${rotationAngle}deg)`, 
          transition: isActive ? 'transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none' 
        }}
      >
        <div className="tomato-core-line line-v"></div>
        <div className="tomato-core-line line-h"></div>
      </div>

    </div>
  );
}
