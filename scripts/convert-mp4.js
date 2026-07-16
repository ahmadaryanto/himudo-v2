const { spawnSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const ffmpeg = require("ffmpeg-static");

const demo = path.join(__dirname, "..", "demo");
const files = [
  "himudo-desktop-demo.webm",
  "himudo-mobile-demo.webm",
];

if (!ffmpeg || !fs.existsSync(ffmpeg)) {
  console.error("ffmpeg binary missing:", ffmpeg);
  process.exit(1);
}

for (const name of files) {
  const input = path.join(demo, name);
  const output = path.join(demo, name.replace(/\.webm$/i, ".mp4"));
  if (!fs.existsSync(input)) {
    console.warn("skip missing", input);
    continue;
  }
  console.log("Converting", name, "->", path.basename(output));
  const r = spawnSync(
    ffmpeg,
    [
      "-y",
      "-i",
      input,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      output,
    ],
    { encoding: "utf8" }
  );
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    process.exit(r.status || 1);
  }
  console.log("OK", output, fs.statSync(output).size, "bytes");
}
