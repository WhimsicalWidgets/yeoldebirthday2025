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
const winDialog = document.getElementById('winDialog');
const closeDialogBtn = document.getElementById('closeDialog');

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
    // mark all first letters green (final reveal)
    firstLetterEls.forEach(el=> el.classList.add('green-letter'));
    // show win dialog
    winDialog.style.display = 'flex';
  } else if(attempts.length >= MAX_ATTEMPTS){
    setStatus('Out of attempts. The phrase was: "'+SECRET+'"');
    input.disabled = true;
    // reveal hero even if failed so user can see text
    hero.style.display = 'flex';
    hero.scrollTop = 0;
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
  // hide hero and dialog, clear first-letter highlights
  hero.style.display = 'none';
  winDialog.style.display = 'none';
  firstLetterEls.forEach(el=> el.classList.remove('green-letter'));
});

// Close dialog when clicking "Stay Here" button
closeDialogBtn.addEventListener('click', ()=>{
  winDialog.style.display = 'none';
});

// Close dialog when clicking outside of dialog content
winDialog.addEventListener('click', (e)=>{
  if(e.target === winDialog){
    winDialog.style.display = 'none';
  }
});

render();
setStatus(`You have ${MAX_ATTEMPTS} attempts to reveal the phrase.`);

// FIREWORKS: Create bright, colorful fireworks using fireworks-js library
function startFireworks(durationMs=3000){
  return new Promise(resolve=>{
    // Create fullscreen container
    const container = document.createElement('div');
    container.id = 'fireworksContainer';
    Object.assign(container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '2147483647',
      pointerEvents: 'none'
    });
    document.body.appendChild(container);

    // Initialize fireworks with bright, vibrant settings
    const fireworks = new Fireworks(container, {
      hue: {
        min: 0,
        max: 360
      },
      delay: {
        min: 15,
        max: 30
      },
      rocketsPoint: {
        min: 50,
        max: 50
      },
      opacity: 0.8,
      acceleration: 1.02,
      friction: 0.97,
      gravity: 1.5,
      particles: 180,
      traceLength: 3,
      traceSpeed: 10,
      explosion: 8,
      intensity: 30,
      flickering: 50,
      lineStyle: 'round',
      lineWidth: {
        explosion: {
          min: 1,
          max: 4
        },
        trace: {
          min: 1,
          max: 3
        }
      },
      brightness: {
        min: 50,
        max: 80
      },
      decay: {
        min: 0.015,
        max: 0.03
      },
      mouse: {
        click: false,
        move: false,
        max: 1
      }
    });

    fireworks.start();

    // Stop after duration and cleanup
    setTimeout(()=>{
      fireworks.stop();
      setTimeout(()=>{
        if(container.parentNode) {
          container.parentNode.removeChild(container);
        }
        resolve();
      }, 500);
    }, durationMs);
  });
}