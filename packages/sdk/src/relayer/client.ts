import { SessionAction } from "../signer/action.js";

export interface RelayerClientOptions {
  url: string;
}

export interface ExecuteActionPayload {
  action: SessionAction;
  params: `0x${string}`; // Encoded params for the action
  signature: `0x${string}`; // Signature from the session key
}

export interface RegisterSessionPayload {
  sessionId: string;
  owner: string;
  sessionKey: string;
  validUntil: number;
  gameContract: string;
}

export class RelayerClient {
  private url: string;

  constructor(options: RelayerClientOptions) {
    this.url = options.url.endsWith("/")
      ? options.url.slice(0, -1)
      : options.url;
  }

  async registerSession(
    payload: RegisterSessionPayload,
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.url}/sessions/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to register session");
      }
      return await response.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async revokeSession(
    sessionId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.url}/sessions/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to revoke session");
      }
      return await response.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async getDashboardData(
    sessionId: string,
  ): Promise<{
    session?: any;
    actions?: any[];
    totalActions?: number;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${this.url}/sessions/${sessionId}/dashboard`,
        {
          method: "GET",
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get dashboard data");
      }
      return await response.json();
    } catch (err: any) {
      return { error: err.message };
    }
  }

  async executeAction(
    payload: ExecuteActionPayload,
  ): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
      const response = await fetch(`${this.url}/sessions/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to execute action");
      }

      return await response.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async createSessionOnChain(payload: {
    policy: {
      owner: string;
      sessionKey: string;
      validUntil: number;
      maxCalls: number;
      gameContract: string;
      allowedActions: number;
      token: string;
      maxTokenSpend: string;
      salt: string;
    };
    ownerSignature: `0x${string}`;
  }): Promise<{
    success: boolean;
    sessionId?: string;
    hash?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.url}/sessions/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create session on-chain");
      }
      return await response.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async getSessionNonce(sessionId: string): Promise<number> {
    try {
      const response = await fetch(`${this.url}/sessions/${sessionId}/nonce`, {
        method: "GET",
      });
      if (!response.ok) {
        return 0;
      }
      const data = await response.json();
      return data.nonce ?? 0;
    } catch {
      return 0;
    }
  }
}
