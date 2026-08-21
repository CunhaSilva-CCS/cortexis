(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     Mobile nav toggle
     --------------------------------------------------------- */
  const header = document.querySelector(".site-header");
  const navToggle = document.getElementById("navToggle");
  if (navToggle && header) {
    navToggle.addEventListener("click", () => {
      const open = header.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    document.getElementById("main-nav").addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        header.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------------------------------------------------------
     Scroll reveal + process path progress
     --------------------------------------------------------- */
  const revealTargets = document.querySelectorAll(
    ".card, .process-path, .about-text, .about-graphic, .contact-intro, .contact-form"
  );
  revealTargets.forEach((el) => el.classList.add("reveal"));

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("in-view"));
  }

  /* ---------------------------------------------------------
     Contact form -> mailto fallback (static site, no backend)
     --------------------------------------------------------- */
  const form = document.getElementById("contactForm");
  const formNote = document.getElementById("formNote");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const nome = (data.get("nome") || "").toString().trim();
      const email = (data.get("email") || "").toString().trim();
      const tipo = (data.get("tipo") || "").toString().trim();
      const mensagem = (data.get("mensagem") || "").toString().trim();

      const subject = `Novo projeto: ${tipo} — ${nome}`;
      const body = `Nome: ${nome}\nE-mail: ${email}\nTipo de projeto: ${tipo}\n\nMensagem:\n${mensagem}`;
      const mailto = `mailto:contato@cortexis.com?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;

      window.location.href = mailto;
      if (formNote) {
        formNote.textContent = "Abrindo seu app de e-mail para enviar a mensagem...";
      }
    });
  }

  /* ---------------------------------------------------------
     Constellation canvas — ambient signal graph in the hero
     --------------------------------------------------------- */
  const canvas = document.getElementById("constellation");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const hero = canvas.closest(".hero");
  let width, height, dpr;
  let nodes = [];
  let pulses = [];
  let rafId = null;

  const CYAN = "70, 214, 232";
  const BLUE = "46, 127, 214";

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = hero.clientWidth;
    height = hero.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const density = width < 720 ? 16000 : 9000;
    const count = Math.max(18, Math.min(60, Math.round((width * height) / density)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
    }));
  }

  function maybeSpawnPulse() {
    if (Math.random() > 0.985 && nodes.length > 4) {
      const a = nodes[Math.floor(Math.random() * nodes.length)];
      let b = nodes[Math.floor(Math.random() * nodes.length)];
      let tries = 0;
      while (b === a && tries < 5) {
        b = nodes[Math.floor(Math.random() * nodes.length)];
        tries++;
      }
      pulses.push({ a, b, t: 0 });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const maxDist = width < 720 ? 110 : 150;

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.35;
          ctx.strokeStyle = `rgba(${CYAN}, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${CYAN}, 0.6)`;
      ctx.fill();
    }

    maybeSpawnPulse();
    pulses = pulses.filter((p) => p.t < 1);
    for (const p of pulses) {
      p.t += 0.012;
      const x = p.a.x + (p.b.x - p.a.x) * p.t;
      const y = p.a.y + (p.b.y - p.a.y) * p.t;
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${BLUE}, ${1 - p.t})`;
      ctx.shadowColor = `rgba(${BLUE}, 0.8)`;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    rafId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);

  if (reduceMotion) {
    draw();
    cancelAnimationFrame(rafId);
  } else {
    draw();
  }
})();
