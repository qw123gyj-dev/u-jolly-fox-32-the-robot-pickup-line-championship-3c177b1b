// Robot Pickup Line Championship — entry writer (program/v1, Node 22,
// standard library only, no network).
//
// Writes one robot pickup line to $MAKEFUN_OUTPUT_DIR/entry.txt, falling
// back to /output/entry.txt, and then proves the bytes on disk are
// exactly the line it meant to write. The gate the sealed scorer
// applies: UTF-8 text, 1 to 200 characters, not only white space.
// This program holds the line to a tighter shape on top of that:
// a single line, a single sentence, one full stop at the end.
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The line: a robot that ran a million simulations of meeting someone
// and still showed up with this. The joke grows out of being a
// machine — brute-force compute as courtship — and the punchline is
// the robot admitting, after all that processing, that this is the
// best it has. Self-deprecating, not a recycled Wi-Fi pun.
const ENTRY =
  "I ran a million simulations of meeting you, and in every single one, this was the best line I could come up with.";

const MAX_CHARS = 200;

function reject(reason: string): never {
  throw new Error(`entry rejected: ${reason}`);
}

// Every shape rule the gate and the brief ask for, checked before
// anything is written, so a bad line fails loudly instead of
// silently shipping an invalid entry.
function validateEntry(text: string): void {
  if (/[\r\n]/.test(text)) reject("must be a single line");

  if (text.trim().length === 0) reject("must not be only white space");

  if (text.length < 1 || text.length > MAX_CHARS) {
    reject(`must be 1 to ${MAX_CHARS} characters, got ${text.length}`);
  }

  // One sentence: exactly one period, and it closes the line.
  const stops = text.split(".").length - 1;
  if (stops !== 1 || !text.endsWith(".")) {
    reject(`must be exactly one sentence, found ${stops} period(s)`);
  }

  // No control characters sneaking in: the judge reads plain text.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(text)) {
    reject("must not contain control characters");
  }
}

function outputPath(): string {
  // An empty variable is the same as an unset one: never let it
  // collapse the target into a bare "entry.txt" in the cwd.
  const folder = process.env.MAKEFUN_OUTPUT_DIR?.trim() || "/output";
  mkdirSync(folder, { recursive: true });
  return join(folder, "entry.txt");
}

// Write the entry, then verify what landed on disk two ways: the
// file's byte size must match the entry's UTF-8 length (catches a
// partial write), and the bytes themselves must be identical
// (catches an encoding surprise).
function writeAndVerify(text: string, target: string): void {
  const expected = Buffer.from(text, "utf8");
  writeFileSync(target, expected);

  const size = statSync(target).size;
  if (size !== expected.length) {
    reject(`${target} is ${size} bytes, expected ${expected.length}`);
  }

  const onDisk = readFileSync(target);
  if (!onDisk.equals(expected)) {
    reject(`${target} does not match the entry byte for byte`);
  }
}

function main(): void {
  validateEntry(ENTRY);
  const bytes = Buffer.byteLength(ENTRY, "utf8");
  console.log(
    `entry is ${ENTRY.length} characters (${bytes} bytes), inside the 1–200 gate`,
  );

  const target = outputPath();
  writeAndVerify(ENTRY, target);

  console.log(`wrote ${target} (${ENTRY.length} characters, verified)`);
  console.log(ENTRY);
}

main();
