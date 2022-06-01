import type { Context, Message } from "../src";
import * as fs from "fs";
import { transform } from "@swc/core";

export async function execute(ctx: Context, message: Message) {
  console.log("a", message, fs, transform);
}
