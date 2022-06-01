const swc = require("@swc/core");
const fs = require("fs");
const path = require("path");
const { cwd } = require("process");

const build = path.join(cwd(), "build");
const options = JSON.parse(fs.readFileSync("./.swcrc", "utf-8"));

function getFiles(dir, cb) {
  for (const entry of fs.readdirSync(dir).map((p) => path.join(dir, p))) {
    cb(entry);
  }
}

function flattenPath(p, n) {
  return path.normalize(p).split(path.sep).slice(n).join(path.sep);
}

function pathDepth(p) {
  return path.normalize(p).split(path.sep).length;
}

async function process(file, flat) {
  if ((await fs.promises.stat(file)).isDirectory()) {
    if (pathDepth(path.relative(cwd(), file)) > flat) {
      await fs.promises.mkdir(path.join(build, flattenPath(path.relative(cwd(), file), flat)));
    }
    getFiles(file, (f) => process(f, flat));
  } else {
    const result = await swc.transformFile(file, options);
    const dir = path.dirname(file);
    const fileName = `${path.basename(file, path.extname(file))}.js`;
    const out = path.join(build, flat ? flattenPath(dir, flat) : dir, fileName);
    await fs.promises.writeFile(out, result.code, "utf-8");
  }
}

if (fs.existsSync(build)) {
  fs.rmSync(build, { force: true, recursive: true });
}
fs.mkdirSync(build);

process("./src", 1);
