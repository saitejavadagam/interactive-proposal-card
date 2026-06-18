import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

function App() {
  const [showModal, setShowModal] = useState(false);
  const [showSadModal, setShowSadModal] = useState(false);
  const [noBtnPos, setNoBtnPos] = useState({ x: null, y: null });
  const [isFleeing, setIsFleeing] = useState(false);
  const [escapeCount, setEscapeCount] = useState(0);
  const [hearts, setHearts] = useState([]);
  
  const btnNoRef = useRef(null);
  const lastRelocateTime = useRef(0);

  // Generate background hearts on mount
  useEffect(() => {
    const emojis = ['❤️', '💖', '💝', '💕', '💗', '💘', '🌸'];
    const heartsArray = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      left: Math.random() * 100, // percentage
      delay: Math.random() * 8, // seconds delay
      duration: 6 + Math.random() * 6, // seconds duration
      size: 1 + Math.random() * 1.5 // rem size
    }));
    setHearts(heartsArray);
  }, []);

  // Relocate the "I hate you" button away from cursor/touch
  const relocateButton = (clientX, clientY) => {
    if (!btnNoRef.current || escapeCount >= 10) return;
    
    const now = Date.now();
    if (now - lastRelocateTime.current < 450) return; // 450ms cooldown
    lastRelocateTime.current = now;
    
    setEscapeCount((count) => count + 1);
    
    const rect = btnNoRef.current.getBoundingClientRect();
    const width = rect.width || 120;
    const height = rect.height || 45;
    
    const padding = 40; // distance from edge of screen
    const maxW = window.innerWidth - width - padding;
    const maxH = window.innerHeight - height - padding;
    
    // Fallback if clientX/Y coordinates are undefined (e.g. keyboard focus or weird events)
    const refX = clientX !== undefined ? clientX : window.innerWidth / 2;
    const refY = clientY !== undefined ? clientY : window.innerHeight / 2;
    
    let targetX = Math.random() * (maxW - padding) + padding;
    let targetY = Math.random() * (maxH - padding) + padding;
    
    // Loop to ensure the new spot is not too close to the cursor/touch point
    let attempts = 0;
    const minDistance = window.innerWidth < 500 ? 110 : 200;
    while (attempts < 15) {
      targetX = Math.random() * (maxW - padding) + padding;
      targetY = Math.random() * (maxH - padding) + padding;
      
      const distance = Math.hypot(
        refX - (targetX + width / 2),
        refY - (targetY + height / 2)
      );
      
      // We want the new button position to be at least minDistance away from the pointer
      if (distance > minDistance) {
        break;
      }
      attempts++;
    }
    
    setNoBtnPos({ x: targetX, y: targetY });
    setIsFleeing(true);
  };

  // Track window mousemove to trigger escape before cursor actually touches the button
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!btnNoRef.current || showModal || escapeCount >= 10) return;
      
      const rect = btnNoRef.current.getBoundingClientRect();
      const btnCenterX = rect.left + rect.width / 2;
      const btnCenterY = rect.top + rect.height / 2;
      
      const distance = Math.hypot(e.clientX - btnCenterX, e.clientY - btnCenterY);
      
      // Proximity threshold (in pixels) - start moving when cursor is within 130px
      if (distance < 130) {
        relocateButton(e.clientX, e.clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [showModal, escapeCount]);

  // Handle pointer over, focus or touchstart directly on the button for instant escape
  const handlePointerTrigger = (e) => {
    if (escapeCount >= 10) return; // Allow normal hover/click when count is 10+
    e.preventDefault();
    if (showModal) return;
    const touch = e.touches?.[0] || e.changedTouches?.[0];
    const clientX = e.clientX !== undefined ? e.clientX : touch?.clientX;
    const clientY = e.clientY !== undefined ? e.clientY : touch?.clientY;
    relocateButton(clientX, clientY);
  };

  const handleYesClick = () => {
    setShowModal(true);
  };

  const handleNoClick = () => {
    if (escapeCount >= 10) {
      setShowSadModal(true);
    }
  };

  const resetGame = () => {
    setShowModal(false);
    setShowSadModal(false);
    setIsFleeing(false);
    setEscapeCount(0);
    setNoBtnPos({ x: null, y: null });
  };

  return (
    <>
      {/* Floating Background Hearts */}
      <div className="background-hearts">
        {hearts.map((heart) => (
          <span
            key={heart.id}
            className="floating-heart"
            style={{
              left: `${heart.left}%`,
              animationDelay: `${heart.delay}s`,
              animationDuration: `${heart.duration}s`,
              fontSize: `${heart.size}rem`,
            }}
          >
            {heart.emoji}
          </span>
        ))}
      </div>

      <div className="app-container">
        <main className="confession-card">
          <div className="gif-container">
            <span className="heart-gif" role="img" aria-label="glowing heart">💝</span>
          </div>
          <h1>Do you love me?</h1>
          <p>Please choose wisely! 👉👈</p>
          
          <div className="buttons-container">
            <button
              className="btn btn-yes"
              onClick={handleYesClick}
            >
              YES ❤️
            </button>
            {isFleeing ? (
              <>
                {/* Invisible placeholder of the exact same size to keep the YES button static */}
                <div className="btn btn-no" style={{ visibility: 'hidden', pointerEvents: 'none' }}>
                  NO 💔
                </div>
                {createPortal(
                  <button
                    ref={btnNoRef}
                    className="btn btn-no fleeing"
                    style={{ left: `${noBtnPos.x}px`, top: `${noBtnPos.y}px` }}
                    onMouseEnter={handlePointerTrigger}
                    onPointerDown={handlePointerTrigger}
                    onTouchStart={handlePointerTrigger}
                    onFocus={handlePointerTrigger}
                    onClick={handleNoClick}
                  >
                    NO 💔
                    {escapeCount >= 5 && escapeCount < 10 && (
                      <span className="speech-bubble">stop chasing me ☁️</span>
                    )}
                    {escapeCount >= 10 && (
                      <span className="speech-bubble warning">Okay, fine... 😢</span>
                    )}
                  </button>,
                  document.body
                )}
              </>
            ) : (
              <button
                ref={btnNoRef}
                className="btn btn-no"
                onMouseEnter={handlePointerTrigger}
                onPointerDown={handlePointerTrigger}
                onTouchStart={handlePointerTrigger}
                onFocus={handlePointerTrigger}
                onClick={handleNoClick}
              >
                NO 💔
                {escapeCount >= 5 && escapeCount < 10 && (
                  <span className="speech-bubble">stop chasing me ☁️</span>
                )}
                {escapeCount >= 10 && (
                  <span className="speech-bubble warning">Okay, fine... 😢</span>
                )}
              </button>
            )}
          </div>
        </main>
      </div>

      {/* Romantic Confession Popup Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span className="modal-emoji" role="img" aria-label="happy face with hearts">🥰</span>
            <h2>I love you too! ❤️</h2>
            <p>You've made me the happiest person in the universe! Let's celebrate our love forever! ✨</p>
            <button className="btn btn-close" onClick={resetGame}>
              Aww! Back 😘
            </button>
          </div>
        </div>
      )}

      {/* Sad Rejection Popup Modal */}
      {showSadModal && (
        <div className="modal-overlay sad">
          <div className="modal-content sad">
            <span className="modal-emoji" role="img" aria-label="sad broken heart">🥀</span>
            <h2>Oh... 💔</h2>
            <p>"I guess not all stories can be fairy tales... My heart is broken, but I hope you find your happiness." 🥺🌧️</p>
            <button className="btn btn-close btn-retry" onClick={resetGame}>
              Try again 🔄
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
