/*
File    : src/app/components/landing/DogLoadingGame.tsx
Author  : 김지우
Create  : 2026-05-14
Description : 랜딩 가이드 챗봇에서 실행되는 도그 점프 미니게임

Modification History:
    - 2026-05-14 (김지우) : 챗봇 게임 명령어 응답용 캔버스 미니게임 구현
    - 2026-05-14 (김지우) : 강아지 점프 효과음 적용
    - 2026-05-14 (김지우) : 뼈다귀 아이템 획득 및 추가 점수 기능 적용
    - 2026-05-14 (김지우) : 뼈다귀 획득 효과음 및 다양한 생성 위치 적용
    - 2026-05-14 (김지우) : 효과음 중첩 재생을 위한 오디오 풀 적용
    - 2026-05-14 (김지우) : 키 입력 유지 중에도 효과음이 재생되도록 Web Audio 재생 적용
*/
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import boneSoundSrc from "@/assets/splites/bone.mp3";
import jumpSoundSrc from "@/assets/splites/jump.mp3";

type DogLoadingGameProps = {
  active: boolean;
  title?: string;
  subtitle?: string;
};

const DEFAULT_GAME_WIDTH = 400;
const MIN_GAME_WIDTH = 260;
const GAME_HEIGHT = 180;
const GROUND_Y = 132;

const DOG_X = 70;
const DOG_RENDER_WIDTH = 64;
const DOG_RENDER_HEIGHT = 64;
const DOG_GROUND_OFFSET = -7;

const OBSTACLE_WIDTH = 24;
const AUDIO_POOL_SIZE = 4;

type Obstacle = {
  x: number;
  height: number;
  width: number;
};

type Bone = {
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
};

const createSound = (src: string, volume: number) => {
  const audio = new Audio(src);
  audio.volume = volume;
  audio.preload = "auto";
  return audio;
};

