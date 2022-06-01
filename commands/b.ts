import type { Context, Message } from "../src";

export async function execute(ctx: Context, message: Message) {
  console.log("b", message);
}
