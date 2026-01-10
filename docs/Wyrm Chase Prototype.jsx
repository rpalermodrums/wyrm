import React, { useEffect, useRef, useState, useCallback } from 'react';

// Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 450;
const GRAVITY = 0.6;
const JUMP_FORCE = -14;
const PLAYER_SPEED = 5;
const WYRM_BASE_SPEED = 1.8;
const COYOTE_TIME = 8;
const JUMP_BUFFER = 6;
const PIT_DEATH_Y = CANVAS_HEIGHT + 50;

// Weapon types with distinct properties
const WEAPONS = {
  rapier: { 
    name: 'Rapier', 
    range: 55, 
    speed: 6,
    cooldown: 20,
    damage: 1, 
    color: '#555',
    width: 2,
    knockback: 3,
    priority: 1,
    losesTo: 'broadsword'
  },
  broadsword: { 
    name: 'Broadsword', 
    range: 45, 
    speed: 3,
    cooldown: 35,
    damage: 2, 
    color: '#333',
    width: 6,
    knockback: 8,
    priority: 2,
    losesTo: 'bow'
  },
  bow: { 
    name: 'Bow', 
    range: 250, 
    speed: 5,
    cooldown: 40,
    damage: 1, 
    color: '#664422',
    width: 2,
    knockback: 2,
    isRanged: true,
    projectileSpeed: 12,
    priority: 3,
    losesTo: 'rapier'
  }
};

const WEAPON_ORDER = ['rapier', 'broadsword', 'bow'];

// Color palette
const COLORS = {
  bg: '#F5F5F0',
  bgAlt: '#EAEAE5',
  line: '#1A1A1A',
  lineLight: '#444',
  platform: '#2A2A2A',
  platformTop: '#3A3A3A',
  hazard: '#FF6B35',
  hazardGlow: 'rgba(255, 107, 53, 0.4)',
  wyrm: '#8B0000',
  wyrmBody: '#1A1A1A',
  wyrmHighlight: '#333',
  player: '#E63946',
  enemy: '#457B9D',
  enemyBrute: '#6A4C93',
  safe: '#4A7C59',
  projectile: '#CC3333',
  clash: '#FFD700'
};

// Level data
const LEVELS = [
  {
    name: 'The Caverns',
    screens: [
      {
        platforms: [
          { x: 0, y: 380, w: 800, h: 70 },
          { x: 280, y: 280, w: 140, h: 20 },
          { x: 520, y: 200, w: 120, h: 20 }
        ],
        enemies: [
          { x: 450, y: 340, type: 'guard', weapon: 'rapier' }
        ],
        hazards: [],
        pits: []
      },
      {
        platforms: [
          { x: 0, y: 380, w: 280, h: 70 },
          { x: 380, y: 380, w: 420, h: 70 },
          { x: 180, y: 280, w: 100, h: 20 },
          { x: 400, y: 200, w: 100, h: 20 },
          { x: 600, y: 280, w: 100, h: 20 }
        ],
        enemies: [
          { x: 480, y: 340, type: 'guard', weapon: 'rapier' },
          { x: 650, y: 340, type: 'brute', weapon: 'broadsword' }
        ],
        hazards: [],
        pits: [{ x: 280, y: 380, w: 100 }]
      },
      {
        platforms: [
          { x: 0, y: 380, w: 180, h: 70 },
          { x: 260, y: 320, w: 90, h: 20 },
          { x: 420, y: 260, w: 90, h: 20 },
          { x: 580, y: 200, w: 90, h: 20 },
          { x: 700, y: 280, w: 100, h: 20 },
          { x: 700, y: 380, w: 100, h: 70 }
        ],
        enemies: [
          { x: 300, y: 280, type: 'guard', weapon: 'rapier' },
          { x: 460, y: 220, type: 'archer', weapon: 'bow' },
          { x: 730, y: 340, type: 'brute', weapon: 'broadsword' }
        ],
        hazards: [{ x: 180, y: 420, w: 520, h: 30, type: 'lava' }],
        pits: []
      }
    ]
  }
];

// Helper: AABB collision
const aabbCollision = (a, b) => {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
};

// Helper: Distance between entities
const distance = (a, b) => Math.abs(a.x - b.x);

// Helper: Resolve combat priority
const resolveCombat = (attackerWeapon, defenderWeapon) => {
  if (attackerWeapon === defenderWeapon) return 'clash';
  if (WEAPONS[attackerWeapon].losesTo === defenderWeapon) return 'lose';
  return 'win';
};