export default function DogLoadingGame({
  active,
  title = "가이드가 몸을 푸는 중입니다",
  subtitle = "Space 또는 ↑ 키로 점프하고 뼈다귀를 먹어 점수를 얻으세요.",
}: DogLoadingGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const resizeTimerRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const jumpAudioPoolRef = useRef<HTMLAudioElement[]>([]);
  const boneAudioPoolRef = useRef<HTMLAudioElement[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const jumpBufferRef = useRef<AudioBuffer | null>(null);
  const boneBufferRef = useRef<AudioBuffer | null>(null);

  const [gameWidth, setGameWidth] = useState(DEFAULT_GAME_WIDTH);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const dogYRef = useRef(GROUND_Y - DOG_RENDER_HEIGHT - DOG_GROUND_OFFSET);
  const velocityYRef = useRef(0);
  const isJumpingRef = useRef(false);
  const obstaclesRef = useRef<Obstacle[]>([
    { x: DEFAULT_GAME_WIDTH + 120, height: 42, width: OBSTACLE_WIDTH },
  ]);
  const bonesRef = useRef<Bone[]>([]);
  const speedRef = useRef(300);
  const scoreRef = useRef(0);
  const jumpChargeRef = useRef(0);
  const jumpPressedRef = useRef(false);
  const gameOverRef = useRef(false);
  const gameWidthRef = useRef(DEFAULT_GAME_WIDTH);

  const getDogGroundY = () => GROUND_Y - DOG_RENDER_HEIGHT - DOG_GROUND_OFFSET;

  const makeObstacles = useCallback((startX: number): Obstacle[] => {
    const pattern = Math.random();

    if (pattern > 0.72) {
      return [
        { x: startX, height: 42, width: OBSTACLE_WIDTH },
        { x: startX + 54, height: 42, width: OBSTACLE_WIDTH },
      ];
    }

    if (pattern > 0.42) {
      return [{ x: startX, height: 68, width: OBSTACLE_WIDTH }];
    }

    return [{ x: startX, height: 42, width: OBSTACLE_WIDTH }];
  }, []);

  const makeBones = useCallback((startX: number): Bone[] => {
    const pattern = Math.random();
    const lanes = [GROUND_Y - 48, GROUND_Y - 72, GROUND_Y - 98];
    const makeBone = (x: number, y: number): Bone => ({
      x,
      y,
      width: 28,
      height: 16,
      collected: false,
    });

    if (pattern < 0.3) return [];

    if (pattern < 0.58) {
      return [
        makeBone(
          startX + 40 + Math.random() * 170,
          lanes[Math.floor(Math.random() * lanes.length)]
        ),
      ];
    }

    if (pattern < 0.82) {
      const firstX = startX + 56 + Math.random() * 90;
      const firstLane = Math.floor(Math.random() * lanes.length);
      const secondLane = Math.min(firstLane + 1, lanes.length - 1);

      return [
        makeBone(firstX, lanes[firstLane]),
        makeBone(firstX + 46 + Math.random() * 26, lanes[secondLane]),
      ];
    }

    const trailX = startX + 74 + Math.random() * 70;
    const trailLane = Math.floor(Math.random() * lanes.length);

    return [0, 1, 2].map((index) =>
      makeBone(trailX + index * 38, lanes[(trailLane + index) % lanes.length])
    );
  }, []);

  const resetGame = useCallback(() => {
    const startX = gameWidthRef.current + 120;

    dogYRef.current = getDogGroundY();
    velocityYRef.current = 0;
    isJumpingRef.current = false;
    obstaclesRef.current = makeObstacles(startX);
    bonesRef.current = makeBones(startX);
    speedRef.current = 300;
    scoreRef.current = 0;
    jumpChargeRef.current = 0;
    jumpPressedRef.current = false;
    setScore(0);
    setGameOver(false);
    gameOverRef.current = false;
  }, [makeBones, makeObstacles]);

  const getAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;

    const AudioContextConstructor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextConstructor) return null;

    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioContextConstructor();
    }

    return audioContextRef.current;
  }, []);

  const unlockAudio = useCallback(() => {
    const context = getAudioContext();

    if (context?.state === "suspended") {
      context.resume().catch(() => {});
    }

    return context;
  }, [getAudioContext]);

  const playSoundFromPool = useCallback(
    (pool: HTMLAudioElement[], src: string, volume: number) => {
      let audio = pool.find((candidate) => candidate.paused || candidate.ended);

      if (!audio && pool.length < AUDIO_POOL_SIZE) {
        audio = createSound(src, volume);
        pool.push(audio);
      }

      if (!audio) {
        audio = pool[0];
      }

      if (!audio) return;

      audio.currentTime = 0;
      audio.play().catch(() => {});
    },
    []
  );

  const playBufferedSound = useCallback(
    (
      bufferRef: { current: AudioBuffer | null },
      fallbackPool: HTMLAudioElement[],
      src: string,
      volume: number
    ) => {
      const context = unlockAudio();

      if (context && bufferRef.current) {
        const source = context.createBufferSource();
        const gain = context.createGain();

        source.buffer = bufferRef.current;
        gain.gain.value = volume;
        source.connect(gain);
        gain.connect(context.destination);
        source.start(0);
        return;
      }

      playSoundFromPool(fallbackPool, src, volume);
    },
    [playSoundFromPool, unlockAudio]
  );

  const playJumpSound = useCallback(() => {
    playBufferedSound(jumpBufferRef, jumpAudioPoolRef.current, jumpSoundSrc, 0.28);
  }, [playBufferedSound]);

  const playBoneSound = useCallback(() => {
    playBufferedSound(boneBufferRef, boneAudioPoolRef.current, boneSoundSrc, 0.32);
  }, [playBufferedSound]);

  const jump = useCallback(() => {
    if (!active) return;

    if (gameOverRef.current) {
      resetGame();
      return;
    }

    if (!isJumpingRef.current) {
      const charge = Math.min(jumpChargeRef.current, 1);
      velocityYRef.current = -390 - charge * 310;
      isJumpingRef.current = true;
      playJumpSound();
    }

    jumpChargeRef.current = 0;
  }, [active, playJumpSound, resetGame]);

  const drawDog = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    const runOffset = gameOverRef.current ? 0 : Math.sin(time / 90) * 2;
    const earFlop = gameOverRef.current ? 0 : Math.sin(time / 120) * 3;

    ctx.save();
    ctx.translate(x, y + runOffset);

    ctx.fillStyle = gameOverRef.current ? "#8b7355" : "#c99a5b";
    ctx.fillRect(14, 30, 36, 20);
    ctx.fillRect(38, 19, 19, 18);
    ctx.fillRect(9, 45, 9, 14);
    ctx.fillRect(38, 45, 9, 14);

    ctx.fillStyle = "#f1c27d";
    ctx.fillRect(45, 23, 13, 10);
    ctx.fillRect(50, 33, 5, 5);

    ctx.fillStyle = "#4b3422";
    ctx.fillRect(51, 25, 3, 3);
    ctx.fillRect(57, 30, 4, 3);
    ctx.fillRect(37, 16 + earFlop, 7, 13);

    ctx.strokeStyle = "#c99a5b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(13, 34);
    ctx.quadraticCurveTo(2, 25, 11, 19);
    ctx.stroke();

    if (gameOverRef.current) {
      ctx.strokeStyle = "#4b3422";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(47, 26);
      ctx.lineTo(53, 32);
      ctx.moveTo(53, 26);
      ctx.lineTo(47, 32);
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawObstacle = (ctx: CanvasRenderingContext2D, x: number, height: number) => {
    const y = GROUND_Y - height;

    ctx.save();
    ctx.fillStyle = "#94a3b8";

    if (height >= 60) {
      ctx.fillRect(x + 8, y, 8, height);
      ctx.fillRect(x + 2, y + 12, 20, 10);
      ctx.fillRect(x + 5, y + height - 6, 14, 6);
    } else {
      ctx.fillRect(x + 8, y, 8, height);
      ctx.fillRect(x + 4, y + 10, 16, 8);
      ctx.fillRect(x + 2, y + 20, 5, 12);
      ctx.fillRect(x + 17, y + 20, 5, 12);
      ctx.fillRect(x + 5, y + height - 5, 14, 5);
    }

    ctx.restore();
  };

  const drawBone = (ctx: CanvasRenderingContext2D, bone: Bone) => {
    if (bone.collected) return;

    const { x, y } = bone;

    ctx.save();
    ctx.fillStyle = "#fff7ed";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.shadowColor = "rgba(245, 158, 11, 0.25)";
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.roundRect(x + 7, y + 5, 14, 6, 3);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x + 5, y + 5, 4, 0, Math.PI * 2);
    ctx.arc(x + 5, y + 13, 4, 0, Math.PI * 2);
    ctx.arc(x + 23, y + 5, 4, 0, Math.PI * 2);
    ctx.arc(x + 23, y + 13, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  };

  const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 16);
    ctx.lineTo(x + 20, y + 16);
    ctx.quadraticCurveTo(x + 25, y, x + 42, y + 8);
    ctx.quadraticCurveTo(x + 58, y + 2, x + 68, y + 16);
    ctx.lineTo(x + 92, y + 16);
    ctx.stroke();
    ctx.restore();
  };

  const drawGround = (ctx: CanvasRenderingContext2D, time: number, width: number) => {
    ctx.save();
    ctx.strokeStyle = "rgba(203, 213, 225, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(width, GROUND_Y);
    ctx.stroke();

    ctx.fillStyle = "rgba(148, 163, 184, 0.55)";
    const offset = (time / 20) % 28;

    for (let i = -offset; i < width; i += 28) {
      ctx.fillRect(i, GROUND_Y + 13, 4, 3);
    }

    ctx.restore();
  };

  const getDogHitBox = () => ({
    left: DOG_X + 18,
    right: DOG_X + DOG_RENDER_WIDTH - 12,
    top: dogYRef.current + 20,
    bottom: dogYRef.current + DOG_RENDER_HEIGHT - 8,
  });

  const checkCollision = () => {
    const dog = getDogHitBox();

    return obstaclesRef.current.some((obstacle) => {
      const obstacleLeft = obstacle.x;
      const obstacleRight = obstacle.x + obstacle.width;
      const obstacleTop = GROUND_Y - obstacle.height;

      return (
        dog.right > obstacleLeft &&
        dog.left < obstacleRight &&
        dog.bottom > obstacleTop &&
        dog.top < GROUND_Y
      );
    });
  };

  const checkBoneCollection = () => {
    const dog = getDogHitBox();
    let didCollect = false;

    bonesRef.current.forEach((bone) => {
      if (bone.collected) return;

      const hit =
        dog.right > bone.x &&
        dog.left < bone.x + bone.width &&
        dog.bottom > bone.y &&
        dog.top < bone.y + bone.height;

      if (hit) {
        bone.collected = true;
        scoreRef.current += 3;
        didCollect = true;
        setScore(scoreRef.current);
      }
    });

    if (didCollect) {
      playBoneSound();
    }
  };

  const render = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const width = gameWidthRef.current;

      if (!canvas || !ctx || !active) return;
      if (!lastTimeRef.current) lastTimeRef.current = time;

      const delta = Math.min((time - lastTimeRef.current) / 1000, 0.033);
      lastTimeRef.current = time;

      ctx.clearRect(0, 0, width, GAME_HEIGHT);
      ctx.fillStyle = "rgba(248, 250, 252, 0.95)";
      ctx.fillRect(0, 0, width, GAME_HEIGHT);

      ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
      [0.14, 0.36, 0.54, 0.7, 0.9].forEach((ratio, index) => {
        ctx.fillRect(width * ratio, 24 + (index % 3) * 14, 3, 3);
      });

      drawCloud(ctx, Math.max(width - 120, 10), 36);
      drawGround(ctx, time, width);

      if (!gameOverRef.current) {
        if (jumpPressedRef.current && !isJumpingRef.current) {
          jumpChargeRef.current = Math.min(jumpChargeRef.current + delta * 2.4, 1);
        }

        velocityYRef.current += 1550 * delta;
        dogYRef.current += velocityYRef.current * delta;

        if (dogYRef.current >= getDogGroundY()) {
          dogYRef.current = getDogGroundY();
          velocityYRef.current = 0;
          isJumpingRef.current = false;
        }

        obstaclesRef.current = obstaclesRef.current.map((obstacle) => ({
          ...obstacle,
          x: obstacle.x - speedRef.current * delta,
        }));

        bonesRef.current = bonesRef.current.map((bone) => ({
          ...bone,
          x: bone.x - speedRef.current * delta,
        }));

        if (obstaclesRef.current.every((obstacle) => obstacle.x < -obstacle.width)) {
          const startX = width + 80 + Math.random() * 150;
          obstaclesRef.current = makeObstacles(startX);
          bonesRef.current = makeBones(startX);
          scoreRef.current += 1;
          speedRef.current = Math.min(speedRef.current + 20, 760);
          setScore(scoreRef.current);
        }

        checkBoneCollection();

        if (checkCollision()) {
          gameOverRef.current = true;
          setGameOver(true);
        }
      }

      bonesRef.current.forEach((bone) => drawBone(ctx, bone));
      drawDog(ctx, DOG_X, dogYRef.current, time);
      obstaclesRef.current.forEach((obstacle) => drawObstacle(ctx, obstacle.x, obstacle.height));

      if (!gameOverRef.current && jumpPressedRef.current && !isJumpingRef.current) {
        ctx.save();
        ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
        ctx.fillRect(DOG_X, GROUND_Y + 26, 54, 5);
        ctx.fillStyle = "rgba(37, 99, 235, 0.8)";
        ctx.fillRect(DOG_X, GROUND_Y + 26, 54 * jumpChargeRef.current, 5);
        ctx.restore();
      }

      ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
      ctx.font = "14px monospace";
      ctx.fillText(`SCORE ${scoreRef.current}`, Math.max(width - 110, DOG_X + DOG_RENDER_WIDTH + 8), 20);

      if (gameOverRef.current) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.58)";
        ctx.fillRect(0, 0, width, GAME_HEIGHT);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("충돌했습니다", width / 2, GAME_HEIGHT * 0.42);
        ctx.font = "14px sans-serif";
        ctx.fillText("Space를 누르면 다시 시작합니다", width / 2, GAME_HEIGHT * 0.62);
        ctx.textAlign = "start";
      }
    },
    [active, makeBones, makeObstacles, playBoneSound]
  );

  useEffect(() => {
    const updateSize = () => {
      const wrapper = wrapperRef.current;
      const rawWidth = wrapper?.clientWidth || wrapper?.parentElement?.clientWidth || DEFAULT_GAME_WIDTH;
      const nextWidth = Math.max(MIN_GAME_WIDTH, Math.floor(rawWidth - 24));

      gameWidthRef.current = nextWidth;
      setGameWidth(nextWidth);

      const farthestObstacleX = Math.max(...obstaclesRef.current.map((obstacle) => obstacle.x));

      if (farthestObstacleX > nextWidth + 260) {
        const startX = nextWidth + 120;
        obstaclesRef.current = makeObstacles(startX);
        bonesRef.current = makeBones(startX);
      }
    };

    updateSize();

    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined" && wrapperRef.current) {
      resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(wrapperRef.current);
    } else {
      resizeTimerRef.current = window.setInterval(updateSize, 250);
    }

    window.addEventListener("resize", updateSize);

    return () => {
      resizeObserver?.disconnect();

      if (resizeTimerRef.current != null) {
        window.clearInterval(resizeTimerRef.current);
        resizeTimerRef.current = null;
      }

      window.removeEventListener("resize", updateSize);
    };
  }, [makeBones, makeObstacles]);

  useEffect(() => {
    let cancelled = false;

    jumpAudioPoolRef.current = Array.from({ length: 2 }, () =>
      createSound(jumpSoundSrc, 0.28)
    );
    boneAudioPoolRef.current = Array.from({ length: 2 }, () =>
      createSound(boneSoundSrc, 0.32)
    );

    const context = getAudioContext();

    const loadBuffer = async (
      src: string,
      onLoad: (buffer: AudioBuffer) => void
    ) => {
      if (!context) return;

      try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await context.decodeAudioData(arrayBuffer);

        if (!cancelled) {
          onLoad(buffer);
        }
      } catch {
        // HTMLAudio fallback pool handles browsers that cannot decode the buffer here.
      }
    };

    void loadBuffer(jumpSoundSrc, (buffer) => {
      jumpBufferRef.current = buffer;
    });
    void loadBuffer(boneSoundSrc, (buffer) => {
      boneBufferRef.current = buffer;
    });

    return () => {
      cancelled = true;
      [...jumpAudioPoolRef.current, ...boneAudioPoolRef.current].forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      jumpAudioPoolRef.current = [];
      boneAudioPoolRef.current = [];
      jumpBufferRef.current = null;
      boneBufferRef.current = null;

      const currentContext = audioContextRef.current;

      if (currentContext && currentContext.state !== "closed") {
        currentContext.close().catch(() => {});
      }

      audioContextRef.current = null;
    };
  }, [getAudioContext]);

  useEffect(() => {
    if (!active) {
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      lastTimeRef.current = 0;
      resetGame();
      return;
    }

    wrapperRef.current?.focus();

    const tick = (time: number) => {
      render(time);
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      lastTimeRef.current = 0;
    };
  }, [active, render, resetGame]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.code === "Space" || event.code === "ArrowUp") && !jumpPressedRef.current) {
      event.preventDefault();
      unlockAudio();

      if (gameOverRef.current) {
        jump();
        return;
      }

      jumpPressedRef.current = true;
      jumpChargeRef.current = 0;
    }
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.code === "Space" || event.code === "ArrowUp") {
      event.preventDefault();
      unlockAudio();
      jumpPressedRef.current = false;
      jump();
    }
  };

  if (!active) return null;

  return (
    <div
      ref={wrapperRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      className="mt-3 flex w-full flex-col items-center outline-none"
    >
      <div className="relative w-full overflow-hidden rounded-2xl border border-blue-100 bg-white p-2 shadow-sm">
        <canvas
          ref={canvasRef}
          width={gameWidth}
          height={GAME_HEIGHT}
          className="block w-full rounded-xl"
          style={{ height: GAME_HEIGHT }}
          onClick={() => {
            unlockAudio();
            wrapperRef.current?.focus();
          }}
        />

        <div className="px-2 pb-2 text-center">
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>

          <div className="mt-3 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
            <span className="rounded border border-slate-300 bg-white px-2 py-0.5 font-mono">
              Space
            </span>
            <span>점프</span>
            <span className="text-slate-300">|</span>
            <span>점수 {score}</span>
            {gameOver && <span className="font-semibold text-blue-600">다시 시작 가능</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
