'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ===== TYPES =====
type GameState = 'menu' | 'playing' | 'gameover' | 'scores';
type GameType = 'dodger' | 'pacman' | 'tetris';
type Level = 1 | 2 | 3;
type LevelComplete = { complete: boolean; score: number };

// ===== STYLES =====
const COLORS = {
  bg: '#00FF41',
  green: '#00FF41',
  magenta: '#FF00FF',
  cyan: '#00FFFF',
  yellow: '#FFFF00',
  red: '#FF0000',
  white: '#FFFFFF',
  black: '#000000',
  blue: '#0066FF',
  gray: '#333333',
};

// ===== FALLBACK SCORES =====
const FALLBACK_SCORES = [
  { name: 'Xx_NoScope_xX', score: 999999 },
  { name: 'ERROR_42', score: 888888 },
  { name: 'GLITCH_MASTER', score: 777777 },
  { name: 'SYSTEM_FAILURE', score: 666666 },
  { name: 'NULL_POINTER', score: 555555 },
];

// ===== SABOTAGE MESSAGES =====
const SABOTAGE_MESSAGES = [
  "⚡ COSMIC RADIATION DETECTED - Level revoked!",
  "🧟 Your controls have been possessed by a ghost!",
  "📉 Score tax imposed! -5 points per coin!",
  "👻 PHANTOM WALL appeared out of nowhere!",
  "💀 SYSTEM ERROR 42: Reality glitching!",
  "🦆 A duck ate your progress! Quack!",
  "🔄 CONTROLS FLIPPED - Good luck!",
  "📊 SCORE MULTIPLIER: 0.5x (unlucky!)",
  "🎲 Random teleport in 3... 2... 1...",
  "⚠ LEVEL CORRUPTION - Starting over!",
  "🕐 Time went backward! -10 seconds!",
  "👾 GLITCH BOSS APPROACHING!",
];

// ===== POPUP ADS =====
const POPUP_ADS = [
  "🎰 WIN A FREE KEYBOARD WITH EXTRA KEYS!",
  "🔢 YOU ARE THE 1,000,000TH VISITOR (maybe)!",
  "💾 INSTALL MORE RAM NOW - Only $999.99!",
  "📈 YOUR SCORE COULD BE BETTER - Trust us!",
  "🎮 PLAY SNAKE ON YOUR CALCULATOR!",
  "💿 INSERT COIN TO CONTINUE (we accept thoughts)!",
  "🔞 WARNING: THIS AD IS UNSKIPPABLE! (jk)",
  "🎁 FREE IPAD (not really, but click anyway)!",
  "⚠ VIRUS DETECTED! Just kidding, we cannot detect!",
  "🌟 Become a PRO GAMER with our 3 easy steps!",
];

