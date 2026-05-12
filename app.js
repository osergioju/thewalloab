/* =====================================================================
   THE WALL — Orchestration
   ===================================================================== */
(() => {
    const body = document.body;
    const screens = {
        intro: document.getElementById('screenIntro'),
        form: document.getElementById('screenForm'),
        game: document.getElementById('screenGame'),
    };
    const ballStage = document.getElementById('ballStage');
    const goCadastro = document.getElementById('goCadastro');
    const formEl = document.getElementById('cadastroForm');
    const dropBtn = document.getElementById('dropBall');

    /* ----- Setup eyebrow letters with index for stagger ----- */
    document.querySelectorAll('.eyebrow').forEach(eb => {
        [...eb.children].forEach((s, i) => s.style.setProperty('--i', i));
    });

    /* ----- Build demo pegboard pegs ----- */
    const pegHost = document.getElementById('boardPegs');
    if (pegHost) {
        const cols = 15, rows = 7;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const p = document.createElement('span');
                p.className = 'peg';
                // Slight offset every other row for that classic plinko look
                if (r % 2 === 1) p.style.transform = 'translateX(50%)';
                pegHost.appendChild(p);
            }
        }
    }

    /* ----- Initial load ----- */
    body.classList.add('is-intro');
    // Show header after first paint to avoid layout flash
    requestAnimationFrame(() => {
        setTimeout(() => body.classList.add('hdr-visible'), 600);
    });

    /* ----- Phone & date masks ----- */
    const phone = document.getElementById('telefone');
    if (phone) {
        phone.addEventListener('input', e => {
            let v = e.target.value.replace(/\D/g, '').slice(0, 11);
            if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
            else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
            else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5}).*/, '($1) $2');
            else if (v.length > 0) v = v.replace(/(\d{0,2}).*/, '($1');
            e.target.value = v;
        });
    }
    const dt = document.getElementById('nascimento');
    if (dt) {
        dt.addEventListener('input', e => {
            let v = e.target.value.replace(/\D/g, '').slice(0, 8);
            if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d{0,4}).*/, '$1/$2/$3');
            else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,2}).*/, '$1/$2');
            e.target.value = v;
        });
    }

    /* ----- Screen transitions ----- */
    function showScreen(target) {
        // Mark body state for ambient layers
        body.classList.toggle('is-intro', target === 'intro');

        Object.entries(screens).forEach(([name, el]) => {
            if (!el) return;
            if (name === target) {
                el.classList.remove('is-leaving');
                // Force reflow to restart animations
                void el.offsetWidth;
                el.classList.add('is-active');
                el.setAttribute('aria-hidden', 'false');
            } else if (el.classList.contains('is-active')) {
                el.classList.add('is-leaving');
                el.classList.remove('is-active');
                el.setAttribute('aria-hidden', 'true');
                setTimeout(() => el.classList.remove('is-leaving'), 700);
            } else {
                el.setAttribute('aria-hidden', 'true');
            }
        });

        // Move/scale ball
        ballStage.dataset.state = target;
    }

    /* ----- Wire up buttons ----- */
    goCadastro?.addEventListener('click', () => {
        showScreen('form');
        // Focus first field after the screen settles
        setTimeout(() => document.getElementById('nome')?.focus(), 800);
    });

    formEl?.addEventListener('submit', (e) => {
        e.preventDefault();

        const lead = {
            nome: document.getElementById('nome').value,
            nascimento: document.getElementById('nascimento').value,
            telefone: document.getElementById('telefone').value,
            email: document.getElementById('email').value,
            advogado: document.getElementById('advogado').checked ? 'SIM' : 'NÃO',
            oabprev: document.getElementById('oabprev').checked ? 'SIM' : 'NÃO',
            data: new Date().toLocaleString()
        };

        const leads = JSON.parse(localStorage.getItem('leads')) || [];
        leads.push(lead);

        localStorage.setItem('leads', JSON.stringify(leads));

        console.log('Lead salvo:', lead);

        // 👉 AQUI você mantém o fluxo do seu jogo
        // exemplo:
        // window.location.href = "jogo.html";


        // Validate minimally — name + email/phone
        const nome = document.getElementById('nome')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        if (!nome) {
            document.getElementById('nome')?.focus();
            shake(document.getElementById('nome')?.closest('.field'));
            return;
        }
        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            document.getElementById('email')?.focus();
            shake(document.getElementById('email')?.closest('.field'));
            return;
        }
        // Save payload (in real app: send to API)
        const payload = {
            nome,
            nascimento: document.getElementById('nascimento')?.value,
            telefone: document.getElementById('telefone')?.value,
            email,
            advogado: document.getElementById('advogado')?.checked,
            oabprev: document.getElementById('oabprev')?.checked,
        };
        window.__OABPREV_USER__ = payload;
        showScreen('game');
    });

    dropBtn?.addEventListener('click', () => {
        // Hand-off to your real game here.
        // For demo: animate the ball "dropping" off-screen, then re-enable.
        ballStage.dataset.state = 'dropped';
        dropBtn.disabled = true;
        setTimeout(() => {
            ballStage.dataset.state = 'game';
            dropBtn.disabled = false;
        }, 1800);
    });

    function shake(el) {
        if (!el) return;
        el.animate(
            [
                { transform: 'translateX(0)' },
                { transform: 'translateX(-6px)' },
                { transform: 'translateX(6px)' },
                { transform: 'translateX(-3px)' },
                { transform: 'translateX(0)' },
            ],
            { duration: 380, easing: 'ease-out' }
        );
    }

    /* ----- Subtle parallax on ball based on cursor (intro + form only) ----- */
    let mx = 0, my = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', (e) => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        mx = (e.clientX - cx) / cx;
        my = (e.clientY - cy) / cy;
    });
    function loop() {
        tx += (mx - tx) * 0.05;
        ty += (my - ty) * 0.05;
        const sphere = document.querySelector('.ball__sphere');
        if (sphere) {
            const state = ballStage.dataset.state;
            const intensity = state === 'intro' ? 14 : (state === 'form' ? 8 : 0);
            sphere.style.setProperty('--px', `${tx * intensity}px`);
            sphere.style.setProperty('--py', `${ty * intensity}px`);
            // Apply via additional translate (keeps the float animation working)
            sphere.style.translate = `${tx * intensity}px ${ty * intensity}px`;
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    /* ----- Keyboard helpers ----- */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Quick "back" — only intro→form for testing
            const state = ballStage.dataset.state;
            if (state === 'form') showScreen('intro');
            else if (state === 'game') showScreen('form');
        }
    });
})();





