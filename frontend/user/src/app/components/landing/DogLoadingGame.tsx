/*
File    : src/app/components/landing/DogLoadingGame.tsx
Author  : 김지우
Create  : 2026-05-14
Description : 랜딩 가이드 챗봇에서 실행되는 도그 점프 미니게임

Modification History:
    - 2026-05-14 (김지우) : 챗봇 게임 명령어 응답용 캔버스 미니게임 구현
    - 2026-05-14 (김지우) : 강아지 점프 효과음 적용
*/
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
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

type Obstacle = {
  x: number;
  height: number;
  width: number;
};

export default function DogLoadingGame({
  active,
  title = "가이드가 몸을 푸는 중입니다",
  subtitle = "Space 또는 ↑ 키를 짧게/길게 눌러 점프 높이를 조절하세요.",
}: DogLoadingGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const resizeTimerRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const jumpAudioRef = useRef<HTMLAudioElement | null>(null);

  const [gameWidth, setGameWidth] = useState(DEFAULT_GAME_WIDTH);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const dogYRef = useRef(GROUND_Y - DOG_RENDER_HEIGHT - DOG_GROUND_OFFSET);
  const velocityYRef = useRef(0);
  const isJumpingRef = useRef(false);
  const obstaclesRef = useRef<Obstacle[]>([
    { x: DEFAULT_GAME_WIDTH + 120, height: 42, width: OBSTACLE_WIDTH },
  ]);
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

  const resetGame = useCallback(() => {
    dogYRef.current = getDogGroundY();
    velocityYRef.current = 0;
    isJumpingRef.current = false;
    obstaclesRef.current = makeObstacles(gameWidthRef.current + 120);
    speedRef.current = 300;
    scoreRef.current = 0;
    jumpChargeRef.current = 0;
    jumpPressedRef.current = false;
    setScore(0);
    setGameOver(false);
    gameOverRef.current = false;
  }, [makeObstacles]);

  const playJumpSound = useCallback(() => {
    const audio = jumpAudioRef.current;

    if (!audio) return;

    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);

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

  const checkCollision = () => {
    const dogLeft = DOG_X + 18;
    const dogRight = DOG_X + DOG_RENDER_WIDTH - 12;
    const dogTop = dogYRef.current + 20;
    const dogBottom = dogYRef.current + DOG_RENDER_HEIGHT - 8;

    return obstaclesRef.current.some((obstacle) => {
      const obstacleLeft = obstacle.x;
      const obstacleRight = obstacle.x + obstacle.width;
      const obstacleTop = GROUND_Y - obstacle.height;

      return (
        dogRight > obstacleLeft &&
        dogLeft < obstacleRight &&
        dogBottom > obstacleTop &&
        dogTop < GROUND_Y
      );
    });
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

        if (obstaclesRef.current.every((obstacle) => obstacle.x < -obstacle.width)) {
          const startX = width + 80 + Math.random() * 150;
          obstaclesRef.current = makeObstacles(startX);
          scoreRef.current += 1;
          speedRef.current = Math.min(speedRef.current + 20, 760);
          setScore(scoreRef.current);
        }

        if (checkCollision()) {
          gameOverRef.current = true;
          setGameOver(true);
        }
      }

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
    [active, makeObstacles]
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
        obstaclesRef.current = makeObstacles(nextWidth + 120);
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
  }, [makeObstacles]);

  useEffect(() => {
    const jumpAudio = new Audio(jumpSoundSrc);
    jumpAudio.volume = 0.28;
    jumpAudio.preload = "auto";
    jumpAudioRef.current = jumpAudio;

    return () => {
      jumpAudio.pause();
      jumpAudioRef.current = null;
    };
  }, []);

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
          onClick={() => wrapperRef.current?.focus()}
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
