/**
 * Minimal structured logger for crawler runtime events.
 */
export class Logger {
  constructor(private readonly verbose: boolean) {}

  info(message: string, context?: Record<string, unknown>): void {
    this.log("INFO", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log("WARN", message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log("ERROR", message, context);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.verbose) {
      return;
    }
    this.log("DEBUG", message, context);
  }

  private log(level: string, message: string, context?: Record<string, unknown>): void {
    const payload = {
      ts: new Date().toISOString(),
      level,
      message,
      ...(context ?? {}),
    };
    // Use one JSON line per event for easy machine parsing.
    process.stdout.write(`${JSON.stringify(payload)}\n`);
  }
}
