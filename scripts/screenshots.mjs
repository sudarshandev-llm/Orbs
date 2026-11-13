/**
 * Renders the PNG previews with a real browser (Chrome, Edge or Chromium).
 *
 *   assets/previews/<variant>.png   one transparent-ish stage per orb, 600x600
 *   assets/preview.png              the two-row README banner
 *
 * The pages are the actual component, so these images always match the code.
 * Set BROWSER (or CHROME_PATH) if the browser is not in a standard location.
 *
 *   npm run shots
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fileUrl = (...parts) => pathToFileURL(join(root, ...parts)).href;

const candidates = [
  process.env.BROWSER,
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/microsoft-edge",
];
const browser = candidates.filter(Boolean).find((path) => existsSync(path));

if (!browser) {
  console.error(
    "No Chrome, Edge or Chromium found. Set BROWSER=/path/to/browser and run again."
  );
  process.exit(1);
}

const orbs = [
  { variant: "sphere", hue: 265 },
  { variant: "gyro", hue: 196 },
  { variant: "globe", hue: 168 },
  { variant: "grain", hue: 302 },
  { variant: "grain-glow", hue: 222 },
  { variant: "torus", hue: 32 },
  { variant: "ripple", hue: 186 },
  { variant: "particles", hue: 245 },
  { variant: "aurora", hue: 320 },
];

async function shoot({ url, out, width, height, scale, budget = 2600 }) {
  const profile = await mkdtemp(join(tmpdir(), "orbs-shot-"));
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--allow-file-access-from-files",
    "--run-all-compositor-stages-before-draw",
    `--force-device-scale-factor=${scale}`,
    `--window-size=${width},${height}`,
    `--virtual-time-budget=${budget}`,
    `--user-data-dir=${profile}`,
    `--screenshot=${out}`,
    url,
  ];

  try {
    await new Promise((resolve, reject) => {
      const child = spawn(browser, args, { stdio: "ignore" });
      child.on("error", reject);
      child.on("exit", (code) =>
        code === 0 ? resolve() : reject(new Error(`browser exited with ${code}`))
      );
    });
  } finally {
    await rm(profile, { recursive: true, force: true });
  }

  const { size } = await stat(out);
  console.log(`  ${out.replace(root + "\\", "").replace(root + "/", "")}  ${(size / 1024).toFixed(0)} kB`);
}

await mkdir(join(root, "assets", "previews"), { recursive: true });

console.log(`Using ${browser}`);

for (const { variant, hue } of orbs) {
  await shoot({
    url:
      fileUrl("assets", "orb-preview.html") +
      `?variant=${variant}&hue=${hue}&size=300&state=idle`,
    out: join(root, "assets", "previews", `${variant}.png`),
    width: 600,
    height: 600,
    scale: 1,
  });
}

await shoot({
  url: fileUrl("assets", "preview.html"),
  out: join(root, "assets", "preview.png"),
  width: 1290,
  height: 500,
  scale: 1.5,
  budget: 3200,
});

console.log("\nPreviews written to assets/");
