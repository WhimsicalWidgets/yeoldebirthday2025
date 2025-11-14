const SECRET = "staub";
const MAX_ATTEMPTS = 8;

const lenEl = document.getElementById('len');
const grid = document.getElementById('grid');
const form = document.getElementById('guessForm');
const input = document.getElementById('guessInput');
const status = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');
const hero = document.getElementById('hero');
const firstLetterEls = Array.from(document.querySelectorAll('.first'));

let attempts = [];

function normalize(s){ return s.replace(/\s+/g,' ').trim().toLowerCase(); }
const secret = normalize(SECRET);
lenEl.textContent = secret.length;

// ensure first-letter elements count corresponds to secret length (only use as many as secret length)
function updateFirstLetters(feedback){
  // feedback is array of length secret.length with 0/1/2
  firstLetterEls.forEach(el=>{
    const pos = Number(el.dataset.pos);
    if(isNaN(pos)) return;
    if(pos < feedback.length && feedback[pos] === 2){
      el.classList.add('green-letter');
    } else {
      el.classList.remove('green-letter');
    }
  });
}

function makeRow(guess, feedback){
  const row = document.createElement('div');
  row.className = 'row';
  for(let i=0;i<secret.length;i++){
    const ch = guess?.[i] ?? ' ';
    const cell = document.createElement('div');
    cell.className = 'cell';
    if(ch === ' ') cell.classList.add('space');
    cell.textContent = ch === ' ' ? ' ' : ch;
    if(feedback){
      if(feedback[i] === 2) cell.classList.add('green');
      else if(feedback[i] === 1) cell.classList.add('yellow');
    }
    row.appendChild(cell);
  }
  return row;
}

function computeFeedback(guess){
  // 2 = correct pos, 1 = present elsewhere, 0 = absent
  guess = guess.padEnd(secret.length,' ').slice(0,secret.length);
  const feedback = Array(secret.length).fill(0);
  const secretArr = secret.split('');
  const used = Array(secret.length).fill(false);

  // mark exact matches
  for(let i=0;i<secret.length;i++){
    if(guess[i] === secret[i]){
      feedback[i]=2; used[i]=true;
    }
  }
  // mark present elsewhere
  for(let i=0;i<secret.length;i++){
    if(feedback[i]===0 && guess[i] !== ' '){
      for(let j=0;j<secret.length;j++){
        if(!used[j] && secret[j]===guess[i]){
          feedback[i]=1; used[j]=true; break;
        }
      }
    }
  }
  return feedback;
}

function render(){
  grid.innerHTML='';
  attempts.forEach(a=>{
    grid.appendChild(makeRow(a.guess, a.fb));
  });
  // fill remaining empty rows
  for(let i=attempts.length;i<MAX_ATTEMPTS;i++){
    grid.appendChild(makeRow());
  }
}

function setStatus(msg){
  status.textContent = msg;
}

form.addEventListener('submit', e=>{
  e.preventDefault();
  let val = input.value || '';
  val = normalize(val);
  if(!val){
    setStatus('Please enter a guess.');
    return;
  }
  // pad or trim to secret length for comparison but allow guesses shorter/longer (will be normalized)
  const guess = val.slice(0, secret.length).padEnd(secret.length,' ');
  const fb = computeFeedback(guess);
  attempts.push({guess, fb});
  render();
  input.value='';

  // update first-letter highlights based on most recent feedback mapping positions
  // We'll compute an aggregate latest-known correct positions from all attempts
  const aggregate = Array(secret.length).fill(0);
  attempts.forEach(a=>{
    for(let i=0;i<secret.length;i++){
      if(a.fb[i] === 2) aggregate[i] = 2;
      else if(a.fb[i] === 1 && aggregate[i] !== 2) aggregate[i] = Math.max(aggregate[i],1);
    }
  });
  updateFirstLetters(aggregate);

  if(guess === secret){
    setStatus('Congratulations — you revealed the hidden phrase!');
    input.disabled = true;
    // start fullscreen fireworks immediately, no popup
    startFireworks(3000).then(()=>{
      hero.style.display = 'flex';
      // mark all first letters green (final reveal)
      firstLetterEls.forEach(el=> el.classList.add('green-letter'));
    });
  } else if(attempts.length >= MAX_ATTEMPTS){
    setStatus('Out of attempts. The phrase was: "'+SECRET+'"');
    input.disabled = true;
    // reveal hero even if failed so user can see text
    hero.style.display = 'flex';
  } else {
    setStatus(`Attempt ${attempts.length}/${MAX_ATTEMPTS}`);
  }
});

