import { exec } from "child_process";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  console.log("⏳ Waiting 3 seconds for Vite dev server...");
  await delay(3000);
  exec("electron dist/electron/main.js", (err, stdout, stderr) => {
    if (err) console.error(err);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  });
})();