(function () {
    const SLOT_VALUES = [500, 150, 300, 50, 800, 25, 2000];
    const SLOT_COUNT = 7;
    const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const PADDING_X = 30;
    const PEG_ROWS = 8;
    const PEG_COLS = 18;
    const PEG_RADIUS = 4;
    const BALL_RADIUS = 9;
    const GRAVITY = 0.22;
    const BOUNCE = 0.55;
    const FRICTION = 1.0;
    const HORIZ_KICK = 3.0;
    const MAX_FRAMES = 1200;

    // NOVO: quantas colunas extras adicionar em cada lado pra fechar o corredor lateral.
    // Cada SIDE_EXTRA_COLS=1 adiciona 1 pino a mais por fileira de cada lado (mantendo o zig-zag).
    const SIDE_EXTRA_COLS = 2;

    const AIM_MIN_X = BALL_RADIUS + 4;
    const AIM_MAX_X = W - BALL_RADIUS - 4;

    const pegs = [];
    const topY = 50;
    const rowGap = 42;
    const colGap = (W - PADDING_X * 2) / (PEG_COLS - 1);

    // NOVO: gera fileiras com SIDE_EXTRA_COLS colunas a mais de cada lado.
    // Mantém o mesmo zig-zag (fileira par sem offset, ímpar com colGap/2).
    // O ponto-chave: as colunas extras seguem o MESMO espaçamento colGap, então
    // o padrão hexagonal não quebra e não sobra corredor reto perto da parede.
    for (let r = 0; r < PEG_ROWS; r++) {
        const isEven = r % 2 === 0;
        const offset = isEven ? 0 : colGap / 2;
        const baseCols = isEven ? PEG_COLS : PEG_COLS - 1;
        const totalCols = baseCols + SIDE_EXTRA_COLS * 2;
        // começa antes do PADDING_X original (à esquerda) e segue colGap normal
        const startX = PADDING_X + offset - SIDE_EXTRA_COLS * colGap;
        for (let c = 0; c < totalCols; c++) {
            const x = startX + c * colGap;
            const y = topY + r * rowGap;
            // mantém só pinos que cabem dentro do canvas
            if (x > PEG_RADIUS + 2 && x < W - PEG_RADIUS - 2) {
                pegs.push({ x, y });
            }
        }
    }

    const slotWidth = W / SLOT_COUNT;
    const slotTopY = topY + PEG_ROWS * rowGap + 10;
    const dividers = [];
    for (let i = 1; i < SLOT_COUNT; i++) {
        dividers.push({ x: i * slotWidth, top: slotTopY, bottom: H });
    }

    const state = {
        chances: 2,
        total: 0,
        history: [],
        ball: null,
        phase: 'idle',
        highlightSlot: -1,
        rafId: null,
        resetTimerId: null,
        frameCount: 0,
        aimX: W / 2
    };

    const dropBtn = document.getElementById('dropBtn');
    const resetBtn = document.getElementById('resetBtn');

    function setButtonEnabled(enabled) {
        dropBtn.disabled = !enabled;
        dropBtn.style.opacity = enabled ? '1' : '0.4';
        dropBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
    }

    function refreshButton() {
        const canDrop = state.phase === 'idle' && state.chances > 0;
        setButtonEnabled(canDrop);
        canvas.style.cursor = canDrop ? 'crosshair' : 'default';
    }

    function renderSlots() {
        const wrap = document.getElementById('slots');
        wrap.innerHTML = '';
        SLOT_VALUES.forEach((v, i) => {
            const isHighlight = i === state.highlightSlot;
            const div = document.createElement('div');
            div.style.cssText = `
        background: ${isHighlight ? 'linear-gradient(180deg, rgba(135,206,235,0.4), rgba(91,141,239,0.3))' : 'linear-gradient(180deg, rgba(40,70,120,0.5), rgba(20,40,80,0.5))'};
        border: 1px solid ${isHighlight ? '#87ceeb' : 'rgba(135,206,235,0.3)'};
        border-radius: 8px;
        padding: 10px 4px;
        text-align: center;
        transition: all 0.3s;
        ${isHighlight ? 'box-shadow: 0 0 20px rgba(135,206,235,0.6);' : ''}
      `;
            div.innerHTML = `
        <div style="font-size: 11px; color: #b0c4de; letter-spacing: 1px; margin-bottom: 4px;">SLOT ${i + 1}</div>
        <div style="font-size: 22px; color: ${isHighlight ? '#fff' : '#c8e0ff'}; font-weight: 300; letter-spacing: 1px;">${v.toLocaleString('pt-BR')}</div>
        <div style="font-size: 9px; color: #7090b8; letter-spacing: 1px; margin-top: 2px;">PREVCOINS</div>
      `;
            wrap.appendChild(div);
        });
    }

    function renderHistory() {
        const wrap = document.getElementById('history');
        wrap.innerHTML = '';
        state.history.forEach((v, i) => {
            const tag = document.createElement('div');
            tag.style.cssText = `background: rgba(91,141,239,0.2); border: 1px solid rgba(135,206,235,0.4); color: #c8e0ff; padding: 4px 12px; border-radius: 14px; font-size: 12px;`;
            tag.textContent = `Tentativa ${i + 1}: ${v.toLocaleString('pt-BR')}`;
            wrap.appendChild(tag);
        });
    }

    function updateHUD() {
        document.getElementById('chances').textContent = state.chances;
        document.getElementById('total').textContent = state.total.toLocaleString('pt-BR');
    }

    function setStatus(text, color) {
        const el = document.getElementById('status');
        el.textContent = text;
        el.style.color = color || '#fff';
    }

    function drawAim() {
        if (state.phase !== 'idle' || state.chances <= 0) return;
        const x = state.aimX;

        ctx.save();
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = 'rgba(135,206,235,0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, 36);
        ctx.lineTo(x, topY - 6);
        ctx.stroke();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(x, 24, BALL_RADIUS + 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200,224,255,0.25)';
        ctx.fill();
        const bg = ctx.createRadialGradient(x - 3, 24 - 3, 0, x, 24, BALL_RADIUS);
        bg.addColorStop(0, 'rgba(255,255,255,0.85)');
        bg.addColorStop(0.4, 'rgba(216,232,248,0.7)');
        bg.addColorStop(1, 'rgba(80,112,160,0.6)');
        ctx.beginPath();
        ctx.arc(x, 24, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }

    function drawBoard() {
        ctx.clearRect(0, 0, W, H);
        const grad = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W / 1.2);
        grad.addColorStop(0, 'rgba(135,206,235,0.08)');
        grad.addColorStop(1, 'rgba(10,22,40,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        pegs.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, PEG_RADIUS + 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,200,80,0.25)';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(p.x, p.y, PEG_RADIUS, 0, Math.PI * 2);
            const g = ctx.createRadialGradient(p.x - 1, p.y - 1, 0, p.x, p.y, PEG_RADIUS);
            g.addColorStop(0, '#fff5c0');
            g.addColorStop(0.5, '#ffc857');
            g.addColorStop(1, '#c08020');
            ctx.fillStyle = g;
            ctx.fill();
        });

        dividers.forEach(d => {
            ctx.beginPath();
            ctx.moveTo(d.x, d.top);
            ctx.lineTo(d.x, d.bottom);
            ctx.strokeStyle = 'rgba(135,206,235,0.5)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });

        ctx.beginPath();
        ctx.moveTo(0, slotTopY);
        ctx.lineTo(W, slotTopY);
        ctx.strokeStyle = 'rgba(135,206,235,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (state.ball) {
            const b = state.ball;
            ctx.beginPath();
            ctx.arc(b.x, b.y, BALL_RADIUS + 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200,224,255,0.3)';
            ctx.fill();
            const bg = ctx.createRadialGradient(b.x - 3, b.y - 3, 0, b.x, b.y, BALL_RADIUS);
            bg.addColorStop(0, '#ffffff');
            bg.addColorStop(0.4, '#d8e8f8');
            bg.addColorStop(1, '#5070a0');
            ctx.beginPath();
            ctx.arc(b.x, b.y, BALL_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = bg;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        } else {
            drawAim();
        }
    }

    function step() {
        if (state.phase !== 'falling' || !state.ball) {
            state.rafId = null;
            return;
        }

        state.frameCount++;
        const b = state.ball;
        b.vy += GRAVITY;
        const distFromCenter = b.x - W / 2;
        b.vx += (distFromCenter === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(distFromCenter)) * 0.02;

        b.x += b.vx;
        b.y += b.vy;

        if (b.x < BALL_RADIUS) { b.x = BALL_RADIUS; b.vx = -b.vx * BOUNCE; }
        if (b.x > W - BALL_RADIUS) { b.x = W - BALL_RADIUS; b.vx = -b.vx * BOUNCE; }

        pegs.forEach(p => {
            const dx = b.x - p.x;
            const dy = b.y - p.y;
            const dist = Math.hypot(dx, dy);
            const minDist = BALL_RADIUS + PEG_RADIUS;
            if (dist < minDist && dist > 0) {
                const nx = dx / dist;
                const ny = dy / dist;
                const overlap = minDist - dist;
                b.x += nx * overlap;
                b.y += ny * overlap;
                const dot = b.vx * nx + b.vy * ny;
                b.vx = (b.vx - 2 * dot * nx) * BOUNCE;
                b.vy = (b.vy - 2 * dot * ny) * BOUNCE;
                b.vx += (Math.random() - 0.5) * HORIZ_KICK;
            }
        });

        if (b.y > slotTopY - BALL_RADIUS) {
            dividers.forEach(d => {
                if (b.y + BALL_RADIUS > d.top) {
                    const dx = b.x - d.x;
                    if (Math.abs(dx) < BALL_RADIUS) {
                        b.x = d.x + Math.sign(dx || 1) * BALL_RADIUS;
                        b.vx = -b.vx * BOUNCE;
                    }
                }
            });
        }

        if (b.y > H - BALL_RADIUS || state.frameCount > MAX_FRAMES) {
            b.y = Math.min(b.y, H - BALL_RADIUS);
            const slotIdx = Math.max(0, Math.min(SLOT_COUNT - 1, Math.floor(b.x / slotWidth)));
            finishDrop(slotIdx);
            return;
        }

        drawBoard();
        state.rafId = requestAnimationFrame(step);
    }

    function finishDrop(slotIdx) {
        if (state.rafId) {
            cancelAnimationFrame(state.rafId);
            state.rafId = null;
        }

        const value = SLOT_VALUES[slotIdx];
        state.total += value;
        state.history.push(value);
        state.highlightSlot = slotIdx;
        state.phase = 'celebrating';

        drawBoard();
        renderSlots();
        renderHistory();
        updateHUD();
        setStatus('+' + value.toLocaleString('pt-BR') + ' PREVCOINS!', '#87ceeb');
        refreshButton();

        if (state.resetTimerId) clearTimeout(state.resetTimerId);
        state.resetTimerId = setTimeout(() => {
            state.resetTimerId = null;
            state.ball = null;
            state.highlightSlot = -1;
            renderSlots();
            drawBoard();

            if (state.chances <= 0) {
                state.phase = 'gameover';
                setStatus('FIM! Total: ' + state.total.toLocaleString('pt-BR'), '#ffd700');
            } else {
                state.phase = 'idle';
                setStatus('COMEÇAR!', '#fff');
            }
            refreshButton();
        }, 1600);
    }

    function dropBall() {
        if (state.phase !== 'idle' || state.chances <= 0) return;

        state.phase = 'falling';
        state.chances--;
        state.frameCount = 0;
        state.ball = {
            x: state.aimX + (Math.random() - 0.5) * 2,
            y: 24,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 0
        };

        updateHUD();
        setStatus('CAINDO...', '#c8e0ff');
        refreshButton();

        if (state.rafId) cancelAnimationFrame(state.rafId);
        state.rafId = requestAnimationFrame(step);
    }

    function reset() {
        window.location.reload();
    }

    function getCanvasX(evt) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const x = (evt.clientX - rect.left) * scaleX;
        return Math.max(AIM_MIN_X, Math.min(AIM_MAX_X, x));
    }

    canvas.addEventListener('mousemove', (e) => {
        if (state.phase !== 'idle' || state.chances <= 0) return;
        state.aimX = getCanvasX(e);
        if (!state.ball) drawBoard();
    });

    canvas.addEventListener('click', (e) => {
        if (state.phase !== 'idle' || state.chances <= 0) return;
        state.aimX = getCanvasX(e);
        dropBall();
    });

    canvas.addEventListener('touchmove', (e) => {
        if (state.phase !== 'idle' || state.chances <= 0) return;
        if (e.touches.length === 0) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const x = (e.touches[0].clientX - rect.left) * scaleX;
        state.aimX = Math.max(AIM_MIN_X, Math.min(AIM_MAX_X, x));
        if (!state.ball) drawBoard();
    }, { passive: false });

    dropBtn.addEventListener('click', dropBall);
    resetBtn.addEventListener('click', reset);

    renderSlots();
    updateHUD();
    refreshButton();
    drawBoard();
})();