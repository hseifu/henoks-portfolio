const navbar = document.querySelector(".navbar");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector(".nav-menu");
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("section[id]");
const progress = document.querySelector(".scroll-progress");

function closeMenu() {
  navMenu?.classList.remove("open");
  navToggle?.classList.remove("open");
  navToggle?.setAttribute("aria-expanded", "false");
}

navToggle?.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("open");
  navToggle.classList.toggle("open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => closeMenu());
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const href = anchor.getAttribute("href");
    if (!href || href === "#") return;

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

function onScroll() {
  const y = window.scrollY;
  navbar?.classList.toggle("scrolled", y > 24);

  if (progress) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? (y / max) * 100 : 0;
    progress.style.width = `${ratio}%`;
  }

  let current = "";
  sections.forEach((section) => {
    if (y >= section.offsetTop - 220) {
      current = section.id;
    }
  });

  navLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";
    link.classList.toggle("active", href === `#${current}`);
  });
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);

document.querySelectorAll(".reveal").forEach((el, index) => {
  el.style.transitionDelay = `${Math.min(index % 4, 3) * 80}ms`;
  revealObserver.observe(el);
});

// ===============================
// Cursor + Verlet rope
// ===============================
(function initInteractiveFx() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const canUsePointerFx =
    !prefersReducedMotion &&
    window.matchMedia("(pointer: fine)").matches &&
    window.innerWidth > 900;

  if (!canUsePointerFx) return;

  function spring(current, target, velocity, stiffness, damping) {
    const force = (target - current) * stiffness;
    const nextVelocity = (velocity + force) * damping;
    return {
      value: current + nextVelocity,
      velocity: nextVelocity,
    };
  }

  document.documentElement.classList.add("has-cursor-fx");

  const root = document.createElement("div");
  root.className = "cursor-fx";
  root.innerHTML = `
    <div class="cursor-dot"></div>
    <div class="cursor-ring"></div>
    <canvas class="cursor-rope" width="1" height="1"></canvas>
  `;
  document.body.appendChild(root);

  const dot = root.querySelector(".cursor-dot");
  const ring = root.querySelector(".cursor-ring");
  const ropeCanvas = root.querySelector(".cursor-rope");
  const ctx = ropeCanvas.getContext("2d");

  const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const ringPos = { x: mouse.x, y: mouse.y, vx: 0, vy: 0 };

  const segmentLength = 10;
  const points = Array.from({ length: 12 }, (_, i) => ({
    x: mouse.x,
    y: mouse.y + i * segmentLength,
    oldX: mouse.x,
    oldY: mouse.y + i * segmentLength,
    fixed: i === 0,
  }));

  let visible = false;
  let hovering = false;
  let scale = 1;
  let scaleVel = 0;

  function resizeRope() {
    ropeCanvas.width = window.innerWidth * Math.min(devicePixelRatio, 2);
    ropeCanvas.height = window.innerHeight * Math.min(devicePixelRatio, 2);
    ropeCanvas.style.width = `${window.innerWidth}px`;
    ropeCanvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(
      Math.min(devicePixelRatio, 2),
      0,
      0,
      Math.min(devicePixelRatio, 2),
      0,
      0
    );
  }

  resizeRope();
  window.addEventListener("resize", resizeRope);

  window.addEventListener(
    "pointermove",
    (event) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      if (!visible) {
        visible = true;
        root.classList.add("is-visible");
      }
    },
    { passive: true }
  );

  window.addEventListener("pointerdown", () => root.classList.add("is-down"));
  window.addEventListener("pointerup", () => root.classList.remove("is-down"));
  document.documentElement.addEventListener("mouseleave", () => {
    visible = false;
    root.classList.remove("is-visible");
  });

  const interactiveSelector =
    "a, button, .btn, .nav-link, .contact-row, .reference-card, .skill-group, .project-card";

  document.querySelectorAll(interactiveSelector).forEach((el) => {
    el.addEventListener("pointerenter", () => {
      hovering = true;
      root.classList.add("is-hover");
    });
    el.addEventListener("pointerleave", () => {
      hovering = false;
      root.classList.remove("is-hover");
    });
  });

  function updateRope() {
    points[0].x = mouse.x;
    points[0].y = mouse.y;
    points[0].oldX = mouse.x;
    points[0].oldY = mouse.y;

    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      const vx = (p.x - p.oldX) * 0.97;
      const vy = (p.y - p.oldY) * 0.97;

      p.oldX = p.x;
      p.oldY = p.y;
      p.x += vx;
      p.y += vy + 0.6;

      p.x = Math.max(0, Math.min(window.innerWidth, p.x));
      p.y = Math.max(0, Math.min(window.innerHeight, p.y));
    }

    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const difference = segmentLength - distance;
        const percent = difference / distance / 2;
        const offsetX = dx * percent;
        const offsetY = dy * percent;

        if (!p1.fixed) {
          p1.x -= offsetX;
          p1.y -= offsetY;
        }
        if (!p2.fixed) {
          p2.x += offsetX;
          p2.y += offsetY;
        }
      }
    }
  }

  function drawRope() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (!visible) return;

    const head = points[0];
    const tail = points[points.length - 1];

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = hovering ? 2.8 : 2.5;
    ctx.shadowColor = "rgba(31, 107, 90, 0.35)";
    ctx.shadowBlur = 8;

    const gradient = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
    gradient.addColorStop(0, "#1f6b5a");
    gradient.addColorStop(0.5, "#7db89f");
    gradient.addColorStop(1, "#13463b");
    ctx.strokeStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(head.x, head.y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    ctx.shadowBlur = 5;
    for (let i = 0; i < points.length; i += 4) {
      const point = points[i];
      const beadSize = i === points.length - 1 ? 5 : 3.5;
      const bead = ctx.createRadialGradient(
        point.x,
        point.y,
        0,
        point.x,
        point.y,
        beadSize
      );
      bead.addColorStop(0, "#c9f0a8");
      bead.addColorStop(0.6, "#1f6b5a");
      bead.addColorStop(1, "#13463b");
      ctx.fillStyle = bead;
      ctx.beginPath();
      ctx.arc(point.x, point.y, beadSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 7;
    const end = ctx.createRadialGradient(tail.x, tail.y, 0, tail.x, tail.y, 6);
    end.addColorStop(0, "#c9f0a8");
    end.addColorStop(0.5, "#1f6b5a");
    end.addColorStop(1, "#13463b");
    ctx.fillStyle = end;
    ctx.beginPath();
    ctx.arc(tail.x, tail.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function tick() {
    requestAnimationFrame(tick);

    const ringSpringX = spring(ringPos.x, mouse.x, ringPos.vx, 0.18, 0.72);
    const ringSpringY = spring(ringPos.y, mouse.y, ringPos.vy, 0.18, 0.72);
    ringPos.x = ringSpringX.value;
    ringPos.y = ringSpringY.value;
    ringPos.vx = ringSpringX.velocity;
    ringPos.vy = ringSpringY.velocity;

    const targetScale = hovering ? 1.85 : 1;
    const scaleSpring = spring(scale, targetScale, scaleVel, 0.16, 0.7);
    scale = scaleSpring.value;
    scaleVel = scaleSpring.velocity;

    dot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
    ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) scale(${scale})`;

    updateRope();
    drawRope();
  }

  tick();
})();

console.log(
  "%cHenok Seifu",
  "color:#1f6b5a;font-size:18px;font-weight:700;font-family:Syne,sans-serif;"
);
console.log("henokhailu37@gmail.com");
