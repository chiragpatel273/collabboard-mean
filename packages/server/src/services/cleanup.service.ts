import { authService } from "./auth.service";

class CleanupService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  start() {
    if (this.intervalId) {
      console.log("Cleanup service is already running");
      return;
    }

    console.log("Starting automatic token cleanup service (runs every 24 hours)");
    
    // Run initial cleanup
    this.runCleanup();

    // Schedule recurring cleanup
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Stopped automatic token cleanup service");
    }
  }

  private async runCleanup() {
    try {
      console.log("Running token cleanup...");
      const result = await authService.cleanupAllExpiredTokens();
      console.log(`Token cleanup completed: ${result.message}`);
    } catch (error) {
      console.error("Error during token cleanup:", error);
    }
  }

  // Manual cleanup trigger
  async manualCleanup() {
    console.log("Running manual token cleanup...");
    return await authService.cleanupAllExpiredTokens();
  }
}

export const cleanupService = new CleanupService();
