import dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface Config {
  port: number;
  mongoUri: string;
  jwtSecret: string;
  nodeEnv: string;
  logLevel: string;
  corsOrigin: string;
}

class ConfigService {
  private config: Config;

  constructor() {
    this.config = {
      port: parseInt(process.env.PORT || "5000", 10),
      mongoUri: this.getRequiredEnv("MONGO_URI"),
      jwtSecret: this.getRequiredEnv("JWT_SECRET"),
      nodeEnv: process.env.NODE_ENV || "development",
      logLevel: process.env.LOG_LEVEL || "info",
      corsOrigin: process.env.CORS_ORIGIN || "*"
    };

    this.validateConfig();
  }

  private getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  private validateConfig(): void {
    if (this.config.port < 1 || this.config.port > 65535) {
      throw new Error("Port must be between 1 and 65535");
    }

    if (this.config.jwtSecret.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters long");
    }

    if (!this.config.mongoUri.startsWith("mongodb")) {
      throw new Error("Invalid MongoDB URI format");
    }
  }

  public get(): Config {
    return { ...this.config };
  }

  public isDevelopment(): boolean {
    return this.config.nodeEnv === "development";
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === "production";
  }
}

export const config = new ConfigService().get();
export const configService = new ConfigService();
