import * as fs from "fs/promises";
import * as path from "path";
import { cwd } from "process";
import { createRequire } from "module";
import { transform, type Options } from "@swc/core";
import type { Sender } from "./irc.js";
import type { Message } from "./msg.js";

export interface Context {
  sender: Sender;
}

export class Command {
  constructor(readonly name: string, private module: CommandModule) {}

  async execute(ctx: Context, msg: Message) {
    await this.module.execute(ctx, msg);
  }

  async reload() {
    const newModule = await loadRaw(this.name);
    if (newModule) {
      this.module = newModule;
      console.log(`Reloaded module ${this.name}`);
    } else {
      console.error(`Failed to reload module ${this.name}`);
    }
  }

  static async load(name: string): Promise<Command | null> {
    const module = await loadRaw(name);
    return module ? new Command(name, module) : null;
  }
}

interface CommandModule {
  execute(ctx: Context, message: Message): Promise<void>;
}

function isCommandModule(module: any): module is CommandModule {
  return "execute" in module;
}

export const COMMANDS_DIR = path.join(cwd(), "commands");

const swcOptions: Options = {
  jsc: {
    parser: { syntax: "typescript" },
    target: "es2022",
  },
  module: { type: "commonjs" },
};

const require = createRequire(process.cwd());
function importUncached(path: string) {
  delete require.cache[require.resolve(path)];
  return require(path);
}

async function loadRaw(name: string): Promise<CommandModule | null> {
  const tsPath = path.join(COMMANDS_DIR, `${name}.ts`);
  const jsPath = path.join(COMMANDS_DIR, `${name}.cjs`);

  try {
    const file = await fs.readFile(tsPath, "utf-8");
    const transformed = await transform(file, swcOptions);
    await fs.writeFile(jsPath, transformed.code, "utf-8");
    const module = await importUncached(jsPath);
    if (!isCommandModule(module)) throw new Error(`${name} does not have a \`execute\` export`);
    await fs.rm(jsPath);

    return module;
  } catch (error) {
    console.error(error);
    return null;
  }
}
