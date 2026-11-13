/**
 * Builds the generated artefacts from a single source of truth:
 *
 *   orb.css            -> inlined into /orbs/*.html and /orb.js
 *   src/markup/*.html  -> per-variant markup for demos and the component
 *   src/component.js   -> /orb.js (with CSS + markup injected)
 *
 * Run: npm run build
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = (await readFile(join(root, "orb.css"), "utf8")).trim();

const variants = [
  {
    file: "orb-3d-sphere.html",
    markup: "sphere.html",
    variant: "sphere",
    title: "Glass Sphere",
    hue: 265,
    label: "Polished glass sphere",
    note: "Key light, terminator, fresnel rim, horizon reflection, caustic, film grain.",
  },
  {
    file: "orb-3d-gyro.html",
    markup: "gyro.html",
    variant: "gyro",
    title: "Neon Gyro",
    hue: 196,
    label: "Orbiting gyroscope rings",
    note: "Three rings in real 3D, split into a dimmed back rig and a bright front rig for depth.",
  },
  {
    file: "orb-3d-globe.html",
    markup: "globe.html",
    variant: "globe",
    title: "Wire Globe",
    hue: 168,
    label: "Wireframe globe",
    note: "Meridians and latitudes built from real 3D rotations, with atmosphere and volumetric haze.",
  },
  {
    file: "orb-grain.html",
    markup: "grain.html",
    variant: "grain",
    title: "Grain",
    hue: 302,
    label: "Matte grain orb",
    note: "Sandblasted surface: wide specular, two grain layers running at different speeds.",
  },
  {
    file: "orb-grain-glow.html",
    markup: "grain-glow.html",
    variant: "grain-glow",
    title: "Grain Glow",
    hue: 222,
    label: "Grain glow cloud",
    note: "No hard surface. Layered plasma, dust grain and a wide halo instead of a rim.",
  },
  {
    file: "orb-3d-torus.html",
    markup: "torus.html",
    variant: "torus",
    title: "Metal Torus",
    hue: 32,
    label: "Brushed metal torus",
    note: "A single element tilted in 3D. Radial passes shade the tube, a conic wraps the key light around it.",
  },
  {
    file: "orb-ripple.html",
    markup: "ripple.html",
    variant: "ripple",
    title: "Sonar Ripple",
    hue: 186,
    label: "Glass bead with sonar rings",
    note: "A glass bead breathing inside four staggered rings. Every ring is retimed by the same state clock.",
  },
  {
    file: "orb-3d-particles.html",
    markup: "particles.html",
    variant: "particles",
    title: "Dust Field",
    hue: 245,
    label: "Orbiting dust field",
    note: "Two shells of real 3D dust orbit a hot nucleus. The rear shell is dimmed and softened for depth.",
  },
  {
    file: "orb-aurora.html",
    markup: "aurora.html",
    variant: "aurora",
    title: "Aurora Marble",
    hue: 320,
    label: "Aurora inside a glass marble",
    note: "Three conic veils run at different speeds. A dark limb keeps the light inside the marble.",
  },
];

const states = ["idle", "listening", "thinking", "speaking"];

/* ------------------------------------------------------------------ markup */

const markup = {};
for (const v of variants) {
  markup[v.variant] = (await readFile(join(root, "src", "markup", v.markup), "utf8")).trim();
}

/* ------------------------------------------------------- standalone demos */

const page = ({ v, body }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="description" content="${v.title} — a realistic, zero-dependency CSS orb for AI assistants. Part of Orbs.">
<title>${v.title} · Orbs</title>
<style>
  html, body { height: 100%; margin: 0; }
  body {
    display: grid;
    place-items: center;
    background:
      radial-gradient(120% 110% at 50% -10%, #181533 0%, #0c0a19 45%, #06050d 100%);
    color: #cfcbe6;
    font: 14px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .demo { display: grid; justify-items: center; gap: 28px; padding: 40px 24px; }
  .orb-stage { margin-bottom: -8px; }
  .meta { text-align: center; max-width: 34ch; }
  .meta h1 { margin: 0 0 6px; font-size: 15px; font-weight: 600; letter-spacing: .01em; }
  .meta p { margin: 0; font-size: 12.5px; color: #8d88ab; }
  .states { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
  .states button {
    appearance: none;
    border: 1px solid #ffffff1f;
    background: #ffffff0a;
    color: #b9b4d6;
    font: inherit;
    font-size: 12px;
    padding: 6px 13px;
    border-radius: 999px;
    cursor: pointer;
    transition: background .18s ease, color .18s ease, border-color .18s ease;
  }
  .states button:hover { background: #ffffff14; color: #e7e3ff; }
  .states button[aria-pressed="true"] {
    background: hsl(${v.hue} 90% 60% / .18);
    border-color: hsl(${v.hue} 90% 70% / .55);
    color: #fff;
  }
  .states button:focus-visible { outline: 2px solid hsl(${v.hue} 90% 70% / .8); outline-offset: 2px; }
  .back {
    position: fixed; top: 18px; left: 18px;
    color: #8d88ab; text-decoration: none; font-size: 12px;
    padding: 6px 12px; border-radius: 999px; border: 1px solid #ffffff14;
  }
  .back:hover { color: #fff; background: #ffffff0d; }
  .hint { font-size: 11.5px; color: #5f5a7a; margin: -14px 0 0; text-align: center; }
  @media (prefers-reduced-motion: reduce) {
    .states button { transition: none; }
  }

/* ---- orb.css (inlined so this file works on its own) ------------------- */
${css}
</style>
</head>
<body>
  <a class="back" href="../index.html">&#8592; All orbs</a>
  <main class="demo">
    <div class="orb-stage" data-state="idle" style="--orb-h:${v.hue};--orb-size:168px"
         role="img" aria-label="${v.label}, idle">
${body}
    </div>

    <div class="meta">
      <h1>${v.title}</h1>
      <p>${v.note}</p>
    </div>

    <div class="states" role="group" aria-label="Orb state">
${states
  .map(
    (s) =>
      `      <button type="button" data-set="${s}" aria-pressed="${s === "idle"}">${s}</button>`
  )
  .join("\n")}
    </div>
    <p class="hint">Click a state. Everything here is CSS &mdash; the script only flips one attribute.</p>
  </main>

<script>
  // Demo only. The orb is pure CSS; this block just switches the attribute.
  var stage = document.querySelector(".orb-stage");
  var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-set]"));
  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      var state = button.dataset.set;
      stage.dataset.state = state;
      stage.setAttribute("aria-label", "${v.label}, " + state);
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b === button));
      });
    });
  });
</script>
</body>
</html>
`;

await mkdir(join(root, "orbs"), { recursive: true });

for (const v of variants) {
  await writeFile(join(root, "orbs", v.file), page({ v, body: markup[v.variant] }), "utf8");
  console.log(`  orbs/${v.file}`);
}

/* ------------------------------------------------------------- component */

const template = await readFile(join(root, "src", "component.js"), "utf8");
const component = template
  .replace('"__ORB_CSS__"', () => JSON.stringify(css))
  .replace("__ORB_MARKUP__", () => JSON.stringify(markup, null, 2));

if (component === template) {
  throw new Error("component template placeholders were not replaced");
}

await writeFile(join(root, "orb.js"), component, "utf8");
console.log("  orb.js");

console.log(
  `\n${variants.length} orbs + component built from orb.css (${(css.length / 1024).toFixed(1)} kB)`
);
