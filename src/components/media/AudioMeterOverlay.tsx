import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { cv } from '../../theme/cssVars';

interface AudioMeterOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

const mediaSourceMap = new WeakMap<HTMLVideoElement, MediaElementAudioSourceNode>();
let sharedAudioContext: AudioContext | null = null;

export default function AudioMeterOverlay({ videoRef }: AudioMeterOverlayProps) {
  const leftBarRef = useRef<HTMLDivElement>(null);
  const rightBarRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!sharedAudioContext) {
      sharedAudioContext = new AudioContextClass();
    }

    const audioCtx = sharedAudioContext;

    // Resume audio context if it was suspended (autoplay policy)
    const handlePlay = () => {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    };
    video.addEventListener('play', handlePlay);

    let sourceNode = mediaSourceMap.get(video);
    if (!sourceNode) {
      try {
        sourceNode = audioCtx.createMediaElementSource(video);
        mediaSourceMap.set(video, sourceNode);
      } catch (err) {
        console.error('Error creating media element source:', err);
        return;
      }
    }

    const splitter = audioCtx.createChannelSplitter(2);
    const analyserLeft = audioCtx.createAnalyser();
    const analyserRight = audioCtx.createAnalyser();

    analyserLeft.fftSize = 64;
    analyserRight.fftSize = 64;
    
    sourceNode.connect(splitter);
    splitter.connect(analyserLeft, 0); 
    splitter.connect(analyserRight, 1);

    if (!(video as any).__audioConnectedToDestination) {
      sourceNode.connect(audioCtx.destination);
      (video as any).__audioConnectedToDestination = true;
    }

    const dataArrayLeft = new Uint8Array(analyserLeft.frequencyBinCount);
    const dataArrayRight = new Uint8Array(analyserRight.frequencyBinCount);
    let animationFrameId: number;
    let lastLeftVol = 0;
    let lastRightVol = 0;

    const calculateRMS = (dataArray: Uint8Array) => {
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const val = dataArray[i] / 128.0 - 1.0;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      return Math.min(1, rms * 4.5);
    };

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);

      if (video.paused || video.ended || video.muted) {
        if (leftBarRef.current) leftBarRef.current.style.transform = `scaleY(0)`;
        if (rightBarRef.current) rightBarRef.current.style.transform = `scaleY(0)`;
        lastLeftVol = 0;
        lastRightVol = 0;
        return;
      }

      analyserLeft.getByteTimeDomainData(dataArrayLeft);
      analyserRight.getByteTimeDomainData(dataArrayRight);

      let leftVol = calculateRMS(dataArrayLeft);
      let rightVol = calculateRMS(dataArrayRight);
      
      // Smooth decay
      leftVol = Math.max(leftVol, lastLeftVol - 0.05);
      rightVol = Math.max(rightVol, lastRightVol - 0.05);

      if (leftBarRef.current) leftBarRef.current.style.transform = `scaleY(${leftVol})`;
      if (rightBarRef.current) rightBarRef.current.style.transform = `scaleY(${rightVol})`;

      lastLeftVol = leftVol;
      lastRightVol = rightVol;
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      sourceNode?.disconnect(splitter);
      splitter.disconnect();
      analyserLeft.disconnect();
      analyserRight.disconnect();
      video.removeEventListener('play', handlePlay);
    };
  }, [videoRef]);

  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        left: 16,
        top: 16,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1.5,
        px: 1.5,
        py: 1,
        borderRadius: '10px',
        backgroundColor: 'var(--noah-overlay-scrim)',
        border: "1px solid var(--noah-border)",
        backdropFilter: 'blur(8px)',
        zIndex: 10,
        height: 80,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100%' }}>
        <Box sx={{ width: 8, height: '100%', backgroundColor: cv.borderInputHover, borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
          <Box
            ref={leftBarRef}
            sx={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(to top, ${cv.rainbowGreen}, ${cv.rainbowYellow}, ${cv.rainbowRed})`,
              transformOrigin: 'bottom',
              transform: 'scaleY(0)',
              transition: 'transform 0.05s linear',
            }}
          />
        </Box>
        <Box sx={{ width: 8, height: '100%', backgroundColor: cv.borderInputHover, borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
          <Box
            ref={rightBarRef}
            sx={{
              width: '100%',
              height: '100%',
              background: `linear-gradient(to top, ${cv.rainbowGreen}, ${cv.rainbowYellow}, ${cv.rainbowRed})`,
              transformOrigin: 'bottom',
              transform: 'scaleY(0)',
              transition: 'transform 0.05s linear',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
