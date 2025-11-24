import { useCallback, useRef, useState } from "react";

export function useAudioPlayer() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);

  const play = useCallback((base64Audio) => {
    if (!base64Audio) return Promise.resolve();

    return new Promise((resolve) => {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audioRef.current = audio;
      setIsSpeaking(true);

      const finish = () => {
        setIsSpeaking(false);
        resolve();
      };

      audio.onended = finish;
      audio.onerror = finish;
      audio.play().catch(finish);
    });
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, play, stop };
}