// Game component
export default function WyrmChase() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('title');
  const [lives, setLives] = useState(3);
  const [currentScreen, setCurrentScreen] = useState(0);
  const [currentWeapon, setCurrentWeapon] = useState('rapier');
  const [score, setScore] = useState(0);
  const [screenShake, setScreenShake] = useState(0);
  const [clashEffect, setClashEffect] = useState(null);

  // Game state refs
  const playerRef = useRef({
    x: 100, y: 300, vx: 0, vy: 0,
    width: 24, height: 50,
    grounded: false, facing: 1,
    attacking: false, attackTimer: 0, attackCooldown: 0,
    iframes: 0, weapon: 'rapier',
    coyoteTime: 0, jumpBuffer: 0,
    hitStun: 0
  });

  const wyrmRef = useRef({
    x: -120, segments: [],
    speed: WYRM_BASE_SPEED,
    targetY: 350
  });

  const enemiesRef = useRef([]);
  const projectilesRef = useRef([]);
  const particlesRef = useRef([]);
  const keysRef = useRef({});
  const screenDataRef = useRef(null);
  const frameRef = useRef(0);

  // Spawn particle effect
  const spawnParticles = useCallback((x, y, color, count = 5) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        life: 30,
        color,
        size: 3 + Math.random() * 3
      });
    }
  }, []);

  // Initialize screen
  const initScreen = useCallback((screenIndex) => {
    const level = LEVELS[0];
    if (screenIndex >= level.screens.length) {
      setGameState('victory');
      return;
    }

    const screen = level.screens[screenIndex];
    screenDataRef.current = screen;

    playerRef.current.x = 80;
    playerRef.current.y = 300;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    playerRef.current.grounded = false;
    playerRef.current.coyoteTime = 0;
    playerRef.current.jumpBuffer = 0;

    enemiesRef.current = screen.enemies.map((e, idx) => ({
      ...e,
      id: `enemy-${screenIndex}-${idx}`,
      vx: 0, vy: 0,
      width: 24, height: 50,
      hp: e.type === 'brute' ? 2 : 1,
      maxHp: e.type === 'brute' ? 2 : 1,
      attacking: false, 
      attackTimer: 0,
      attackCooldown: 0,
      grounded: false,
      facing: -1,
      state: 'idle',
      stateTimer: 0,
      hitStun: 0,
      patrolDir: 1,
      homeX: e.x,
      shootCooldown: e.weapon === 'bow' ? 60 : 0
    }));

    projectilesRef.current = [];
    particlesRef.current = [];
    setCurrentScreen(screenIndex);
  }, []);

  // Cycle weapon
  const cycleWeapon = useCallback(() => {
    const currentIdx = WEAPON_ORDER.indexOf(playerRef.current.weapon);
    const nextWeapon = WEAPON_ORDER[(currentIdx + 1) % WEAPON_ORDER.length];
    playerRef.current.weapon = nextWeapon;
    playerRef.current.attackCooldown = 0;
    setCurrentWeapon(nextWeapon);
    return nextWeapon;
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    setLives(3);
    setScore(0);
    playerRef.current.weapon = 'rapier';
    setCurrentWeapon('rapier');
    wyrmRef.current.x = -120;
    wyrmRef.current.segments = Array(10).fill(0).map((_, i) => ({ 
      x: -120 - i * 25, 
      y: 350 + Math.sin(i * 0.5) * 10 
    }));
    initScreen(0);
    setGameState('playing');
  }, [initScreen]);

  // Player death
  const playerDeath = useCallback((cause = 'hit') => {
    spawnParticles(playerRef.current.x, playerRef.current.y, COLORS.player, 10);
    setScreenShake(10);
    
    const newLives = lives - 1;
    setLives(newLives);

    if (newLives <= 0) {
      setGameState('gameover');
    } else {
      cycleWeapon();
      
      playerRef.current.x = 80;
      playerRef.current.y = 300;
      playerRef.current.vx = 0;
      playerRef.current.vy = 0;
      playerRef.current.iframes = 120;
      playerRef.current.hitStun = 0;
      playerRef.current.attacking = false;
      playerRef.current.attackTimer = 0;
      
      wyrmRef.current.x = Math.min(wyrmRef.current.x, -50);
    }
  }, [lives, cycleWeapon, spawnParticles]);

  // Enemy death
  const enemyDeath = useCallback((enemy, index) => {
    spawnParticles(enemy.x, enemy.y, enemy.type === 'brute' ? COLORS.enemyBrute : COLORS.enemy, 8);
    enemiesRef.current.splice(index, 1);
    setScore(s => s + (enemy.type === 'brute' ? 200 : 100));
    cycleWeapon();
  }, [cycleWeapon, spawnParticles]);

  // Shoot projectile
  const shootProjectile = useCallback((x, y, dir, owner, weapon) => {
    projectilesRef.current.push({
      x, y,
      vx: dir * WEAPONS[weapon].projectileSpeed,
      vy: 0,
      width: 20, height: 4,
      owner,
      weapon,
      life: 100
    });
  }, []);

  // Draw stick figure with weapon
  const drawStickFigure = useCallback((ctx, x, y, facing, color, attacking, weapon, hitStun = 0) => {
    const weaponData = WEAPONS[weapon];
    const wobble = hitStun > 0 ? Math.sin(hitStun * 2) * 3 : 0;
    
    ctx.save();
    ctx.translate(x + wobble, y);
    
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.ellipse(0, 25, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.arc(0, -35, 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(0, 5);
    ctx.stroke();

    const legOffset = Math.sin(frameRef.current * 0.3) * 3;
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(-8 + (attacking ? 0 : legOffset), 25);
    ctx.moveTo(0, 5);
    ctx.lineTo(8 + (attacking ? 0 : -legOffset), 25);
    ctx.stroke();

    const armY = -15;
    
    if (attacking) {
      if (weapon === 'bow') {
        ctx.beginPath();
        ctx.moveTo(0, armY);
        ctx.lineTo(-facing * 10, armY - 5);
        ctx.moveTo(0, armY);
        ctx.lineTo(facing * 15, armY);
        ctx.stroke();
        
        ctx.strokeStyle = weaponData.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(facing * 15, armY, 15, -Math.PI * 0.4 * facing, Math.PI * 0.4 * facing, facing < 0);
        ctx.stroke();
        
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(facing * 15, armY - 12);
        ctx.lineTo(facing * 5, armY);
        ctx.lineTo(facing * 15, armY + 12);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, armY);
        ctx.lineTo(facing * 20, armY - 10);
        ctx.stroke();
        
        ctx.strokeStyle = weaponData.color;
        ctx.lineWidth = weaponData.width;
        ctx.beginPath();
        ctx.moveTo(facing * 20, armY - 10);
        ctx.lineTo(facing * (20 + weaponData.range * 0.6), armY - 10);
        ctx.stroke();
        
        if (weapon === 'broadsword') {
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(facing * 18, armY - 15);
          ctx.lineTo(facing * 18, armY - 5);
          ctx.stroke();
        }
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(0, armY);
      ctx.lineTo(-10, armY + 12);
      ctx.moveTo(0, armY);
      ctx.lineTo(10, armY + 12);
      ctx.stroke();

      ctx.strokeStyle = weaponData.color;
      ctx.lineWidth = weaponData.width;
      
      if (weapon === 'bow') {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(facing * 12, armY + 8, 12, -Math.PI * 0.3, Math.PI * 0.3);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(facing * 10, armY + 12);
        ctx.lineTo(facing * 10, armY + 30);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -35, 12, Math.PI * 0.7, Math.PI * 0.3, true);
    ctx.stroke();
    
    ctx.restore();
  }, []);

  // Draw wyrm
  const drawWyrm = useCallback((ctx, wyrm) => {
    wyrm.segments.forEach((seg, i) => {
      const size = 28 - i * 1.5;
      const alpha = 1 - (i / wyrm.segments.length) * 0.3;
      
      ctx.fillStyle = COLORS.wyrmBody;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = COLORS.wyrmHighlight;
      ctx.beginPath();
      ctx.arc(seg.x - size * 0.3, seg.y - size * 0.3, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    const headX = wyrm.x;
    const headY = wyrm.targetY;

    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(headX, headY + 35, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.wyrmBody;
    ctx.beginPath();
    ctx.arc(headX, headY, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = COLORS.wyrmHighlight;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(headX - 10 + i * 8, headY + 5, 8, 0, Math.PI);
      ctx.stroke();
    }

    ctx.fillStyle = COLORS.wyrm;
    ctx.beginPath();
    ctx.ellipse(headX + 18, headY - 12, 10, 8, 0.2, 0, Math.PI * 2);
    ctx.ellipse(headX + 18, headY + 12, 10, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();

    const glowSize = 4 + Math.sin(frameRef.current * 0.1) * 1;
    ctx.fillStyle = '#FF2222';
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(headX + 22, headY - 12, glowSize, 0, Math.PI * 2);
    ctx.arc(headX + 22, headY + 12, glowSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = COLORS.wyrm;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(headX + 35, headY - 18);
    ctx.lineTo(headX + 50, headY);
    ctx.lineTo(headX + 35, headY + 18);
    ctx.stroke();
    
    ctx.fillStyle = '#DDD';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(headX + 38, headY + i * 10);
      ctx.lineTo(headX + 45, headY + i * 10 + 3);
      ctx.lineTo(headX + 38, headY + i * 10 + 6);
      ctx.fill();
    }
  }, []);

  // Main game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    const gameLoop = () => {
      frameRef.current++;
      const player = playerRef.current;
      const wyrm = wyrmRef.current;
      const enemies = enemiesRef.current;
      const projectiles = projectilesRef.current;
      const particles = particlesRef.current;
      const keys = keysRef.current;
      const screen = screenDataRef.current;

      if (!screen) {
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      // === INPUT HANDLING ===
      const moveLeft = keys['ArrowLeft'] || keys['KeyA'];
      const moveRight = keys['ArrowRight'] || keys['KeyD'];
      const jumpPressed = keys['ArrowUp'] || keys['KeyW'] || keys['Space'];
      const attackPressed = keys['KeyZ'] || keys['KeyJ'];

      if (player.hitStun > 0) {
        player.hitStun--;
        player.vx *= 0.8;
      } else {
        if (moveLeft) {
          player.vx = -PLAYER_SPEED;
          player.facing = -1;
        } else if (moveRight) {
          player.vx = PLAYER_SPEED;
          player.facing = 1;
        } else {
          player.vx *= 0.7;
          if (Math.abs(player.vx) < 0.5) player.vx = 0;
        }
      }

      if (jumpPressed) {
        player.jumpBuffer = JUMP_BUFFER;
      } else if (player.jumpBuffer > 0) {
        player.jumpBuffer--;
      }

      if (player.jumpBuffer > 0 && (player.grounded || player.coyoteTime > 0)) {
        player.vy = JUMP_FORCE;
        player.grounded = false;
        player.coyoteTime = 0;
        player.jumpBuffer = 0;
      }

      if (attackPressed && !player.attacking && player.attackCooldown <= 0 && player.hitStun <= 0) {
        player.attacking = true;
        player.attackTimer = WEAPONS[player.weapon].speed;
        player.attackCooldown = WEAPONS[player.weapon].cooldown;
        
        if (WEAPONS[player.weapon].isRanged) {
          shootProjectile(
            player.x + player.facing * 20, 
            player.y - 15,
            player.facing,
            'player',
            player.weapon
          );
        }
      }

      // === PHYSICS ===
      player.vy += GRAVITY;
      player.vy = Math.min(player.vy, 15);
      player.x += player.vx;
      player.y += player.vy;

      // === PLATFORM COLLISION ===
      const wasGrounded = player.grounded;
      player.grounded = false;

      screen.platforms.forEach(plat => {
        const playerBox = {
          x: player.x - player.width / 2,
          y: player.y - player.height / 2,
          w: player.width,
          h: player.height
        };

        if (player.vy >= 0 &&
            playerBox.x + playerBox.w > plat.x &&
            playerBox.x < plat.x + plat.w &&
            playerBox.y + playerBox.h > plat.y &&
            playerBox.y + playerBox.h < plat.y + 20 + player.vy) {
          player.y = plat.y - player.height / 2;
          player.vy = 0;
          player.grounded = true;
        }

        if (playerBox.y + playerBox.h > plat.y + 5 &&
            playerBox.y < plat.y + plat.h) {
          if (player.vx > 0 &&
              playerBox.x + playerBox.w > plat.x &&
              playerBox.x < plat.x) {
            player.x = plat.x - player.width / 2;
            player.vx = 0;
          }
          if (player.vx < 0 &&
              playerBox.x < plat.x + plat.w &&
              playerBox.x + playerBox.w > plat.x + plat.w) {
            player.x = plat.x + plat.w + player.width / 2;
            player.vx = 0;
          }
        }
      });

      if (wasGrounded && !player.grounded && player.vy >= 0) {
        player.coyoteTime = COYOTE_TIME;
      } else if (player.coyoteTime > 0) {
        player.coyoteTime--;
      }

      player.x = Math.max(player.width / 2, player.x);
      
      if (player.y > PIT_DEATH_Y) {
        playerDeath('pit');
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      if (player.attackTimer > 0) {
        player.attackTimer--;
        if (player.attackTimer <= 0) {
          player.attacking = false;
        }
      }
      if (player.attackCooldown > 0) {
        player.attackCooldown--;
      }
      if (player.iframes > 0) {
        player.iframes--;
      }

      // === WYRM UPDATE ===
      let wyrmSpeed = WYRM_BASE_SPEED;
      if (player.vx < 0) wyrmSpeed += 0.8;
      if (player.x < wyrm.x + 100) wyrmSpeed += 1;
      if (player.x > wyrm.x + 400) wyrmSpeed -= 0.5;
      wyrm.speed = Math.max(0.5, Math.min(4, wyrmSpeed));
      
      wyrm.x += wyrm.speed;
      
      wyrm.targetY += (player.y - 10 - wyrm.targetY) * 0.02;
      wyrm.targetY = Math.max(300, Math.min(380, wyrm.targetY));

      const newSeg = { 
        x: wyrm.x - 45, 
        y: wyrm.targetY + Math.sin(frameRef.current * 0.08) * 8 
      };
      wyrm.segments.unshift(newSeg);
      
      for (let i = 1; i < wyrm.segments.length; i++) {
        const prev = wyrm.segments[i - 1];
        const curr = wyrm.segments[i];
        curr.x += (prev.x - 25 - curr.x) * 0.3;
        curr.y += (prev.y + Math.sin(i * 0.5 + frameRef.current * 0.05) * 5 - curr.y) * 0.2;
      }
      
      if (wyrm.segments.length > 10) wyrm.segments.pop();

      if (wyrm.x > player.x - 35 && player.iframes <= 0) {
        playerDeath('wyrm');
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      // === HAZARD COLLISION ===
      screen.hazards.forEach(hazard => {
        const playerBox = {
          x: player.x - player.width / 2,
          y: player.y,
          w: player.width,
          h: player.height / 2
        };
        const hazardBox = { x: hazard.x, y: hazard.y, w: hazard.w, h: hazard.h };
        
        if (aabbCollision(playerBox, hazardBox) && player.iframes <= 0) {
          playerDeath('hazard');
        }
      });

      // === ENEMY UPDATE ===
      enemies.forEach((enemy, idx) => {
        if (enemy.hitStun > 0) {
          enemy.hitStun--;
          enemy.vx *= 0.8;
        } else {
          const distToPlayer = player.x - enemy.x;
          const absDistToPlayer = Math.abs(distToPlayer);

          if (enemy.type === 'archer') {
            enemy.vx = 0;
            enemy.facing = distToPlayer > 0 ? 1 : -1;
            
            if (absDistToPlayer < 300 && enemy.shootCooldown <= 0) {
              enemy.attacking = true;
              enemy.attackTimer = WEAPONS.bow.speed;
              enemy.shootCooldown = 90;
              
              shootProjectile(
                enemy.x + enemy.facing * 20,
                enemy.y - 15,
                enemy.facing,
                'enemy',
                'bow'
              );
            }
          } else {
            if (absDistToPlayer < 250) {
              enemy.state = 'chase';
              enemy.vx = Math.sign(distToPlayer) * (enemy.type === 'brute' ? 1.5 : 2.5);
              enemy.facing = distToPlayer > 0 ? 1 : -1;
              
              if (absDistToPlayer < 45 && !enemy.attacking && enemy.attackCooldown <= 0) {
                enemy.attacking = true;
                enemy.attackTimer = WEAPONS[enemy.weapon].speed;
                enemy.attackCooldown = WEAPONS[enemy.weapon].cooldown + 10;
              }
            } else {
              enemy.state = 'idle';
              enemy.vx = 0;
            }
          }
        }

        enemy.vy += GRAVITY;
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        enemy.grounded = false;
        screen.platforms.forEach(plat => {
          if (enemy.vy >= 0 &&
              enemy.x > plat.x && enemy.x < plat.x + plat.w &&
              enemy.y + enemy.height / 2 > plat.y &&
              enemy.y + enemy.height / 2 < plat.y + 20 + enemy.vy) {
            enemy.y = plat.y - enemy.height / 2;
            enemy.vy = 0;
            enemy.grounded = true;
          }
        });

        enemy.x = Math.max(50, Math.min(CANVAS_WIDTH - 50, enemy.x));

        if (enemy.attackTimer > 0) {
          enemy.attackTimer--;
          if (enemy.attackTimer <= 0) enemy.attacking = false;
        }
        if (enemy.attackCooldown > 0) enemy.attackCooldown--;
        if (enemy.shootCooldown > 0) enemy.shootCooldown--;

        // === MELEE COMBAT RESOLUTION ===
        const combatDist = distance(player, enemy);
        const playerWeaponRange = WEAPONS[player.weapon].range;
        const enemyWeaponRange = WEAPONS[enemy.weapon].range;

        if (player.attacking && enemy.attacking && 
            combatDist < Math.max(playerWeaponRange, enemyWeaponRange) &&
            player.iframes <= 0 && !WEAPONS[player.weapon].isRanged && !WEAPONS[enemy.weapon].isRanged) {
          
          const result = resolveCombat(player.weapon, enemy.weapon);
          
          if (result === 'clash') {
            player.hitStun = 15;
            enemy.hitStun = 15;
            player.attacking = false;
            enemy.attacking = false;
            setClashEffect({ x: (player.x + enemy.x) / 2, y: (player.y + enemy.y) / 2, timer: 20 });
            spawnParticles((player.x + enemy.x) / 2, (player.y + enemy.y) / 2 - 20, COLORS.clash, 8);
          } else if (result === 'win') {
            enemy.hp--;
            enemy.hitStun = 20;
            enemy.vx = player.facing * WEAPONS[player.weapon].knockback;
            spawnParticles(enemy.x, enemy.y - 20, COLORS.enemy, 5);
            if (enemy.hp <= 0) {
              enemyDeath(enemy, idx);
            }
          } else {
            player.hitStun = 25;
            player.vx = -player.facing * WEAPONS[enemy.weapon].knockback;
            player.iframes = 60;
            spawnParticles(player.x, player.y - 20, COLORS.player, 5);
          }
        }
        else if (player.attacking && !WEAPONS[player.weapon].isRanged &&
                 combatDist < playerWeaponRange && player.facing === Math.sign(enemy.x - player.x)) {
          enemy.hp--;
          enemy.hitStun = 15;
          enemy.vx = player.facing * WEAPONS[player.weapon].knockback;
          spawnParticles(enemy.x, enemy.y - 20, COLORS.enemy, 5);
          if (enemy.hp <= 0) {
            enemyDeath(enemy, idx);
          }
        }
        else if (enemy.attacking && !WEAPONS[enemy.weapon].isRanged &&
                 combatDist < enemyWeaponRange && player.iframes <= 0) {
          player.hitStun = 20;
          player.vx = enemy.facing * WEAPONS[enemy.weapon].knockback;
          player.iframes = 90;
          spawnParticles(player.x, player.y - 20, COLORS.player, 5);
        }
      });

      // === PROJECTILE UPDATE ===
      projectiles.forEach((proj, pIdx) => {
        proj.x += proj.vx;
        proj.life--;

        if (proj.x < -50 || proj.x > CANVAS_WIDTH + 50 || proj.life <= 0) {
          projectiles.splice(pIdx, 1);
          return;
        }

        const projBox = { x: proj.x - proj.width / 2, y: proj.y - proj.height / 2, w: proj.width, h: proj.height };

        if (proj.owner === 'player') {
          enemies.forEach((enemy, eIdx) => {
            const enemyBox = { x: enemy.x - enemy.width / 2, y: enemy.y - enemy.height / 2, w: enemy.width, h: enemy.height };
            if (aabbCollision(projBox, enemyBox)) {
              enemy.hp -= WEAPONS[proj.weapon].damage;
              enemy.hitStun = 10;
              spawnParticles(proj.x, proj.y, COLORS.enemy, 3);
              projectiles.splice(pIdx, 1);
              if (enemy.hp <= 0) {
                enemyDeath(enemy, eIdx);
              }
            }
          });
        }
        
        if (proj.owner === 'enemy' && player.iframes <= 0) {
          const playerBox = { x: player.x - player.width / 2, y: player.y - player.height / 2, w: player.width, h: player.height };
          if (aabbCollision(projBox, playerBox)) {
            player.hitStun = 15;
            player.iframes = 90;
            spawnParticles(proj.x, proj.y, COLORS.player, 3);
            projectiles.splice(pIdx, 1);
          }
        }

        screen.platforms.forEach(plat => {
          if (aabbCollision(projBox, { x: plat.x, y: plat.y, w: plat.w, h: plat.h })) {
            spawnParticles(proj.x, proj.y, '#666', 2);
            projectiles.splice(pIdx, 1);
          }
        });
      });

      // === PARTICLE UPDATE ===
      particles.forEach((p, pIdx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life--;
        if (p.life <= 0) particles.splice(pIdx, 1);
      });

      if (clashEffect) {
        setClashEffect(prev => prev && prev.timer > 0 ? { ...prev, timer: prev.timer - 1 } : null);
      }

      if (player.x > CANVAS_WIDTH - 20) {
        initScreen(currentScreen + 1);
      }

      // === RENDERING ===
      ctx.save();
      
      if (screenShake > 0) {
        ctx.translate(
          (Math.random() - 0.5) * screenShake,
          (Math.random() - 0.5) * screenShake
        );
        setScreenShake(s => s - 1);
      }

      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.strokeStyle = COLORS.bgAlt;
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const y = 100 + i * 60 + Math.sin(frameRef.current * 0.01 + i) * 5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(200, y + 10, 600, y - 10, 800, y);
        ctx.stroke();
      }

      screen.platforms.forEach(plat => {
        ctx.fillStyle = COLORS.platform;
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        
        ctx.fillStyle = COLORS.platformTop;
        ctx.fillRect(plat.x, plat.y, plat.w, 4);

        ctx.strokeStyle = COLORS.line;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(plat.x, plat.y);
        ctx.lineTo(plat.x + plat.w, plat.y);
        ctx.stroke();
        
        ctx.strokeStyle = COLORS.lineLight;
        ctx.lineWidth = 1;
        for (let i = 0; i < plat.w; i += 30) {
          ctx.beginPath();
          ctx.moveTo(plat.x + i, plat.y + 8);
          ctx.lineTo(plat.x + i + 15, plat.y + plat.h - 5);
          ctx.stroke();
        }
      });

      screen.hazards.forEach(hazard => {
        const gradient = ctx.createLinearGradient(hazard.x, hazard.y - 30, hazard.x, hazard.y + hazard.h);
        gradient.addColorStop(0, 'rgba(255, 107, 53, 0)');
        gradient.addColorStop(0.3, COLORS.hazardGlow);
        gradient.addColorStop(1, COLORS.hazard);
        ctx.fillStyle = gradient;
        ctx.fillRect(hazard.x, hazard.y - 30, hazard.w, hazard.h + 30);
        
        ctx.fillStyle = COLORS.hazard;
        ctx.beginPath();
        ctx.moveTo(hazard.x, hazard.y);
        for (let i = 0; i <= hazard.w; i += 20) {
          const waveY = Math.sin((i + frameRef.current * 3) * 0.05) * 4;
          ctx.lineTo(hazard.x + i, hazard.y + waveY);
        }
        ctx.lineTo(hazard.x + hazard.w, hazard.y + hazard.h);
        ctx.lineTo(hazard.x, hazard.y + hazard.h);
        ctx.closePath();
        ctx.fill();
      });

      drawWyrm(ctx, wyrm);

      projectiles.forEach(proj => {
        ctx.fillStyle = proj.owner === 'player' ? COLORS.player : COLORS.projectile;
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(proj.vx > 0 ? 0 : Math.PI);
        
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-5, -3);
        ctx.lineTo(-5, 3);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillRect(-15, -1, 12, 2);
        ctx.restore();
      });

      enemies.forEach(enemy => {
        const color = enemy.type === 'brute' ? COLORS.enemyBrute : COLORS.enemy;
        drawStickFigure(ctx, enemy.x, enemy.y, enemy.facing, color, enemy.attacking, enemy.weapon, enemy.hitStun);
        
        if (enemy.type === 'brute' && enemy.hp < enemy.maxHp) {
          ctx.fillStyle = '#333';
          ctx.fillRect(enemy.x - 15, enemy.y - 55, 30, 4);
          ctx.fillStyle = COLORS.enemyBrute;
          ctx.fillRect(enemy.x - 15, enemy.y - 55, 30 * (enemy.hp / enemy.maxHp), 4);
        }
      });

      particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (p.life / 30), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      if (clashEffect && clashEffect.timer > 0) {
        ctx.strokeStyle = COLORS.clash;
        ctx.lineWidth = 3;
        const size = (20 - clashEffect.timer) * 3;
        ctx.globalAlpha = clashEffect.timer / 20;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          ctx.moveTo(clashEffect.x, clashEffect.y);
          ctx.lineTo(
            clashEffect.x + Math.cos(angle) * size,
            clashEffect.y + Math.sin(angle) * size
          );
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (player.iframes <= 0 || Math.floor(player.iframes / 4) % 2 === 0) {
        drawStickFigure(ctx, player.x, player.y, player.facing, COLORS.player, player.attacking, player.weapon, player.hitStun);
      }

      const exitPulse = 0.3 + Math.sin(frameRef.current * 0.08) * 0.15;
      ctx.fillStyle = COLORS.safe;
      ctx.globalAlpha = exitPulse;
      ctx.fillRect(CANVAS_WIDTH - 25, 0, 25, CANVAS_HEIGHT);
      ctx.globalAlpha = 1;

      ctx.fillStyle = COLORS.safe;
      ctx.font = 'bold 12px Arial';
      ctx.save();
      ctx.translate(CANVAS_WIDTH - 12, CANVAS_HEIGHT / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('EXIT →', -20, 4);
      ctx.restore();

      // === HUD ===
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, 35);

      ctx.fillStyle = COLORS.line;
      ctx.font = 'bold 14px Arial';
      ctx.fillText(`Level 1-${currentScreen + 1}`, 10, 22);
      
      ctx.font = '14px Arial';
      ctx.fillText(`Score: ${score}`, 120, 22);

      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < lives ? '#E63946' : '#CCC';
        ctx.font = '18px Arial';
        ctx.fillText('♥', CANVAS_WIDTH - 80 + i * 22, 24);
      }

      const wp = WEAPONS[player.weapon];
      ctx.fillStyle = COLORS.line;
      ctx.font = 'bold 12px Arial';
      const wpText = wp.name.toUpperCase();
      ctx.fillText(wpText, CANVAS_WIDTH / 2 - ctx.measureText(wpText).width / 2, 22);
      
      if (player.attackCooldown > 0) {
        const cooldownPct = player.attackCooldown / wp.cooldown;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(CANVAS_WIDTH / 2 - 30, 26, 60, 4);
        ctx.fillStyle = COLORS.player;
        ctx.fillRect(CANVAS_WIDTH / 2 - 30, 26, 60 * (1 - cooldownPct), 4);
      }

      ctx.fillStyle = '#888';
      ctx.font = '11px Arial';
      ctx.fillText('WASD: Move  |  Z: Attack  |  ESC: Pause', 10, CANVAS_HEIGHT - 8);
      
      ctx.fillStyle = '#AAA';
      ctx.font = '10px Arial';
      ctx.fillText('Rapier→Bow→Broadsword→Rapier', CANVAS_WIDTH - 180, CANVAS_HEIGHT - 8);

      ctx.restore();

      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => cancelAnimationFrame(animationId);
  }, [gameState, currentScreen, lives, score, screenShake, clashEffect, drawStickFigure, drawWyrm, playerDeath, enemyDeath, initScreen, shootProjectile, spawnParticles]);

  // Input handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysRef.current[e.code] = true;
      
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      
      if (gameState === 'title' && (e.code === 'Space' || e.code === 'Enter')) {
        resetGame();
      }
      if (gameState === 'gameover' && (e.code === 'Space' || e.code === 'Enter')) {
        resetGame();
      }
      if (gameState === 'victory' && (e.code === 'Space' || e.code === 'Enter')) {
        setGameState('title');
      }
      if (gameState === 'playing' && e.code === 'Escape') {
        setGameState('paused');
      }
      if (gameState === 'paused' && (e.code === 'Escape' || e.code === 'Space')) {
        setGameState('playing');
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, resetGame]);

  useEffect(() => {
    wyrmRef.current.segments = Array(10).fill(0).map((_, i) => ({ 
      x: -120 - i * 25, 
      y: 350 + Math.sin(i * 0.5) * 10 
    }));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-900 p-4">
      <div className="mb-4 text-center">
        <h1 className="text-3xl font-bold text-stone-100 tracking-[0.3em]">WYRM CHASE</h1>
        <p className="text-stone-500 text-sm mt-1">Escape. Fight. Survive.</p>
      </div>

      <div className="relative border-4 border-stone-700 rounded overflow-hidden shadow-2xl bg-black">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block"
        />

        {gameState === 'title' && (
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/95 to-stone-800/95 flex flex-col items-center justify-center">
            <h2 className="text-5xl font-bold text-stone-100 mb-1 tracking-[0.4em]">WYRM</h2>
            <h2 className="text-3xl font-bold text-red-500 mb-6 tracking-[0.3em]">CHASE</h2>
            
            <div className="text-stone-400 text-center mb-6 text-sm space-y-2">
              <p><span className="text-stone-200 font-mono">WASD</span> Move & Jump</p>
              <p><span className="text-stone-200 font-mono">Z</span> Attack</p>
            </div>
            
            <div className="text-stone-500 text-xs mb-6 text-center max-w-xs">
              <p className="mb-2">Weapons cycle on kill or death:</p>
              <p className="text-stone-400">
                <span className="text-red-400">Rapier</span> beats
                <span className="text-yellow-400"> Bow</span> beats
                <span className="text-purple-400"> Broadsword</span> beats
                <span className="text-red-400"> Rapier</span>
              </p>
            </div>
            
            <button
              onClick={resetGame}
              className="px-10 py-3 bg-red-700 hover:bg-red-600 text-white font-bold tracking-wider rounded transition-all hover:scale-105"
            >
              START GAME
            </button>
            <p className="text-stone-600 text-xs mt-3">or press SPACE</p>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-stone-900/85 flex flex-col items-center justify-center backdrop-blur-sm">
            <h2 className="text-4xl font-bold text-stone-100 mb-8 tracking-widest">PAUSED</h2>
            <button
              onClick={() => setGameState('playing')}
              className="px-8 py-3 bg-stone-700 hover:bg-stone-600 text-white font-bold rounded transition-colors"
            >
              RESUME
            </button>
            <p className="text-stone-500 text-sm mt-3">Press ESC or SPACE</p>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-gradient-to-b from-red-950/90 to-stone-900/95 flex flex-col items-center justify-center">
            <h2 className="text-5xl font-bold text-red-500 mb-2 tracking-wider">DEVOURED</h2>
            <p className="text-stone-400 mb-6">The wyrm consumes all</p>
            
            <div className="bg-stone-800/50 rounded px-8 py-4 mb-6">
              <p className="text-stone-300 text-xl">Score: <span className="text-white font-bold">{score}</span></p>
              <p className="text-stone-500 text-sm">Reached: Level 1-{currentScreen + 1}</p>
            </div>
            
            <button
              onClick={resetGame}
              className="px-8 py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded transition-colors"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {gameState === 'victory' && (
          <div className="absolute inset-0 bg-gradient-to-b from-green-950/90 to-stone-900/95 flex flex-col items-center justify-center">
            <h2 className="text-5xl font-bold text-green-400 mb-2 tracking-wider">ESCAPED!</h2>
            <p className="text-stone-400 mb-6">You outran the wyrm!</p>
            
            <div className="bg-stone-800/50 rounded px-8 py-4 mb-6 text-center">
              <p className="text-stone-300 text-xl">Score: <span className="text-white font-bold">{score}</span></p>
              <p className="text-stone-400">Lives Remaining: <span className="text-green-400">{lives}</span></p>
            </div>
            
            <button
              onClick={() => setGameState('title')}
              className="px-8 py-3 bg-green-700 hover:bg-green-600 text-white font-bold rounded transition-colors"
            >
              MAIN MENU
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 text-stone-600 text-xs text-center max-w-lg">
        <p>Prototype v2: Rock-paper-scissors combat • Bow projectiles • Coyote time • Pit deaths • Screen shake • Hit stun</p>
      </div>
    </div>
  );
}
