/**
 * Creates a scoped debug logger for a system or module.
 * Toggle DEBUG to false for production builds.
 */
const DEBUG = true;

export function createLogger(scope: string) {
  return (msg: string, ...args: unknown[]) => {
    if (DEBUG) {
      console.log(`[${scope}] ${msg}`, ...args);
    }
  };
}
