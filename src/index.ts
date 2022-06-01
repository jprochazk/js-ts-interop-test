import { getBinaryMetadata } from "@swc/core";
import * as fs from "fs/promises";
import * as path from "path";
import { Command, COMMANDS_DIR } from "./cmd.js";

console.log(`@swc/core metadata:`, getBinaryMetadata());

declare global {
  var commands: Record<string, Command>;
}
globalThis.commands = {};

for (const file of await fs.readdir(COMMANDS_DIR)) {
  const name = path.basename(file, path.extname(file));
  Command.load(name).then((m) => {
    if (m) globalThis.commands[name] = m;
  });
}

export * from "./cmd.js";
export * from "./irc.js";
export * from "./msg.js";

while (true) {
  await new Promise((done) => setTimeout(done, 1000));
}
