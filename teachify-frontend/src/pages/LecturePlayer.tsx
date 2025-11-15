import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { LectureOutput, VisualizationPrompt } from '@/api/content';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type SectionKey = 'introduction' | 'main_body' | 'conclusion';

interface LocationState {
  lecture?: LectureOutput;
}

type CaptionCue = { start: number; end: number; text: string; words: string[]; cumStartWords?: number };

const SECTION_TITLES: Record<SectionKey, string> = {
  introduction: 'Introduction',
  main_body: 'Main Body',
  conclusion: 'Conclusion',
};

function resolveAssetUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const cleaned = path.replace(/^\//, '');
  if (!cleaned) return '';
  return base ? `${base}/${cleaned}` : `/${cleaned}`;
}

function splitIntoParagraphs(text: string): string[] {
  if (!text) return [];
  const raw = text
    .split(/\n{2,}|\r\n{2,}/g)
    .flatMap((chunk) => chunk.split(/\n|\r\n/g))
    .map((p) => p.trim())
    .filter(Boolean);
  if (raw.length > 0) return raw;
  return text
    .split(/(?<=[.!?])\s+/g)
    .reduce<string[]>((acc, sentence, idx) => {
      if (idx % 3 === 0) acc.push(sentence);
      else acc[acc.length - 1] = `${acc[acc.length - 1]} ${sentence}`;
      return acc;
    }, [])
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function LecturePlayer() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { lecture } = (state || {}) as LocationState;

  const [currentSection, setCurrentSection] = useState<SectionKey>('introduction');
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeViz, setActiveViz] = useState<VisualizationPrompt | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [captions, setCaptions] = useState<CaptionCue[] | null>(null);
  const [compiledVideoUrl, setCompiledVideoUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationStatus, setCompilationStatus] = useState<'idle' | 'compiling' | 'ready' | 'error'>('idle');
  const [compilationProgress, setCompilationProgress] = useState<number>(0);
  const [showProgress, setShowProgress] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const typingIntervalRef = useRef<number | null>(null);
  const currentCharIndexRef = useRef<number>(0);
  const currentCharsRef = useRef<string[]>([]);
  const currentParagraphKeyRef = useRef<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastWordCountRef = useRef<number>(-1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingRafRef = useRef<number | null>(null);

  // keep one <video> alive and track time so we can resume seamlessly
  const lastPlaybackTimeRef = useRef<number>(0);
  const compiledOnceRef = useRef<boolean>(false);

  // live refs used by canvas draw
  const displayedTextRef = useRef<string>(''); useEffect(()=>{displayedTextRef.current=displayedText;},[displayedText]);
  const currentSectionRef = useRef<SectionKey>('introduction'); useEffect(()=>{currentSectionRef.current=currentSection;},[currentSection]);
  const activeVizRef = useRef<VisualizationPrompt | null>(null); useEffect(()=>{activeVizRef.current=activeViz;},[activeViz]);

  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const isCrossOrigin = (url: string) => { try { return new URL(url, window.location.href).origin !== window.location.origin; } catch { return false; } };

  const stableVideoSrc = useMemo(() => resolveAssetUrl(lecture?.video_path ?? ''), [lecture?.video_path]);

  const paragraphs: Record<SectionKey, string[]> = useMemo(() => {
    if (!lecture) return { introduction: [], main_body: [], conclusion: [] };
    return {
      introduction: splitIntoParagraphs(lecture.introduction),
      main_body: splitIntoParagraphs(lecture.main_body),
      conclusion: splitIntoParagraphs(lecture.conclusion),
    };
  }, [lecture]);

  const totalParagraphsInSection = (section: SectionKey) => paragraphs[section].length;
  const totalCharsAllParagraphs = useMemo(() =>
    paragraphs.introduction.join('').length +
    paragraphs.main_body.join('').length +
    paragraphs.conclusion.join('').length
  , [paragraphs]);

  const sectionWordTargets = useMemo(() => {
    const introW = paragraphs.introduction.join(' ').trim().split(/\s+/).filter(Boolean).length;
    const mainW  = paragraphs.main_body.join(' ').trim().split(/\s+/).filter(Boolean).length;
    const conclW = paragraphs.conclusion.join(' ').trim().split(/\s+/).filter(Boolean).length;
    return { introW, mainW, conclW, total: introW + mainW + conclW };
  }, [paragraphs]);

  const sectionWords = useMemo(() => ({
    introduction: paragraphs.introduction.join(' ').trim().split(/\s+/).filter(Boolean),
    main_body:    paragraphs.main_body.join(' ').trim().split(/\s+/).filter(Boolean),
    conclusion:   paragraphs.conclusion.join(' ').trim().split(/\s+/).filter(Boolean),
  }), [paragraphs]);

  const getCurrentParagraph = () => paragraphs[currentSection][currentParagraphIndex] || '';

  function restartTypingFor(section: SectionKey, paragraphIdx: number) {
    if (captions && captions.length > 0) return;
    const para = (paragraphs[section] && paragraphs[section][paragraphIdx]) || '';
    currentCharsRef.current = para.split('');
    currentCharIndexRef.current = 0;
    setDisplayedText('');
    if (!isPlaying || currentCharsRef.current.length === 0) return;

    let speedMs = 18;
    if (videoDuration && totalCharsAllParagraphs > 0 && currentCharsRef.current.length > 0) {
      const share = currentCharsRef.current.length / Math.max(1, totalCharsAllParagraphs);
      const paragraphDurationMs = Math.max(1200, (videoDuration as number) * 1000 * share);
      speedMs = Math.max(8, Math.floor(paragraphDurationMs / currentCharsRef.current.length));
    }
    if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
    const chars = currentCharsRef.current;
    typingIntervalRef.current = window.setInterval(() => {
      const next = ++currentCharIndexRef.current;
      setDisplayedText(chars.slice(0, next).join(''));
      if (next >= chars.length) {
        if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
        window.setTimeout(() => advance(), 650);
      }
    }, speedMs);
  }

  // preload images
  useEffect(() => {
    if (!lecture?.visualizations) return;
    lecture.visualizations.forEach(v => {
      if (!v.image_path) return;
      const url = resolveAssetUrl(v.image_path);
      if (imageCacheRef.current.has(url)) return;
      const img = new Image();
      if (isCrossOrigin(url)) img.crossOrigin = 'anonymous';
      img.onload = () => imageCacheRef.current.set(url, img);
      img.src = url;
    });
  }, [lecture]);

  // canvas constants
  const CANVAS_W = 1920, CANVAS_H = 1080, FPS = 30, FRAME_MS = 1000 / FPS;
  const lastTsRef = useRef(0);
  const togglerRef = useRef(0);

  function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawToCanvas() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    // bg
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // layout
    const M = 64;
    const gutter = 40;

    const vizNow = activeVizRef.current;
    const hasImg = Boolean(vizNow?.image_path);

    const avatarSize = 320;
    const avatarGap = 28;

    let textColW: number;
    let mediaColW: number;

    if (hasImg) {
      textColW = Math.floor(CANVAS_W * 0.56);
      mediaColW = CANVAS_W - M - textColW - gutter - M;
    } else {
      const avatarStripe = avatarSize + 64;
      textColW = CANVAS_W - M - M - avatarStripe;
      mediaColW = avatarStripe;
    }

    const mediaX = M + textColW + gutter;
    const mediaY = M;
    const mediaH = CANVAS_H - M - M;

    const avatarX = mediaX + mediaColW - avatarSize;
    const avatarY = mediaY + mediaH - avatarSize;

    const imageBoxX = mediaX;
    const imageBoxY = mediaY;
    const imageBoxW = mediaColW;
    const imageBoxH = Math.max(0, mediaH - avatarSize - avatarGap);

    // title
    const sec = currentSectionRef.current;
    ctx.fillStyle = '#111827';
    ctx.font = '700 46px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillText(SECTION_TITLES[sec], M, M + 52);

    // text
    ctx.fillStyle = '#374151';
    ctx.font = '400 34px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    const textX = M;
    const textYStart = M + 52 + 36;
    const maxTextWidth = textColW;
    const textNow = displayedTextRef.current || '';
    const lines = (() => {
      const words = textNow.split(' ');
      const out: string[] = [];
      let cur = '';
      for (const w of words) {
        const tryLine = cur ? cur + ' ' + w : w;
        if (ctx.measureText(tryLine).width <= maxTextWidth) cur = tryLine;
        else { if (cur) out.push(cur); cur = w; }
      }
      if (cur) out.push(cur);
      return out.slice(-16);
    })();
    const lineH = 52;
    lines.forEach((ln, i) => ctx.fillText(ln, textX, textYStart + i * lineH));

    // image
    if (hasImg && imageBoxH > 40 && vizNow?.image_path) {
      const key = resolveAssetUrl(vizNow.image_path);
      const img = imageCacheRef.current.get(key);
      if (img && img.complete && img.naturalWidth) {
        const boxW = imageBoxW, boxH = imageBoxH;
        const imgAR = img.naturalWidth / img.naturalHeight;
        const boxAR = boxW / boxH;
        let drawW: number, drawH: number;
        if (imgAR > boxAR) { drawW = boxW; drawH = drawW / imgAR; } else { drawH = boxH; drawW = drawH * imgAR; }
        const dx = imageBoxX + (boxW - drawW) / 2;
        const dy = imageBoxY + (boxH - drawH) / 2;

        drawRoundedRect(ctx, dx - 6, dy - 6, drawW + 12, drawH + 12, 18);
        ctx.fillStyle = '#ffffff'; ctx.fill();
        try { ctx.drawImage(img, dx, dy, drawW, drawH); } catch {}
        ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 2;
        drawRoundedRect(ctx, dx - 6, dy - 6, drawW + 12, drawH + 12, 18);
        ctx.stroke();
      }
    }

    // avatar (draw the persistent <video> into the canvas)
    const video = videoRef.current;
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;

    drawRoundedRect(ctx, avatarX, avatarY, avatarSize, avatarSize, 24);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.shadowColor = 'transparent';

    ctx.save();
    drawRoundedRect(ctx, avatarX, avatarY, avatarSize, avatarSize, 24);
    ctx.clip();
    if (video && video.readyState >= 2 && !video.paused) {
      try { ctx.drawImage(video, avatarX, avatarY, avatarSize, avatarSize); } catch {}
    } else {
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '600 24px system-ui, -apple-system';
      ctx.fillText('Avatar', avatarX + 18, avatarY + 36);
    }
    ctx.restore();

    // tiny encoder nudge
    ctx.fillStyle = togglerRef.current++ % 2 ? '#ffffff' : '#fffffe';
    ctx.fillRect(0, 0, 1, 1);
  }

  function pickMime(): { mimeType?: string; ext: 'webm' } {
    const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    const chosen = types.find(t => (window as any).MediaRecorder && MediaRecorder.isTypeSupported(t));
    return { mimeType: chosen, ext: 'webm' };
  }

  // recording / compilation (unchanged logic, but now the <video> never unmounts so streams stay intact)
  async function startRecording(opts?: { preserveLoop?: boolean; initiatedByDownload?: boolean }) {
    if (!canvasRef.current || !videoRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    drawToCanvas();
    await new Promise(r => requestAnimationFrame(() => r(null)));

    const canvasStream = canvas.captureStream(30);
    if (canvasStream.getVideoTracks().length === 0) {
      setCompilationStatus('error'); setIsCompiling(false); return;
    }

    const video = videoRef.current;
    const originalLoop = video.loop;
    video.loop = false; // natural end only

    // attach audio from the persistent video
    try {
      const vs: MediaStream | undefined = (video as any).captureStream?.();
      const aTracks = vs ? vs.getAudioTracks() : [];
      if (aTracks.length) aTracks.forEach(t => canvasStream.addTrack(t));
      else {
        const ac = new AudioContext();
        try { await ac.resume(); } catch {}
        const src = ac.createMediaElementSource(video);
        const dst = ac.createMediaStreamDestination();
        src.connect(dst); src.connect(ac.destination);
        dst.stream.getAudioTracks().forEach(t => canvasStream.addTrack(t));
      }
    } catch {}

    const { mimeType } = pickMime();
    const mr = new MediaRecorder(
      canvasStream,
      mimeType ? { mimeType, videoBitsPerSecond: 5_000_000 } : { videoBitsPerSecond: 5_000_000 }
    );

    recordedChunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data.size > 0) recordedChunksRef.current.push(e.data); };
    mr.onstop = () => {
      video.loop = originalLoop;
      const total = recordedChunksRef.current.reduce((s, b) => s + b.size, 0);
      if (!total) { setCompilationStatus('error'); setIsCompiling(false); setShowProgress(false); return; }
      const blob = new Blob(recordedChunksRef.current, { type: mimeType || 'video/webm' });
      const url = URL.createObjectURL(blob);
      setCompiledVideoUrl(url);
      setCompilationStatus('ready');
      setCompilationProgress(100);
      setTimeRemaining(0);
      setIsCompiling(false);
      setShowProgress(false);
      compiledOnceRef.current = true;

      if (opts?.initiatedByDownload) {
        try { video.pause(); } catch {}
        video.currentTime = 0;
        setIsPlaying(false);
      }
    };

    mediaRecorderRef.current = mr;
    mr.start(100);

    const drawLoop = (ts: number) => {
      if (mediaRecorderRef.current?.state === 'recording') {
        if (ts - lastTsRef.current >= FRAME_MS) {
          lastTsRef.current = ts;
          drawToCanvas();
        }
        recordingRafRef.current = requestAnimationFrame(drawLoop);
      }
    };
    recordingRafRef.current = requestAnimationFrame(drawLoop);

    // stop at natural end
    let lastT = video.currentTime;
    const checkEnd = () => {
      if (mediaRecorderRef.current?.state !== 'recording') return;
      const t = video.currentTime;
      const dur = isFinite(video.duration) ? video.duration : undefined;
      const atEnd = dur ? t >= dur - 0.08 : false;
      const wrapped = (opts?.preserveLoop === true) && t < lastT - 0.2; // not really used now
      lastT = t;

      if (atEnd || wrapped) setTimeout(() => stopRecording(), 350);
      else setTimeout(checkEnd, 120);
    };
    checkEnd();
  }

  function stopRecording() {
    if (recordingRafRef.current) { cancelAnimationFrame(recordingRafRef.current); recordingRafRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
  }

  async function startCompilation(showProgressBar = false, videoAlreadyPlaying = false) {
    if (!lecture || !videoRef.current) return;
    if (compilationStatus === 'compiling' || compilationStatus === 'ready') return;

    const video = videoRef.current;
    setIsCompiling(true);
    setCompilationStatus('compiling');
    setShowProgress(showProgressBar);
    setCompilationProgress(0);

    if (!isFinite(video.duration) || !video.duration) {
      await new Promise<void>((resolve) => {
        const h = () => { video.removeEventListener('loadedmetadata', h); resolve(); };
        video.addEventListener('loadedmetadata', h, { once: true });
      });
    }
    setVideoDuration(video.duration);
    setTimeRemaining(video.duration);

    try {
      if (!videoAlreadyPlaying || video.paused) {
        video.muted = false; setIsMuted(false);
        await video.play();
      }
    } catch {
      try { video.muted = true; setIsMuted(true); await video.play(); } catch {}
    }
    if (!isPlaying) setIsPlaying(!video.paused);

    const prog = setInterval(() => {
      if (video && isFinite(video.duration)) {
        const p = Math.min(95, (video.currentTime / video.duration) * 100);
        const rem = video.duration - video.currentTime;
        setCompilationProgress(p);
        setTimeRemaining(rem > 0 ? rem : 0);
      }
    }, 120);

    await startRecording({
      preserveLoop: videoAlreadyPlaying && !showProgressBar,
      initiatedByDownload: showProgressBar
    });

    const chk = setInterval(() => {
      if (mediaRecorderRef.current?.state === 'inactive') {
        clearInterval(prog);
        clearInterval(chk);
        setCompilationProgress(100);
      }
    }, 120);
  }

  // Visualization selection
  useEffect(() => {
    if (!lecture) return;
    const viz = lecture.visualizations?.find(
      (v) => v.section === currentSection && (v.paragraph_index ?? -1) === currentParagraphIndex
    );
    setActiveViz(viz || null);
  }, [lecture, currentSection, currentParagraphIndex]);

  // Typing buffer management
  useEffect(() => {
    if (!lecture) return;
    if (captions && captions.length > 0) return;
    const key = `${currentSection}:${currentParagraphIndex}`;
    if (currentParagraphKeyRef.current !== key) {
      currentParagraphKeyRef.current = key;
      const para = getCurrentParagraph();
      currentCharsRef.current = para.split('');
      currentCharIndexRef.current = 0;
      setDisplayedText('');
    }
  }, [lecture, currentSection, currentParagraphIndex, captions]);

  // Typing loop
  useEffect(() => {
    if (!lecture) return;
    if (captions && captions.length > 0) return;
    if (!isPlaying) { if (typingIntervalRef.current) { window.clearInterval(typingIntervalRef.current); typingIntervalRef.current = null; } return; }
    const chars = currentCharsRef.current; if (!chars || chars.length === 0) return;

    let speedMs = 18;
    if (videoDuration && totalCharsAllParagraphs > 0 && chars.length > 0) {
      const share = chars.length / Math.max(1, totalCharsAllParagraphs);
      const paragraphDurationMs = Math.max(1200, (videoDuration as number) * 1000 * share);
      speedMs = Math.max(8, Math.floor(paragraphDurationMs / chars.length));
    }

    if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
    typingIntervalRef.current = window.setInterval(() => {
      const next = ++currentCharIndexRef.current;
      setDisplayedText(chars.slice(0, next).join(''));
      if (next >= chars.length) {
        if (typingIntervalRef.current) window.clearInterval(typingIntervalRef.current);
        window.setTimeout(() => advance(), 650);
      }
    }, speedMs);

    return () => { if (typingIntervalRef.current) { window.clearInterval(typingIntervalRef.current); typingIntervalRef.current = null; } };
  }, [lecture, isPlaying, videoDuration, totalCharsAllParagraphs, captions, currentSection, currentParagraphIndex]);

  // play/pause sync
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    if (isPlaying) v.play().catch(() => {});
    else v.pause();
  }, [isPlaying]);

  // muted sync
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    v.muted = isMuted;
    if (isPlaying && isMuted) { v.muted = false; setIsMuted(false); }
  }, [isMuted, isPlaying]);

  // keep last playback time up-to-date
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const onTime = () => { lastPlaybackTimeRef.current = v.currentTime || 0; };
    v.addEventListener('timeupdate', onTime);
    return () => v.removeEventListener('timeupdate', onTime);
  }, []);

  // stall recovery
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const handle = () => { if (!isPlaying) return; try { void v.play(); } catch {} };
    v.addEventListener('waiting', handle);
    v.addEventListener('stalled', handle);
    v.addEventListener('suspend', handle);
    v.addEventListener('error', handle);
    return () => {
      v.removeEventListener('waiting', handle);
      v.removeEventListener('stalled', handle);
      v.removeEventListener('suspend', handle);
      v.removeEventListener('error', handle);
    };
  }, [isPlaying]);

  // stop the lecture when the video ends (no looping)
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const onEnded = () => { setIsPlaying(false); };
    v.addEventListener('ended', onEnded);
    return () => v.removeEventListener('ended', onEnded);
  }, []);

  function handleLoadedMetadata() {
    const v = videoRef.current;
    if (v && v.duration && isFinite(v.duration)) setVideoDuration(v.duration);

    try {
      const tracks = v?.textTracks;
      if (tracks && tracks.length > 0) {
        const track = tracks[0] as TextTrack;
        // @ts-ignore
        track.mode = 'hidden';
        const cuesRaw = track.cues as any;
        if (cuesRaw && cuesRaw.length > 0) {
          const parsed: CaptionCue[] = [];
          for (let i = 0; i < cuesRaw.length; i++) {
            const c = cuesRaw[i] as any;
            const txt = (c.text || '').replace(/<[^>]+>/g, '').trim();
            if (!txt) continue;
            parsed.push({ start: c.startTime, end: c.endTime, text: txt, words: txt.split(/\s+/).filter(Boolean) });
          }
          if (parsed.length > 0) setCaptions(parsed);
        }
      }
    } catch {}

    if (lecture?.video_path) {
      const tryUrls = [
        ...(lecture.captions_url ? [lecture.captions_url] : []),
        `${lecture.video_path}.vtt`,
        `${lecture.video_path.replace(/\.mp4($|\?)/, '.vtt$1')}`,
        `${lecture.video_path}.srt`,
        `${lecture.video_path.replace(/\.mp4($|\?)/, '.srt$1')}`,
      ];
      (async () => {
        for (const raw of tryUrls) {
          try {
            const url = resolveAssetUrl(raw);
            const res = await fetch(url, { method: 'GET' });
            if (res.ok) {
              const text = await res.text();
              const cues = parseCaptions(text);
              if (cues.length > 0) { setCaptions(cues); break; }
            }
          } catch {}
        }
      })();
    }
  }

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !captions || captions.length === 0) return;

    const tick = () => {
      if (!videoRef.current || !isPlaying) { rafIdRef.current = null; return; }
      const t = videoRef.current.currentTime;
      const cue = captions.find((c) => t >= c.start && t <= c.end);
      const prev = [...captions].filter((c) => t >= c.start).sort((a, b) => b.start - a.start)[0];
      const next = [...captions].filter((c) => t < c.start).sort((a, b) => a.start - b.start)[0];
      if (cue) {
        const elapsed = Math.max(0, Math.min(cue.end - cue.start, t - cue.start));
        const ratio = cue.end > cue.start ? elapsed / (cue.end - cue.start) : 1;
        let wordCount = Math.round(cue.words.length * ratio);
        wordCount = Math.max(1, Math.min(cue.words.length, wordCount));
        if (wordCount !== lastWordCountRef.current) {
          lastWordCountRef.current = wordCount;
          setDisplayedText(cue.words.slice(0, wordCount).join(' '));
        }
      } else if (prev && next) {
        const gap = next.start - prev.end;
        if (gap > 0) {
          const progressed = t - prev.end;
          const frac = Math.max(0, Math.min(0.9, progressed / gap));
          let words = Math.round(next.words.length * frac);
          words = Math.max(1, Math.min(next.words.length - 1, words));
          if (words !== lastWordCountRef.current) {
            lastWordCountRef.current = words;
            setDisplayedText(next.words.slice(0, words).join(' '));
          }
        }
      } else if (prev) {
        const words = prev.words.length;
        if (words !== lastWordCountRef.current) {
          lastWordCountRef.current = words;
          setDisplayedText(prev.words.join(' '));
        }
      }
      rafIdRef.current = window.requestAnimationFrame(tick);
    };

    if (isPlaying && rafIdRef.current == null) rafIdRef.current = window.requestAnimationFrame(tick);
    if (!isPlaying && rafIdRef.current != null) { window.cancelAnimationFrame(rafIdRef.current); rafIdRef.current = null; }

    return () => { if (rafIdRef.current != null) { window.cancelAnimationFrame(rafIdRef.current); rafIdRef.current = null; } };
  }, [captions, isPlaying]);

  function parseCaptions(src: string): CaptionCue[] {
    const lines = src.replace(/\r/g, '').split('\n');
    const cues: CaptionCue[] = [];
    const timeRe = /(?:(\d{2}):)?(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(?:(\d{2}):)?(\d{2}):(\d{2})[.,](\d{3})/;
    let i = 0;
    while (i < lines.length) {
      if (!lines[i].trim()) { i++; continue; }
      if (/^\d+$/.test(lines[i].trim())) i++;
      const m = timeRe.exec(lines[i]); if (!m) { i++; continue; }
      const start = (parseInt(m[1] || '00') * 3600) + (parseInt(m[2]) * 60) + parseInt(m[3]) + parseInt(m[4]) / 1000;
      const end   = (parseInt(m[5] || '00') * 3600) + (parseInt(m[6]) * 60) + parseInt(m[7]) + parseInt(m[8]) / 1000;
      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '') { textLines.push(lines[i]); i++; }
      const text = textLines.join(' ').replace(/<[^>]+>/g, '').trim();
      const words = text.split(/\s+/).filter(Boolean);
      if (text) cues.push({ start, end, text, words, cumStartWords: 0 });
      while (i < lines.length && lines[i].trim() === '') i++;
    }
    let cum = 0; for (const c of cues) { c.cumStartWords = cum; cum += c.words.length; }
    return cues;
  }

  function advance() {
    const nextParagraphIndex = currentParagraphIndex + 1;
    if (nextParagraphIndex < totalParagraphsInSection(currentSection)) {
      setCurrentParagraphIndex(nextParagraphIndex);
      restartTypingFor(currentSection, nextParagraphIndex);
      return;
    }
    if (currentSection === 'introduction') { setCurrentSection('main_body'); setCurrentParagraphIndex(0); restartTypingFor('main_body', 0); return; }
    if (currentSection === 'main_body')   { setCurrentSection('conclusion'); setCurrentParagraphIndex(0); restartTypingFor('conclusion', 0); return; }
    // do not force pause here; let the video 'ended' event stop playback
  }

  if (!lecture) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-10 max-w-5xl">
          <Card className="p-8">
            <h1 className="text-2xl font-semibold mb-2">No lecture to play</h1>
            <p className="text-muted-foreground mb-6">Generate a lecture first, then open the player.</p>
            <Button onClick={() => navigate('/generate')}>Generate from Prompt</Button>
          </Card>
        </div>
      </div>
    );
  }

  const hasImage = !!activeViz?.image_path;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{lecture.topic}</h1>
            <p className="text-muted-foreground">{captions ? 'Caption-synced' : SECTION_TITLES[currentSection]}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={async () => {
                const v = videoRef.current;
                if (!isPlaying) {
                  if (v) {
                    // if replay after completion, reset everything to start the whole lecture again
                    if (v.ended || (isFinite(v.duration) && v.currentTime >= (v.duration - 0.05))) {
                      try { v.currentTime = 0; } catch {}
                      lastWordCountRef.current = -1;
                      setCurrentSection('introduction');
                      setCurrentParagraphIndex(0);
                      setDisplayedText('');
                    }
                    try { v.muted = false; setIsMuted(false); await v.play(); setIsPlaying(true); }
                    catch { try { v.muted = true; setIsMuted(true); await v.play(); setIsPlaying(true); } catch {} }
                  } else { setIsMuted(false); setIsPlaying(true); }
                  // compile only on the very first watch
                  if (compilationStatus === 'idle' && !compiledOnceRef.current) {
                    startCompilation(false, true);
                  }
                } else {
                  setIsPlaying(false);
                  if (v) v.pause();
                }
              }}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>

            <Button
              variant="outline"
              onClick={async () => {
                if (compilationStatus === 'ready' && compiledVideoUrl) {
                  const link = document.createElement('a');
                  link.href = compiledVideoUrl;
                  link.download = `${lecture.topic.replace(/[^a-z0-9]/gi, '_')}_lecture.webm`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } else if (compilationStatus === 'idle') {
                  await startCompilation(true, false);
                } else if (compilationStatus === 'compiling') {
                  setShowProgress(true);
                }
              }}
              disabled={compilationStatus === 'compiling' && !showProgress}
            >
              {compilationStatus === 'compiling' && showProgress
                ? 'Compiling...'
                : compilationStatus === 'ready'
                ? 'Download Video'
                : compilationStatus === 'compiling'
                ? 'Compiling in background...'
                : 'Download Video'}
            </Button>
          </div>
        </div>

        <Card className="relative overflow-hidden rounded-xl">
          {/* hidden canvas for recording */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Stage */}
          <div ref={stageRef} className="aspect-video w-full bg-white relative overflow-hidden p-6 md:p-10">
            <div className={`grid h-full ${hasImage ? 'grid-cols-1 md:grid-cols-12 gap-6' : 'grid-cols-1'}`}>
              <div
                className={hasImage ? 'md:col-span-7 h-full' : 'h-full'}
                style={!hasImage ? { paddingRight: '22rem' } : undefined}
              >
                <h2 className="text-xl md:text-2xl font-semibold mb-4">{SECTION_TITLES[currentSection]}</h2>
                <p className="whitespace-pre-wrap leading-7 md:leading-8 text-base md:text-lg">
                  {displayedText}
                </p>
              </div>

              {hasImage && (
                <div className="md:col-span-5 relative h-full">
                  {/* Reserve top area for image, bottom area intentionally left for the persistent avatar video */}
                  <div className="absolute left-0 right-0 top-0 bottom-[calc(min(16rem,35vh)+1.25rem)] flex items-center justify-center">
                    <img
                      src={resolveAssetUrl(activeViz!.image_path!)}
                      alt={activeViz!.prompt}
                      className="max-h-full max-w-full rounded-xl shadow-md border border-neutral-200 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ✅ Persistent avatar video — rendered once; consistent size; never unmounted */}
            {stableVideoSrc && (
              <div
                className="absolute right-6 bottom-6 h-[min(16rem,35vh)] w-[min(16rem,35vh)] rounded-xl shadow-lg border border-neutral-200 bg-white overflow-hidden z-10"
              >
                <video
                  ref={videoRef}
                  src={stableVideoSrc}
                  {...(isCrossOrigin(stableVideoSrc) ? { crossOrigin: 'anonymous' as const } : {})}
                  muted={isMuted}
                  controls={false}
                  playsInline
                  preload="auto"
                  onLoadedMetadata={handleLoadedMetadata}
                  className="h-full w-full object-cover"
                >
                  {lecture?.captions_url && (
                    <track
                      kind="subtitles"
                      srcLang="en"
                      label="English"
                      src={resolveAssetUrl(lecture.captions_url)}
                      default
                    />
                  )}
                </video>
                {isMuted && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white text-xs">
                    Muted
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {compilationStatus === 'compiling' && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Compiling video...</span>
              <div className="flex items-center gap-3">
                <span>{Math.round(compilationProgress)}%</span>
                {timeRemaining !== null && timeRemaining > 0 && (
                  <span className="text-xs">{Math.ceil(timeRemaining)}s remaining</span>
                )}
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${compilationProgress}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground text-center">
              {showProgress ? 'Please wait while the video is being compiled...' : 'Compiling in the background...'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