resetBtn.addEventListener('click', ()=>{
  attempts = [];
  input.disabled = false;
  input.value='';
  setStatus('');
  render();
  // hide hero and clear first-letter highlights
  hero.style.display = 'none';
  firstLetterEls.forEach(el=> el.classList.remove('green-letter'));
});

render();
setStatus(`You have ${MAX_ATTEMPTS} attempts to reveal the phrase.`);

// FIREWORKS: create a fullscreen canvas, animate particles for durationMs, then cleanup
function startFireworks(durationMs=3000){
  return new Promise(resolve=>{
    const canvas = document.createElement('canvas');
    canvas.id = 'fireworksCanvas';
    // ensure canvas is absolutely decoupled from any transformed/staked ancestor
    Object.assign(canvas.style, {
      position:'fixed',
      top:'0',
      left:'0',
      width:'100%',
      height:'100%',
      zIndex: '2147483647',
      pointerEvents:'none',
      contain: 'strict' // hint to isolate layout/painting
    });
    // Append directly to document.documentElement if body is inside any stacking context; documentElement is safest
    (document.documentElement || document.body).appendChild(canvas);
    const ctx = canvas.getContext('2d');
    function fit(){
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(innerWidth * dpr);
      canvas.height = Math.floor(innerHeight * dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    fit();
    window.addEventListener('resize', fit);
    let particles = [];
    const rand = (a,b)=> a + Math.random()*(b-a);

    function spawnFirework(x,y){
      const hue = Math.floor(rand(0,360));
      const count = Math.floor(rand(28,56)); // bigger bursts
      for(let i=0;i<count;i++){
        const angle = rand(0,Math.PI*2);
        const speed = rand(3,12); // faster, larger spread
        particles.push({
          x,y,
          vx: Math.cos(angle)*speed,
          vy: Math.sin(angle)*speed,
          life: rand(70,140),
          age:0,
          hue,
          size: rand(2,5)
        });
      }
    }

    // spawn initial bursts across screen more intensely
    const interval = setInterval(()=> {
      const cx = rand(0.15*innerWidth,0.85*innerWidth);
      const cy = rand(0.12*innerHeight,0.6*innerHeight);
      spawnFirework(cx,cy);
      // occasionally create a huge central burst
      if(Math.random() < 0.18){
        spawnFirework(innerWidth*0.5 + rand(-80,80), innerHeight*0.35 + rand(-60,60));
      }
    }, 220);

    let rafId;
    function frame(){
      rafId = requestAnimationFrame(frame);
      ctx.clearRect(0,0,canvas.width,canvas.height);
      // trails effect
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0,0,innerWidth,innerHeight);
      for(let i=particles.length-1;i>=0;i--){
        const p = particles[i];
        p.vy += 0.08; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.995;
        p.vy *= 0.995;
        p.age++;
        const t = p.age / p.life;
        const alpha = Math.max(0, 1 - t);
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue},95%,60%,${alpha})`;
        ctx.arc(p.x, p.y, Math.max(1, p.size*(1 - t)), 0, Math.PI*2);
        ctx.fill();
        // subtle glow
        if(alpha > 0.14){
          ctx.beginPath();
          ctx.fillStyle = `rgba(255,255,255,${alpha*0.06})`;
          ctx.arc(p.x, p.y, Math.max(6, p.size*6*(1 - t)), 0, Math.PI*2);
          ctx.fill();
        }
        if(p.age >= p.life){
          particles.splice(i,1);
        }
      }
    }
    frame();

    // stop after durationMs
    setTimeout(()=>{
      clearInterval(interval);
      const fadeTimeout = setInterval(()=>{
        if(particles.length===0){
          clearInterval(fadeTimeout);
          cancelAnimationFrame(rafId);
          window.removeEventListener('resize', fit);
          if(canvas.parentNode) canvas.parentNode.removeChild(canvas);
          resolve();
        } else {
          // accelerate life so they finish quickly
          particles.forEach(p=> p.age += 8);
        }
      }, 60);
    }, durationMs);
  });
}