// ===== MAIN COMPONENT =====
export default function ArcadePage() {
  // Game state
  const [gameState, setGameState] = useState<GameState>('menu');
  const [currentGame, setCurrentGame] = useState<GameType>('dodger');
  const [currentLevel, setCurrentLevel] = useState<Level>(1);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [nameError, setNameError] = useState('');
  const [scores, setScores] = useState<Array<{ name: string; score: number }>>([]);
  const [isFallback, setIsFallback] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [adText, setAdText] = useState('');
  const [adOffset, setAdOffset] = useState(0);
  const [adCloseAttempts, setAdCloseAttempts] = useState(0);
  const [gameMessage, setGameMessage] = useState('');
  const [controlsFlipped, setControlsFlipped] = useState(false);
  const [flashScreen, setFlashScreen] = useState(false);
  const [levelComplete, setLevelComplete] = useState<LevelComplete>({ complete: false, score: 0 });

  // Dodger game state
  const [dodgerPlayer, setDodgerPlayer] = useState({ x: 10, y: 15 });
  const [dodgerEnemies, setDodgerEnemies] = useState([{ x: 3, y: 2 }, { x: 15, y: 5 }, { x: 8, y: 8 }]);
  const [dodgerCoins, setDodgerCoins] = useState([{ x: 5, y: 10, collected: false }, { x: 12, y: 3, collected: false }, { x: 18, y: 12, collected: false }, { x: 7, y: 17, collected: false }, { x: 14, y: 8, collected: false }]);
  
  // Dodger animation state
  const [dodgerFrame, setDodgerFrame] = useState(0);
  const [dodgerGlitch, setDodgerGlitch] = useState(false);

  // Pacman game state
  const [pacmanPos, setPacmanPos] = useState({ x: 1, y: 1 });
  const [pacmanDots, setPacmanDots] = useState<{x: number, y: number, eaten: boolean}[]>([]);
  const [pacmanEnemies, setPacmanEnemies] = useState<{x: number, y: number, dir: number}[]>([]);
  
  // Pacman maze (walls = #)
  const PACMAN_MAZE = [
    "################################",
    "#..............................#",
    "#.####.######.##..##.######.##.#",
    "#.####.######.##..##.######.##.#",
    "#..............................#",
    "#.####.##.######....##.##.####.#",
    "#......##....##......##........#",
    "######.####.##.####.########.###",
    "#..............................#",
    "#.########.##.####.##.########.#",
    "#........##..#..#..##..........#",
    "#.######.##..#..#..##.######.#.#",
    "#.#....#.##........##....#....#.#",
    "#...####.############.####....#.#",
    "################################",
  ];
  
  // Check if position is a wall
  const isWall = (x: number, y: number): boolean => {
    if (y < 0 || y >= PACMAN_MAZE.length || x < 0 || x >= PACMAN_MAZE[0].length) return true;
    return PACMAN_MAZE[y][x] === '#';
  };

  // Flood fill to find accessible positions from spawn
  const getAccessiblePositions = (startX: number, startY: number): Set<string> => {
    const accessible = new Set<string>();
    const queue: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();
    visited.add(`${startX},${startY}`);
    
    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      if (x >= 0 && x < PACMAN_MAZE[0].length && y >= 0 && y < PACMAN_MAZE.length) {
        if (PACMAN_MAZE[y][x] !== '#') {
          accessible.add(`${x},${y}`);
          const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
          for (const [dx, dy] of directions) {
            const key = `${x + dx},${y + dy}`;
            if (!visited.has(key)) {
              visited.add(key);
              queue.push([x + dx, y + dy]);
            }
          }
        }
      }
    }
    return accessible;
  };

  // Pre-compute accessible positions (from spawn at 1,1)
  const ACCESSIBLE_POSITIONS = getAccessiblePositions(1, 1);

  // Space Shooter game state
  const [shooterPlayer, setShooterPlayer] = useState({ x: 15 });
  const [shooterBullets, setShooterBullets] = useState<{x: number, y: number}[]>([]);
  const [shooterEnemies, setShooterEnemies] = useState<{x: number, y: number, type: 'asteroid' | 'alien' | 'boss', health: number}[]>([]);
  const [shooterEnemyBullets, setShooterEnemyBullets] = useState<{x: number, y: number}[]>([]);
  const [shooterKills, setShooterKills] = useState(0);
  const [shooterGlitch, setShooterGlitch] = useState(false);

  // Game refs
  const gameCanvasRef = useRef<HTMLDivElement>(null);

  // ===== FETCH SCORES =====
  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch('/api/scores');
      const data = await res.json();
      setScores(data.scores || FALLBACK_SCORES);
      setIsFallback(data.isFallback || false);
    } catch {
      setScores(FALLBACK_SCORES);
      setIsFallback(true);
    }
  }, []);

  // ===== SAVE SCORE =====
  const saveScore = useCallback(async () => {
    if (!playerName.trim()) return;
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, score: totalScore }),
      });
      const data = await res.json();
      setScores(data.scores || FALLBACK_SCORES);
      setIsFallback(data.isFallback || false);
    } catch {
      setScores(FALLBACK_SCORES);
      setIsFallback(true);
    }
  }, [playerName, totalScore]);

  // ===== VALIDATE NAME =====
  const validateName = (name: string): boolean => {
    if (name.length < 3 || name.length > 12) {
      setNameError('Name must be 3-12 characters. Chaos requires balance.');
      return false;
    }
    if (!/[0-9]/.test(name)) {
      setNameError('Your name needs at least one number. Be more random!');
      return false;
    }
    if (!/[A-Z]/.test(name)) {
      setNameError('UPPERCASE is mandatory. YELL YOUR NAME!');
      return false;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(name)) {
      setNameError('Add a symbol! We accept: !@#$%^&*()_+-=[]{}|;:,<>?');
      return false;
    }
    if (/[aeiouAEIOU]/.test(name)) {
      setNameError('Vowels are for the weak. Remove them!');
      return false;
    }
    setNameError('');
    return true;
  };

  // ===== INIT DODGER GAME =====
  const initDodgerGame = useCallback((level: Level) => {
    const enemyCount = 3 + level * 2;
    const enemies = [];
    for (let i = 0; i < enemyCount; i++) {
      enemies.push({ x: Math.floor(Math.random() * 18) + 1, y: Math.floor(Math.random() * 10) + 1 });
    }
    setDodgerEnemies(enemies);
    setDodgerPlayer({ x: 10, y: 15 });
    const coins = [
      { x: 5, y: 10, collected: false },
      { x: 12, y: 3, collected: false },
      { x: 18, y: 12, collected: false },
      { x: 7, y: 17, collected: false },
      { x: 14, y: 8, collected: false },
    ];
    setDodgerCoins(coins);
    setScore(0);
    setLevelComplete({ complete: false, score: 0 });
  }, []);

  // ===== INIT PACMAN GAME =====
  const initPacmanGame = useCallback((level: Level) => {
    setPacmanPos({ x: 1, y: 1 });
    
    // Generate dots only in accessible positions
    const accessibleArray = Array.from(ACCESSIBLE_POSITIONS);
    const dots: {x: number, y: number, eaten: boolean}[] = [];
    
    // Filter out spawn area (top-left area)
    const validPositions = accessibleArray.filter(pos => {
      const [x, y] = pos.split(',').map(Number);
      return !(x >= 1 && x <= 3 && y >= 1 && y <= 2);
    });
    
    // Place dots in ~12% of accessible positions
    for (const pos of validPositions) {
      if (Math.random() < 0.12 && dots.length < 60) {
        const [x, y] = pos.split(',').map(Number);
        dots.push({ x, y, eaten: false });
      }
    }
    
    // Ensure minimum dots
    if (dots.length < 15) {
      for (const pos of validPositions) {
        if (dots.length >= 30) break;
        const [x, y] = pos.split(',').map(Number);
        if (!dots.some(d => d.x === x && d.y === y)) {
          dots.push({ x, y, eaten: false });
        }
      }
    }
    
    setPacmanDots(dots);
    
    // Add enemies (ghosts) at spawn points
    const enemyCount = 2 + level; // 3 enemies on level 1, 4 on level 2, 5 on level 3
    const enemies: {x: number, y: number, dir: number}[] = [];
    const enemySpawns = [
      { x: 15, y: 6 }, { x: 16, y: 6 }, // Center spawn
      { x: 1, y: 13 }, { x: 30, y: 13 }, // Bottom corners
      { x: 15, y: 1 }, // Top
    ];
    for (let i = 0; i < enemyCount && i < enemySpawns.length; i++) {
      enemies.push({ ...enemySpawns[i], dir: Math.floor(Math.random() * 4) });
    }
    setPacmanEnemies(enemies);
    
    setScore(0);
    setLevelComplete({ complete: false, score: 0 });
  }, []);

  // ===== INIT SPACE SHOOTER GAME =====
  const initShooterGame = useCallback(() => {
    setShooterPlayer({ x: 15 });
    setShooterBullets([]);
    // Spawn initial enemies immediately
    const initialEnemies = [];
    for (let i = 0; i < 3; i++) {
      initialEnemies.push({
        x: 2 + Math.floor(Math.random() * 26),
        y: Math.floor(Math.random() * 5), // Staggered Y positions
        type: 'asteroid' as const,
        health: 1
      });
    }
    setShooterEnemies(initialEnemies);
    setShooterEnemyBullets([]);
    setShooterKills(0);
    setShooterGlitch(false);
    setScore(0);
    setLevelComplete({ complete: false, score: 0 });
  }, []);

  // ===== START GAME =====
  const startGame = () => {
    if (!validateName(playerName)) return;
    setScore(0);
    setTotalScore(0);
    setCurrentLevel(1);
    setCurrentGame('dodger');
    setLevelComplete({ complete: false, score: 0 });
    initDodgerGame(1);
    setGameState('playing');
  };

  // ===== SHOW RANDOM AD =====
  const showRandomAd = useCallback(() => {
    const ad = POPUP_ADS[Math.floor(Math.random() * POPUP_ADS.length)];
    setAdText(ad);
    setShowAd(true);
    setAdCloseAttempts(0);
  }, []);

  // ===== CLOSE AD (DIFFICULT) =====
  const handleCloseAd = () => {
    setAdCloseAttempts(prev => prev + 1);
    if (Math.random() < 0.3 || adCloseAttempts > 2) {
      setShowAd(false);
      if (Math.random() < 0.2) {
        setTimeout(() => {
          showRandomAd();
        }, 2000 + Math.random() * 5000);
      }
    }
  };

  // ===== AD EFFECT =====
  useEffect(() => {
    const adInterval = setInterval(() => {
      if (gameState === 'playing' && !showAd && Math.random() < 0.4) {
        showRandomAd();
      }
    }, 45000 + Math.random() * 45000);
    return () => clearInterval(adInterval);
  }, [gameState, showAd, showRandomAd]);

  // ===== SCREEN FLASH EFFECT =====
  useEffect(() => {
    const flashInterval = setInterval(() => {
      if (gameState === 'playing') {
        setFlashScreen(true);
        setTimeout(() => setFlashScreen(false), 200);
      }
    }, 20000);
    return () => clearInterval(flashInterval);
  }, [gameState]);

  // ===== DODGER ANIMATION EFFECT =====
  useEffect(() => {
    if (currentGame !== 'dodger' || gameState !== 'playing') return;
    
    const animInterval = setInterval(() => {
      // Update frame counter for animations (0-7)
      setDodgerFrame(f => (f + 1) % 8);
      
      // Random glitch effect (8% chance per frame)
      if (Math.random() < 0.08) {
        setDodgerGlitch(true);
        setTimeout(() => setDodgerGlitch(false), 80);
      }
    }, 120);
    
    return () => clearInterval(animInterval);
  }, [currentGame, gameState]);

  // ===== PACMAN ENEMY AUTO-MOVEMENT =====
  useEffect(() => {
    if (currentGame !== 'pacman' || gameState !== 'playing' || levelComplete.complete) return;
    
    const moveEnemies = () => {
      setPacmanEnemies(prev => {
        const movedEnemies = prev.map(enemy => {
          let newDir = enemy.dir;
          if (Math.random() < 0.25) {
            newDir = Math.floor(Math.random() * 4);
          }
          
          const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
          const [dx, dy] = directions[newDir];
          let ex = enemy.x + dx;
          let ey = enemy.y + dy;
          
          if (isWall(ex, ey)) {
            for (let i = 0; i < 4; i++) {
              const [ndx, ndy] = directions[i];
              if (!isWall(enemy.x + ndx, enemy.y + ndy)) {
                ex = enemy.x + ndx;
                ey = enemy.y + ndy;
                newDir = i;
                break;
              }
            }
          }
          
          return { x: ex, y: ey, dir: newDir };
        });
        
        // Check if any enemy hit pacman
        const hitEnemy = movedEnemies.some(e => e.x === pacmanPos.x && e.y === pacmanPos.y);
        if (hitEnemy) {
          setScore(s => Math.max(0, s - 100));
          // Flash screen on hit
          setFlashScreen(true);
          setTimeout(() => setFlashScreen(false), 150);
        }
        
        return movedEnemies;
      });
    };
    
    const enemyInterval = setInterval(moveEnemies, 400 + Math.random() * 200);
    return () => clearInterval(enemyInterval);
  }, [currentGame, gameState, levelComplete.complete, pacmanPos]);

  // ===== SPACE SHOOTER GAME LOOP =====
  useEffect(() => {
    if (currentGame !== 'tetris' || gameState !== 'playing' || levelComplete.complete) return;
    
    const KILLS_TO_WIN = 15 + currentLevel * 5; // Level 1: 20, Level 2: 25, Level 3: 30
    
    // Spawn enemies
    const spawnEnemy = () => {
      const type = currentLevel === 1 ? 'asteroid' : 
                   currentLevel === 2 ? (Math.random() < 0.6 ? 'asteroid' : 'alien') :
                   (Math.random() < 0.4 ? 'asteroid' : Math.random() < 0.7 ? 'alien' : 'boss');
      const health = type === 'boss' ? 3 : type === 'alien' ? 2 : 1;
      
      setShooterEnemies(prev => {
        if (prev.length < 5 + currentLevel * 2) {
          return [...prev, {
            x: 2 + Math.floor(Math.random() * 26),
            y: 0,
            type,
            health
          }];
        }
        return prev;
      });
    };
    
    // Move bullets up
    const moveBullets = () => {
      setShooterBullets(prev => 
        prev.map(b => ({ ...b, y: b.y - 1 })).filter(b => b.y >= 0)
      );
    };
    
    // Move enemies down
    const moveEnemies = () => {
      setShooterEnemies(prev => {
        const moved = prev.map(e => ({
          ...e,
          y: e.y + 1,
          x: e.type === 'alien' ? e.x + (Math.random() < 0.5 ? -1 : 1) : e.x,
        })).filter(e => e.x >= 1 && e.x <= 28);
        
        // Check if any enemy reached bottom
        const reachedBottom = moved.some(e => e.y >= 23);
        if (reachedBottom) {
          setScore(s => Math.max(0, s - 50));
        }
        
        return moved.filter(e => e.y < 23);
      });
    };
    
    // Enemy shooting (level 2+)
    const enemyShoot = () => {
      if (currentLevel >= 2) {
        setShooterEnemyBullets(prev => {
          const shooters = shooterEnemies.filter(e => e.type !== 'asteroid' && Math.random() < 0.3);
          return [...prev, ...shooters.map(e => ({ x: e.x, y: e.y + 1 }))];
        });
      }
    };
    
    // Move enemy bullets down
    const moveEnemyBullets = () => {
      setShooterEnemyBullets(prev => 
        prev.map(b => ({ ...b, y: b.y + 1 })).filter(b => b.y < 25)
      );
    };
    
    // Collision detection
    const checkCollisions = () => {
      setShooterBullets(prevBullets => {
        setShooterEnemies(prevEnemies => {
          let newKills = 0;
          
          const remainingEnemies = prevEnemies.map(e => {
            const hit = prevBullets.find(b => b.x >= e.x - 1 && b.x <= e.x + 1 && b.y === e.y);
            if (hit) {
              const newHealth = e.health - 1;
              if (newHealth <= 0) {
                newKills++;
                return null;
              }
              return { ...e, health: newHealth };
            }
            return e;
          }).filter(Boolean) as typeof prevEnemies;
          
          if (newKills > 0) {
            const killScore = newKills * 100;
            setShooterKills(k => {
              const newKillsTotal = k + newKills;
              // Add score for kills
              setScore(s => s + killScore);
              
              // Check win condition
              if (newKillsTotal >= KILLS_TO_WIN) {
                setLevelComplete({ complete: true, score: killScore });
              }
              return newKillsTotal;
            });
            
            // Random glitch on kill
            if (Math.random() < 0.2) {
              setShooterGlitch(true);
              setTimeout(() => setShooterGlitch(false), 100);
            }
          }
          
          return remainingEnemies;
        });
        
        // Remove bullets that hit
        return prevBullets.filter(b => {
          return !shooterEnemies.some(e => b.x >= e.x - 1 && b.x <= e.x + 1 && b.y === e.y);
        });
      });
      
      // Check player hit by enemy bullets
      setShooterEnemyBullets(prev => {
        const hitPlayer = prev.some(b => b.x === shooterPlayer.x && b.y >= 22);
        if (hitPlayer) {
          setScore(s => Math.max(0, s - 100));
          setFlashScreen(true);
          setTimeout(() => setFlashScreen(false), 150);
        }
        return prev.filter(b => !(b.x === shooterPlayer.x && b.y >= 22));
      });
    };
    
    // Run game loop
    const gameLoop = setInterval(() => {
      moveBullets();
      moveEnemies();
      moveEnemyBullets();
      checkCollisions();
    }, 150);
    
    const spawnInterval = setInterval(spawnEnemy, 1500 - currentLevel * 300);
    const shootInterval = setInterval(enemyShoot, 2000);
    
    return () => {
      clearInterval(gameLoop);
      clearInterval(spawnInterval);
      clearInterval(shootInterval);
    };
  }, [currentGame, gameState, levelComplete.complete, currentLevel, shooterPlayer.x, shooterEnemies, score]);

  // ===== RENDER DODGER GAME (ANIMATED) =====
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renderDodgerGame = useCallback(() => {
    const GRID_SIZE = 20;
    const grid: string[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('.'));
    
    // Animated characters based on frame
    const enemyChars = ['X', 'x', '✕', 'X', 'χ', 'X', '✖', 'X'];
    const coinChars = ['$', '§', '₣', '$', '€', '$', 'Ø', '¢'];
    const playerChars = ['@', '◎', '◉', '○', '●', '◎', '@', '◉'];
    
    // Render enemies with animation (red X, flickering)
    dodgerEnemies.forEach(e => {
      if (e.y < GRID_SIZE && e.x < GRID_SIZE) {
        grid[e.y][e.x] = enemyChars[dodgerFrame];
      }
    });
    
    // Render coins with animation (yellow $, spinning)
    dodgerCoins.forEach(c => {
      if (!c.collected && c.y < GRID_SIZE && c.x < GRID_SIZE) {
        grid[c.y][c.x] = coinChars[dodgerFrame];
      }
    });
    
    // Render player with animation (cyan @, pulsing)
    if (dodgerPlayer.y < GRID_SIZE && dodgerPlayer.x < GRID_SIZE) {
      grid[dodgerPlayer.y][dodgerPlayer.x] = playerChars[dodgerFrame];
    }

    // Apply glitch effect - random character swaps
    let displayGrid = grid.map(row => [...row]);
    if (dodgerGlitch) {
      displayGrid = displayGrid.map(row => 
        row.map(cell => Math.random() < 0.15 
          ? ['@', 'X', '$', '.', '#', '!', '?', '*'][Math.floor(Math.random() * 8)] 
          : cell)
      );
    }

    const lines: React.ReactElement[] = [];
    displayGrid.forEach((row, y) => {
      const cells: React.ReactElement[] = [];
      row.forEach((cell, x) => {
        let color = COLORS.green;
        let glow = 'none';
        
        if (cell === '@' || cell === '◎' || cell === '◉' || cell === '○' || cell === '●') {
          color = COLORS.cyan;
          glow = `0 0 8px ${COLORS.cyan}`;
        } else if (cell === 'X' || cell === 'x' || cell === '✕' || cell === 'χ' || cell === '✖') {
          color = COLORS.red;
          glow = `0 0 8px ${COLORS.red}`;
        } else if (cell === '$' || cell === '§' || cell === '₣' || cell === '€' || cell === 'Ø' || cell === '¢') {
          color = COLORS.yellow;
          glow = `0 0 8px ${COLORS.yellow}`;
        }
        
        cells.push(
          <span 
            key={x} 
            style={{ 
              color, 
              textShadow: glow,
              display: 'inline-block',
              width: '1ch',
              textAlign: 'center',
            }}
          >
            {cell}
          </span>
        );
      });
      lines.push(
        <div 
          key={y} 
          style={{
            transform: dodgerGlitch 
              ? `translate(${(Math.random() - 0.5) * 4}px, ${(Math.random() - 0.5) * 2}px)` 
              : 'none',
            filter: dodgerGlitch ? 'hue-rotate(90deg)' : 'none',
          }}
        >
          {cells}
        </div>
      );
    });
    return <>{lines}</>;
  }, [dodgerPlayer, dodgerEnemies, dodgerCoins, dodgerFrame, dodgerGlitch]);

  // ===== RENDER PACMAN GAME (COLORED) =====
  const renderPacmanGame = useCallback(() => {
    const lines: React.ReactElement[] = [];
    PACMAN_MAZE.forEach((row, y) => {
      const cells: React.ReactElement[] = [];
      row.split('').forEach((cell, x) => {
        // Check for dot at this position
        const dot = pacmanDots.find(d => d.x === x && d.y === y && !d.eaten);
        if (dot) {
          cells.push(<span key={x} style={{ color: COLORS.white }}>·</span>);
          return;
        }
        
        // Check for enemy at this position
        const enemy = pacmanEnemies.find(e => e.x === x && e.y === y);
        if (enemy) {
          cells.push(<span key={x} style={{ color: COLORS.red }}>♥</span>);
          return;
        }
        
        // Check for pacman
        if (x === pacmanPos.x && y === pacmanPos.y) {
          cells.push(<span key={x} style={{ color: COLORS.yellow }}>☺</span>);
          return;
        }
        
        // Render wall or empty space
        const color = cell === '#' ? COLORS.blue : COLORS.black;
        cells.push(<span key={x} style={{ color }}>{cell === '#' ? '█' : ' '}</span>);
      });
      lines.push(<div key={y}>{cells}</div>);
    });
    return <>{lines}</>;
  }, [pacmanPos, pacmanDots, pacmanEnemies]);

  // ===== RENDER SPACE SHOOTER GAME =====
  const renderShooterGame = useCallback(() => {
    const WIDTH = 30;
    const HEIGHT = 25;
    const grid: string[][] = Array(HEIGHT).fill(null).map(() => Array(WIDTH).fill(' '));
    
    // Draw stars (background)
    for (let i = 0; i < 20; i++) {
      const sx = Math.floor(Math.random() * WIDTH);
      const sy = Math.floor(Math.random() * HEIGHT);
      grid[sy][sx] = '.';
    }
    
    // Draw player ship (bottom center)
    const px = shooterPlayer.x;
    if (px >= 0 && px < WIDTH) {
      grid[HEIGHT - 2][px] = '▲';
      grid[HEIGHT - 1][px - 1] = '/';
      grid[HEIGHT - 1][px] = '█';
      grid[HEIGHT - 1][px + 1] = '\\';
    }
    
    // Draw player bullets
    shooterBullets.forEach(b => {
      if (b.y >= 0 && b.y < HEIGHT && b.x >= 0 && b.x < WIDTH) {
        grid[b.y][b.x] = '|';
      }
    });
    
    // Draw enemies
    shooterEnemies.forEach(e => {
      if (e.y >= 0 && e.y < HEIGHT && e.x >= 0 && e.x < WIDTH) {
        if (e.type === 'asteroid') {
          grid[e.y][e.x] = '●';
        } else if (e.type === 'alien') {
          grid[e.y][e.x] = '◄';
        } else if (e.type === 'boss') {
          grid[e.y][e.x - 1] = '[';
          grid[e.y][e.x] = '█';
          grid[e.y][e.x + 1] = ']';
        }
      }
    });
    
    // Draw enemy bullets
    shooterEnemyBullets.forEach(b => {
      if (b.y >= 0 && b.y < HEIGHT && b.x >= 0 && b.x < WIDTH) {
        grid[b.y][b.x] = 'v';
      }
    });
    
    // Apply glitch effect
    if (shooterGlitch) {
      for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
          if (Math.random() < 0.1) {
            grid[y][x] = ['@', '#', '%', '&', '*'][Math.floor(Math.random() * 5)];
          }
        }
      }
    }
    
    const lines: React.ReactElement[] = [];
    grid.forEach((row, y) => {
      const cells: React.ReactElement[] = [];
      row.forEach((cell, x) => {
        let color = COLORS.gray;
        let glow = 'none';
        
        // Player ship - cyan
        if (cell === '▲' || cell === '█') {
          color = COLORS.cyan;
          glow = `0 0 8px ${COLORS.cyan}`;
        } else if (cell === '/' || cell === '\\') {
          color = COLORS.cyan;
        }
        // Player bullets - yellow
        else if (cell === '|') {
          color = COLORS.yellow;
          glow = `0 0 5px ${COLORS.yellow}`;
        }
        // Enemies
        else if (cell === '●') {
          color = COLORS.red;
          glow = `0 0 5px ${COLORS.red}`;
        } else if (cell === '◄') {
          color = COLORS.magenta;
          glow = `0 0 5px ${COLORS.magenta}`;
        } else if (cell === '[' || cell === ']') {
          color = COLORS.red;
          glow = `0 0 10px ${COLORS.red}`;
        }
        // Enemy bullets - red
        else if (cell === 'v') {
          color = COLORS.red;
          glow = `0 0 5px ${COLORS.red}`;
        }
        // Stars - dim white
        else if (cell === '.') {
          color = '#444444';
        }
        // Glitch chars - random colors
        else if (['@', '#', '%', '&', '*'].includes(cell)) {
          color = [COLORS.magenta, COLORS.cyan, COLORS.yellow, COLORS.green][Math.floor(Math.random() * 4)];
        }
        
        cells.push(
          <span 
            key={x} 
            style={{ 
              color, 
              textShadow: glow,
              display: 'inline-block',
              width: '1ch',
              textAlign: 'center',
            }}
          >
            {cell}
          </span>
        );
      });
      lines.push(<div key={y}>{cells}</div>);
    });
    
    return <>{lines}</>;
  }, [shooterPlayer, shooterBullets, shooterEnemies, shooterEnemyBullets, shooterGlitch]);

  // ===== HANDLE KEYDOWN (GAME CONTROLS) =====
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (gameState !== 'playing' || levelComplete.complete) return;

    // DODGER GAME CONTROLS
    if (currentGame === 'dodger') {
      let newX = dodgerPlayer.x;
      let newY = dodgerPlayer.y;
      
      if (e.key === 'ArrowUp' || e.key === 'w') newY = Math.max(0, dodgerPlayer.y - 1);
      if (e.key === 'ArrowDown' || e.key === 's') newY = Math.min(19, dodgerPlayer.y + 1);
      if (e.key === 'ArrowLeft' || e.key === 'a') newX = Math.max(0, dodgerPlayer.x - 1);
      if (e.key === 'ArrowRight' || e.key === 'd') newX = Math.min(19, dodgerPlayer.x + 1);
      
      if (controlsFlipped) {
        newX = Math.max(0, Math.min(19, 2 * dodgerPlayer.x - newX));
        newY = Math.max(0, Math.min(19, 2 * dodgerPlayer.y - newY));
      }
      
      if (newX !== dodgerPlayer.x || newY !== dodgerPlayer.y) {
        setDodgerPlayer({ x: newX, y: newY });
        
        // Check for coin collection
        let scoreChange = 0;
        setDodgerCoins(prev => {
          const updated = prev.map(c => {
            if (!c.collected && c.x === newX && c.y === newY) {
              scoreChange += 100;
              return { ...c, collected: true };
            }
            return c;
          });
          // Check win condition
          const allCollected = updated.every(c => c.collected);
          if (allCollected) {
            setLevelComplete({ complete: true, score: score + scoreChange });
          }
          return updated;
        });
        
        // Check for enemy collision
        const hitEnemy = dodgerEnemies.some(e => e.x === newX && e.y === newY);
        if (hitEnemy) {
          setScore(s => Math.max(0, s - 50));
        }
        
        setScore(s => s + scoreChange);
      }
    }

    // PACMAN GAME CONTROLS
    if (currentGame === 'pacman') {
      let newX = pacmanPos.x;
      let newY = pacmanPos.y;
      const maxX = PACMAN_MAZE[0].length - 2;
      const maxY = PACMAN_MAZE.length - 2;
      
      if (e.key === 'ArrowUp' || e.key === 'w') newY = Math.max(1, pacmanPos.y - 1);
      if (e.key === 'ArrowDown' || e.key === 's') newY = Math.min(maxY, pacmanPos.y + 1);
      if (e.key === 'ArrowLeft' || e.key === 'a') newX = Math.max(1, pacmanPos.x - 1);
      if (e.key === 'ArrowRight' || e.key === 'd') newX = Math.min(maxX, pacmanPos.x + 1);
      
      if (controlsFlipped) {
        newX = Math.max(1, Math.min(maxX, 2 * pacmanPos.x - newX));
        newY = Math.max(1, Math.min(maxY, 2 * pacmanPos.y - newY));
      }
      
      // Wall collision check
      if (!isWall(newX, newY) && (newX !== pacmanPos.x || newY !== pacmanPos.y)) {
        setPacmanPos({ x: newX, y: newY });
        
        // Check for dot collection
        let scoreChange = 0;
        setPacmanDots(prev => {
          const updated = prev.map(d => {
            if (!d.eaten && d.x === newX && d.y === newY) {
              scoreChange += 50;
              return { ...d, eaten: true };
            }
            return d;
          });
          // Check win condition
          const remaining = updated.filter(d => !d.eaten);
          if (remaining.length === 0) {
            setLevelComplete({ complete: true, score: score + scoreChange });
          }
          return updated;
        });
        
        setScore(s => s + 50);
      }
      
      // Enemy movement and collision
      setPacmanEnemies(prev => {
        const movedEnemies = prev.map(enemy => {
          // Random direction change
          let newDir = enemy.dir;
          if (Math.random() < 0.3) {
            newDir = Math.floor(Math.random() * 4);
          }
          
          // Try to move in current direction
          const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // up, down, left, right
          const [dx, dy] = directions[newDir];
          let ex = enemy.x + dx;
          let ey = enemy.y + dy;
          
          // If blocked, try random direction
          if (isWall(ex, ey)) {
            for (let i = 0; i < 4; i++) {
              const [ndx, ndy] = directions[i];
              if (!isWall(enemy.x + ndx, enemy.y + ndy)) {
                ex = enemy.x + ndx;
                ey = enemy.y + ndy;
                newDir = i;
                break;
              }
            }
          }
          
          return { x: ex, y: ey, dir: newDir };
        });
        
        // Check if any enemy hit pacman
        const hitEnemy = movedEnemies.some(e => e.x === pacmanPos.x && e.y === pacmanPos.y);
        if (hitEnemy) {
          setScore(s => Math.max(0, s - 100));
        }
        
        return movedEnemies;
      });
    }

    // SPACE SHOOTER GAME CONTROLS
    if (currentGame === 'tetris') {
      let newX = shooterPlayer.x;
      
      if (e.key === 'ArrowLeft' || e.key === 'a') newX = Math.max(2, shooterPlayer.x - 1);
      if (e.key === 'ArrowRight' || e.key === 'd') newX = Math.min(27, shooterPlayer.x + 1);
      
      // Shoot with space or up arrow
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        setShooterBullets(prev => [...prev, { x: shooterPlayer.x, y: 22 }]);
        setScore(s => s + 5); // Small score for shooting
      }
      
      if (controlsFlipped) {
        newX = Math.max(2, Math.min(27, 2 * shooterPlayer.x - newX));
      }
      
      if (newX !== shooterPlayer.x) {
        setShooterPlayer({ x: newX });
      }
    }

    // Random sabotage: 30% chance on level 2+
    if (Math.random() < 0.3 && currentLevel >= 2) {
      const sabotage = Math.floor(Math.random() * SABOTAGE_MESSAGES.length);
      const message = SABOTAGE_MESSAGES[sabotage];
      
      if (message.includes('CONTROLS FLIPPED')) {
        setControlsFlipped(true);
      } else if (message.includes('Score tax')) {
        setScore(prev => Math.max(0, prev - 5));
      } else if (message.includes('MULTIPLIER')) {
        setScore(prev => Math.floor(prev * 0.5));
      }
      
      setGameMessage(message);
      setTimeout(() => {
        setGameMessage('');
        setControlsFlipped(false);
      }, 3000);
    }
  }, [gameState, currentLevel, currentGame, levelComplete.complete, dodgerPlayer, dodgerEnemies, dodgerCoins, pacmanPos, pacmanDots, shooterPlayer, shooterBullets, controlsFlipped, score]);

  // ===== NEXT LEVEL =====
  const nextLevel = useCallback(() => {
    if (currentLevel < 3) {
      setCurrentLevel(prev => (prev + 1) as Level);
      setScore(0);
      setGameMessage(`🎮 LEVEL ${currentLevel + 1} STARTING!`);
      if (currentGame === 'dodger') initDodgerGame((currentLevel + 1) as Level);
      if (currentGame === 'pacman') initPacmanGame((currentLevel + 1) as Level);
      if (currentGame === 'tetris') initShooterGame();
    } else {
      setTotalScore(prev => prev + score);
      if (currentGame === 'dodger') {
        setCurrentGame('pacman');
        setScore(0);
        setCurrentLevel(1);
        setGameMessage('👻 WELCOME TO PAC-MAN BUT CONFUSED!');
        initPacmanGame(1);
      } else if (currentGame === 'pacman') {
        setCurrentGame('tetris');
        setScore(0);
        setCurrentLevel(1);
        setGameMessage('🚀 WELCOME TO SPACE SHOOTER OF DOOM!');
        initShooterGame();
      } else {
        setTotalScore(prev => prev + score);
        saveScore();
        setGameState('gameover');
      }
    }
    setLevelComplete({ complete: false, score: 0 });
    setTimeout(() => setGameMessage(''), 3000);
  }, [currentLevel, currentGame, score, saveScore, initDodgerGame, initPacmanGame, initShooterGame]);

  // ===== GAME OVER =====
  const handleGameOver = () => {
    setTotalScore(prev => prev + score);
    saveScore();
    setGameState('gameover');
  };

  // ===== MOUNT EFFECT =====
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchScores();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fetchScores, handleKeyDown]);

  // ===== RENDER =====
  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.bg,
      fontFamily: '"Courier New", monospace',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Flash effect */}
      {flashScreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: COLORS.white,
          opacity: 0.3,
          zIndex: 1000,
          pointerEvents: 'none',
        }} />
      )}

      {/* Header */}
      <header style={{
        textAlign: 'center',
        marginBottom: '20px',
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          color: COLORS.magenta,
          textShadow: `3px 3px 0 ${COLORS.cyan}, -3px -3px 0 ${COLORS.yellow}`,
          animation: 'blink 0.5s infinite',
          margin: 0,
        }}>
          WORST 3 GAME CHALLENGE
        </h1>
        <p style={{
          color: COLORS.black,
          fontSize: '1.2rem',
          fontWeight: 'bold',
        }}>
          🎮 Designer&apos;s Nightmare Edition v0.0.1-beta-glitch 🎮
        </p>
        <style>{`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </header>

      {/* Main content */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        flexWrap: 'wrap',
      }}>
        {/* Left panel - Scoreboard */}
        <div style={{
          background: COLORS.black,
          border: `4px solid ${COLORS.magenta}`,
          padding: '15px',
          minWidth: '250px',
          boxShadow: `0 0 20px ${COLORS.cyan}`,
        }}>
          <h2 style={{
            color: COLORS.yellow,
            textAlign: 'center',
            margin: '0 0 15px 0',
            animation: 'blink 1s infinite',
          }}>
            🏆 TOP 10 SCORES
          </h2>
          {isFallback && (
            <p style={{ color: COLORS.red, fontSize: '0.7rem', textAlign: 'center' }}>
              ⚠ Using fallback data
            </p>
          )}
          <ol style={{
            color: COLORS.cyan,
            paddingLeft: '25px',
            margin: 0,
          }}>
            {scores.slice(0, 10).map((s, i) => (
              <li key={i} style={{
                marginBottom: '5px',
                animation: i % 2 === 0 ? 'flicker 2s infinite' : 'none',
              }}>
                <span style={{ color: COLORS.magenta }}>{s.name}</span>
                {' → '}
                <span style={{ color: COLORS.yellow }}>{s.score}</span>
              </li>
            ))}
          </ol>
          <style>{`
            @keyframes flicker {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
          `}</style>
        </div>

        {/* Center - Game area */}
        <div style={{
          background: COLORS.black,
          border: `4px solid ${COLORS.cyan}`,
          padding: '20px',
          boxShadow: `0 0 30px ${COLORS.magenta}`,
        }}>
          {gameState === 'menu' && (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{
                color: COLORS.yellow,
                fontSize: '1.8rem',
                marginBottom: '20px',
              }}>
                🚀 START YOUR NIGHTMARE
              </h2>
              
              {/* Name input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: COLORS.cyan,
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}>
                  ENTER CHAOS NAME:
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value.toUpperCase());
                    setNameError('');
                  }}
                  placeholder="X_X_NO_SCOPE_X_X"
                  style={{
                    background: COLORS.black,
                    border: `2px solid ${COLORS.magenta}`,
                    color: COLORS.green,
                    padding: '10px',
                    fontSize: '1rem',
                    fontFamily: '"Courier New", monospace',
                    width: '250px',
                    textAlign: 'center',
                  }}
                />
                {nameError && (
                  <p style={{
                    color: COLORS.red,
                    fontSize: '0.8rem',
                    marginTop: '5px',
                  }}>
                    {nameError}
                  </p>
                )}
                <p style={{
                  color: COLORS.yellow,
                  fontSize: '0.7rem',
                  marginTop: '5px',
                }}>
                  Requirements: 3-12 chars, 1 number, 1 uppercase, 1 symbol, NO vowels
                </p>
              </div>

              <button
                onClick={startGame}
                style={{
                  background: COLORS.magenta,
                  color: COLORS.black,
                  border: `3px solid ${COLORS.cyan}`,
                  padding: '15px 40px',
                  fontSize: '1.3rem',
                  fontFamily: '"Courier New", monospace',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  animation: 'blink 0.8s infinite',
                }}
              >
                🎲 PLAY NOW!
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <div>
              {/* Game info */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '10px',
                color: COLORS.cyan,
                fontSize: '0.9rem',
              }}>
                <span>PLAYER: <span style={{ color: COLORS.magenta }}>{playerName}</span></span>
                <span>TOTAL: <span style={{ color: COLORS.yellow }}>{totalScore}</span></span>
                <span>LEVEL: <span style={{ color: COLORS.red }}>{currentLevel}</span></span>
              </div>

              {/* Current game */}
              <div style={{
                marginBottom: '10px',
                color: COLORS.yellow,
                fontSize: '1.2rem',
                textAlign: 'center',
                fontWeight: 'bold',
              }}>
                {currentGame === 'dodger' && '🎮 GLITCH DODGER 3000'}
                {currentGame === 'pacman' && '👻 PAC-MAN BUT CONFUSED'}
                {currentGame === 'tetris' && '🚀 SPACE SHOOTER OF DOOM'}
              </div>

              {/* Score */}
              <div style={{
                textAlign: 'center',
                marginBottom: '10px',
                fontSize: '1.5rem',
                color: COLORS.green,
              }}>
                SCORE: {score}
                {currentGame === 'tetris' && <span style={{ fontSize: '0.8rem', color: COLORS.yellow, marginLeft: '20px' }}>KILLS: {shooterKills}/{15 + currentLevel * 5}</span>}
              </div>

              {/* Game message */}
              {gameMessage && (
                <div style={{
                  background: COLORS.red,
                  color: COLORS.white,
                  padding: '10px',
                  marginBottom: '10px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  animation: 'pulse 0.5s infinite',
                }}>
                  {gameMessage}
                </div>
              )}

              {/* Game window - 600x600 */}
              <div
                ref={gameCanvasRef}
                style={{
                  width: '600px',
                  height: '600px',
                  background: COLORS.black,
                  border: `3px solid ${COLORS.yellow}`,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* ASCII Game Render */}
                <pre style={{
                  color: COLORS.green,
                  fontSize: '14px',
                  lineHeight: '14px',
                  margin: 0,
                  padding: '10px',
                  whiteSpace: 'pre',
                }}>
                  {currentGame === 'dodger' && renderDodgerGame()}
                  {currentGame === 'pacman' && renderPacmanGame()}
                  {currentGame === 'tetris' && renderShooterGame()}
                </pre>

                {/* Game controls hint */}
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  right: '10px',
                  textAlign: 'center',
                  color: controlsFlipped ? COLORS.red : COLORS.cyan,
                  fontSize: '0.8rem',
                }}>
                  {controlsFlipped ? '🔄 CONTROLS FLIPPED! 🔄' : 
                   currentGame === 'tetris' ? '← → TO MOVE, SPACE TO SHOOT' : 
                   '↑↓←→ ARROW KEYS OR WASD TO MOVE'}
                </div>

                {/* Level complete overlay - only shows when level is complete */}
                {levelComplete.complete && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: COLORS.black,
                  border: `3px solid ${COLORS.magenta}`,
                  padding: '20px',
                  textAlign: 'center',
                  zIndex: 100,
                }}>
                  <p style={{ color: COLORS.yellow, fontSize: '1.2rem', margin: 0 }}>
                    LEVEL COMPLETE!
                  </p>
                  <p style={{ color: COLORS.cyan, margin: '10px 0' }}>
                    Score: {levelComplete.score}
                  </p>
                  <button
                    onClick={nextLevel}
                    style={{
                      background: COLORS.green,
                      color: COLORS.black,
                      border: 'none',
                      padding: '10px 20px',
                      cursor: 'pointer',
                      fontFamily: '"Courier New", monospace',
                    }}
                  >
                    NEXT LEVEL →
                  </button>
                </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '10px',
              }}>
                <button
                  onClick={handleGameOver}
                  style={{
                    background: COLORS.red,
                    color: COLORS.white,
                    border: `2px solid ${COLORS.yellow}`,
                    padding: '8px 20px',
                    cursor: 'pointer',
                    fontFamily: '"Courier New", monospace',
                  }}
                >
                  ❌ GIVE UP
                </button>
              </div>
            </div>
          )}

          {gameState === 'gameover' && (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{
                color: COLORS.red,
                fontSize: '2rem',
                marginBottom: '20px',
                animation: 'blink 0.5s infinite',
              }}>
                💀 GAME OVER 💀
              </h2>
              <p style={{ color: COLORS.yellow, fontSize: '1.5rem' }}>
                FINAL SCORE: {totalScore}
              </p>
              <p style={{ color: COLORS.cyan, margin: '20px 0' }}>
                {totalScore > 500000 ? '🏆 ELITE GAMER!' :
                 totalScore > 100000 ? '⭐ AMAZING!' :
                 totalScore > 10000 ? '👍 NOT BAD!' :
                 '💩 TRY HARDER!'}
              </p>
              <button
                onClick={() => {
                  setGameState('menu');
                  fetchScores();
                }}
                style={{
                  background: COLORS.magenta,
                  color: COLORS.black,
                  border: `3px solid ${COLORS.cyan}`,
                  padding: '15px 40px',
                  fontSize: '1.2rem',
                  fontFamily: '"Courier New", monospace',
                  cursor: 'pointer',
                }}
              >
                🔄 PLAY AGAIN
              </button>
            </div>
          )}
        </div>

        {/* Right panel - Instructions */}
        <div style={{
          background: COLORS.black,
          border: `4px solid ${COLORS.yellow}`,
          padding: '15px',
          minWidth: '200px',
          boxShadow: `0 0 20px ${COLORS.green}`,
        }}>
          <h3 style={{
            color: COLORS.magenta,
            textAlign: 'center',
            margin: '0 0 15px 0',
          }}>
            📖 NIGHTMARE GUIDE
          </h3>
          <ul style={{
            color: COLORS.cyan,
            paddingLeft: '20px',
            fontSize: '0.85rem',
          }}>
            <li style={{ marginBottom: '10px' }}>🎮 3 games in sequence</li>
            <li style={{ marginBottom: '10px' }}>📈 Score accumulates</li>
            <li style={{ marginBottom: '10px' }}>👻 Random sabotage events</li>
            <li style={{ marginBottom: '10px' }}>🔄 Controls may flip</li>
            <li style={{ marginBottom: '10px' }}>💰 Coins may subtract points</li>
            <li style={{ marginBottom: '10px' }}>👻 Ghosts go on strike</li>
            <li style={{ marginBottom: '10px' }}>🚀 Space shooter has weird enemies</li>
            <li style={{ marginBottom: '10px' }}>📢 Random popup ads appear</li>
          </ul>
        </div>
      </div>

      {/* Popup Ad */}
      {showAd && (
        <div style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: COLORS.red,
          border: `5px dashed ${COLORS.yellow}`,
          padding: '20px',
          zIndex: 9999,
          minWidth: '300px',
          textAlign: 'center',
          boxShadow: `0 0 50px ${COLORS.red}`,
          animation: 'adPulse 0.5s infinite',
        }}>
          <p style={{
            color: COLORS.white,
            fontSize: '1.2rem',
            fontWeight: 'bold',
            margin: '0 0 15px 0',
          }}>
            {adText}
          </p>
          <button
            onClick={handleCloseAd}
            style={{
              background: COLORS.yellow,
              color: COLORS.red,
              border: 'none',
              padding: '10px 30px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: adCloseAttempts > 0 ? 'not-allowed' : 'pointer',
              position: adCloseAttempts > 0 ? 'relative' : 'static',
              left: adCloseAttempts > 0 ? `${adOffset}px` : '0',
            }}
          >
            {adCloseAttempts > 0 ? 'NOPE!' : '✕ CLOSE'}
          </button>
          <p style={{
            color: COLORS.white,
            fontSize: '0.7rem',
            marginTop: '10px',
          }}>
            Ad closes in {3 - adCloseAttempts} tries (probably)
          </p>
          <style>{`
            @keyframes adPulse {
              0%, 100% { transform: translateX(-50%) scale(1); }
              50% { transform: translateX(-50%) scale(1.02); }
            }
          `}</style>
        </div>
      )}

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        marginTop: '20px',
        color: COLORS.black,
        fontSize: '0.8rem',
      }}>
        <p>🚫 No warranty provided. May cause seizures, frustration, and existential dread.</p>
        <p>Built with 💀 and ☕ by a sleep-deprived developer</p>
      </footer>
    </div>
  );
}
