(function () {
  const N = 20; // grid size (N x N)
  const cv = document.getElementById('c');
  const ctx = cv.getContext('2d');
  const S = cv.width / N; // cell size in pixels
  const ov = document.getElementById('ov');
  const msg = document.getElementById('msg');
  const sub = document.getElementById('sub');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');

  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  let snake, dir, next, food, score, speed, timer = null, state = 'idle';
  let best = 0;
  try { best = parseInt(localStorage.getItem('snake-best')) || 0; } catch (e) {}
  bestEl.textContent = best;

  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  function reset() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dir = next = DIRS.right;
    score = 0;
    speed = 130;
    scoreEl.textContent = 0;
    placeFood();
    draw();
  }

  function placeFood() {
    do {
      food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
    } while (snake.some((s) => s.x === food.x && s.y === food.y));
  }

  function start() {
    if (state === 'running') return;
    if (state !== 'paused') reset();
    state = 'running';
    ov.classList.add('hide');
    clearInterval(timer);
    timer = setInterval(tick, speed);
  }

  function pause() {
    if (state !== 'running') return;
    state = 'paused';
    clearInterval(timer);
    msg.textContent = 'Paused';
    sub.textContent = 'Press Space or Start to resume';
    ov.classList.remove('hide');
  }

  function gameOver() {
    state = 'over';
    clearInterval(timer);
    if (score > best) {
      best = score;
      bestEl.textContent = best;
      try { localStorage.setItem('snake-best', best); } catch (e) {}
    }
    msg.textContent = 'Game over';
    sub.textContent = 'Score: ' + score;
    document.getElementById('start').textContent = 'Play again';
    ov.classList.remove('hide');
  }

  function tick() {
    dir = next;
    const head = { x: snake[0].x + dir[0], y: snake[0].y + dir[1] };
    const hitWall = head.x < 0 || head.y < 0 || head.x >= N || head.y >= N;
    const hitSelf = snake.some((s) => s.x === head.x && s.y === head.y);
    if (hitWall || hitSelf) return gameOver();

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score++;
      scoreEl.textContent = score;
      placeFood();
      // speed up every 4 points
      if (score % 4 === 0 && speed > 60) {
        speed -= 10;
        clearInterval(timer);
        timer = setInterval(tick, speed);
      }
    } else {
      snake.pop();
    }
    draw();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
    ctx.fill();
  }

  function draw() {
    ctx.fillStyle = css('--card');
    ctx.fillRect(0, 0, cv.width, cv.height);

    ctx.fillStyle = css('--grid');
    for (let x = 0; x < N; x++)
      for (let y = 0; y < N; y++)
        if ((x + y) % 2 === 0) ctx.fillRect(x * S, y * S, S, S);

    ctx.fillStyle = css('--food');
    ctx.beginPath();
    ctx.arc(food.x * S + S / 2, food.y * S + S / 2, S * 0.38, 0, Math.PI * 2);
    ctx.fill();

    snake.forEach((s, i) => {
      ctx.fillStyle = css(i === 0 ? '--head' : '--snake');
      roundRect(s.x * S + 1, s.y * S + 1, S - 2, S - 2, 6);
    });
  }

  function turn(name) {
    const d = DIRS[name];
    if (d[0] === -dir[0] && d[1] === -dir[1]) return; // no 180° turns
    next = d;
    if (state === 'over') state = 'idle';
    if (state !== 'running') start();
  }

  const KEYS = {
    ArrowUp: 'up', w: 'up', W: 'up',
    ArrowDown: 'down', s: 'down', S: 'down',
    ArrowLeft: 'left', a: 'left', A: 'left',
    ArrowRight: 'right', d: 'right', D: 'right',
  };

  document.addEventListener('keydown', (e) => {
    if (KEYS[e.key]) { e.preventDefault(); turn(KEYS[e.key]); }
    else if (e.key === ' ') { e.preventDefault(); state === 'running' ? pause() : start(); }
  });

  document.querySelectorAll('.pad button').forEach((b) =>
    b.addEventListener('click', () => turn(b.dataset.d))
  );

  document.getElementById('start').addEventListener('click', () => {
    if (state === 'over') state = 'idle';
    start();
  });

  // Swipe controls
  let touchStart = null;
  cv.addEventListener('touchstart', (e) => { touchStart = e.touches[0]; }, { passive: true });
  cv.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.clientX;
    const dy = t.clientY - touchStart.clientY;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);

  reset();
})();