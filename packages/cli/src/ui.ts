import pc from 'picocolors';

/** Print the Okapi banner (the mascot glyph reads as a small node-link graph). */
export function banner(version: string): void {
  const mark = pc.magenta('◍━◍');
  console.log(
    `\n  ${mark}  ${pc.bold('Okapi')} ${pc.dim(`v${version}`)}  ${pc.dim('· OKF Knowledge Studio')}\n`,
  );
}
