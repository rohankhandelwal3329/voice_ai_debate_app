import React, { useState } from 'react';
import { useConversation } from '@11labs/react';
import Orb from './components/Orb';
import UserInfoForm from './components/UserInfoForm';
import LiveTranscript from './components/LiveTranscript';



const AGENT_ID = 'ZG2Z2CoCJ7RUECfOCMSP'; // Your agent ID

export default function App() {


  const [transcript, setTranscript] = useState([]);
  const [isStarted, setIsStarted] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: '', panther: '', email: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState('');

  const { startSession, endSession, status, isSpeaking } = useConversation({
    onMessage: (msg) => {
      // Log the full message object for debugging
      console.log('ElevenLabs message:', msg);
      // Extract transcript text and source (user/ai)
      let text = '';
      let who = '';
      let isPartial = false;
      if (msg) {
        if (typeof msg === 'string') {
          text = msg;
        } else if (msg.message) {
          text = msg.message;
          who = msg.source || '';
        } else if (msg.content) {
          text = msg.content;
        } else if (msg.transcript) {
          text = msg.transcript;
        } else if (msg.text) {
          text = msg.text;
        }
        // Try to detect partial/final status
        if (msg.isFinal === false || msg.final === false || msg.partial === true) {
          isPartial = true;
        }
      }
      setTranscript((prev) => {
        // If this is a partial (live) update, update the last entry
        if (isPartial) {
          if (prev.length === 0) {
            return [{ text: text || '', who: who || '' }];
          } else {
            // Overwrite the last entry with the new partial
            return [...prev.slice(0, -1), { text: text || '', who: who || '' }];
          }
        } else {
          // If finalized, push a new entry
          return [...prev, { text: text || '', who: who || '' }];
        }
      });
    },
    onDisconnect: () => setIsStarted(false),
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!userInfo.name.trim() || !userInfo.panther.trim() || !userInfo.email.trim()) {
      setFormError('Please fill in all fields.');
      return;
    }
    setFormError('');
    setFormSubmitted(true);
  };

  const handleStart = async () => {
    setTranscript([]);
    await navigator.mediaDevices.getUserMedia({ audio: true });
    const dynamicVars = {
      user_name: userInfo.name,
      panther_id: userInfo.panther,
      student_email: userInfo.email,
    };
    let firstMsg = `Hello ${userInfo.name}`;
    if (userInfo.name.trim().toLowerCase() !== 'rohan') {
      firstMsg = 'Hello! Ready to debate?';
    }
    await startSession({
      agentId: AGENT_ID,
      dynamicVariables: dynamicVars,
      firstMessage: firstMsg
    });
    setIsStarted(true);
  };

  const handleStop = async () => {
    await endSession();
    setIsStarted(false);
  };

  // Status text similar to widget
  let statusText = 'Ready to start a debate';
  if (status === 'connected' && isStarted) {
    statusText = isSpeaking ? 'AI speaking…' : 'Listening…';
  } else if (status === 'connecting') {
    statusText = 'Connecting…';
  }
  return (
    <div className="theme-dark" style={{minHeight: '100vh', width: '100vw'}}>
      {/* Theme toggle button */}
      <div style={{display:'flex', justifyContent:'flex-end', padding:'18px 36px 0 0'}}>

      </div>
      {!formSubmitted ? (
        <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'80vh', width:'100vw'}}>
          <UserInfoForm
            userInfo={userInfo}
            onChange={handleInputChange}
            onSubmit={handleFormSubmit}
            formError={formError}

          />
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'row', alignItems:'flex-start', justifyContent:'center', gap:48, marginTop:24, width:'100%'}}>
          {/* LEFT: Orb, button, status */}
          <div style={{flex:1, maxWidth:420, minWidth:320, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-start'}}>
            <div style={{width:180, height:180, margin:'0 auto 28px'}}>
              <Orb
                hue={isSpeaking ? 30 : status === 'connected' && isStarted ? 210 : 0}
                hoverIntensity={0.4}
                rotateOnHover={isSpeaking}
                forceHoverState={isSpeaking}
              />
            </div>
            <div className="widget-status-text" style={{
              fontSize:'1.25em', margin:'18px 0 18px', textAlign:'center',
              color: '#8ecbff',
              fontWeight: 600
            }}>{statusText}</div>
            <button
              className={isStarted ? 'widget-stop-btn' : 'widget-start-btn'}
              onClick={isStarted ? handleStop : handleStart}
              disabled={status === 'connecting'}
              style={{fontSize:'1.25em', width:'90%', maxWidth:260, padding:'18px 0', marginBottom:16}}
            >
              {isStarted ? 'Stop' : 'Let\'s Debate'}
            </button>
            <div className="powered-by-elevenlabs" style={{fontSize:'1.05em', marginTop:10}}>Powered by ElevenLabs</div>
          </div>
          {/* RIGHT: Live Transcript */}
          <div style={{flex:2, minWidth:320, maxWidth:700, width:'100%'}}>
            <div className="widget-transcript-list" style={{minHeight:400, fontSize:'1.17em', background: '#23232b', color: '#e9e9e9', borderRadius:12, padding:'32px 24px 18px 24px'}}>
              <h2 className="widget-transcript-title" style={{fontSize:'1.15em', color: '#8ecbff', margin:'0 0 18px 0'}}>Live Transcript</h2>
              <LiveTranscript transcript={transcript} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
