// LeicaSessionManager.ts
// Session-based capture for Leica DISTO measurements

export interface LeicaMeasurement {
  value: number;
  timestamp: string;
  roomId?: string;
}

export interface LeicaSession {
  id: string;
  roomId: string;
  measurements: LeicaMeasurement[];
  startedAt: string;
  endedAt?: string;
}

export class LeicaSessionManager {
  private sessions: LeicaSession[] = [];
  private currentSession: LeicaSession | null = null;

  startSession(roomId: string) {
    this.currentSession = {
      id: `${roomId}-${Date.now()}`,
      roomId,
      measurements: [],
      startedAt: new Date().toISOString(),
    };
    this.sessions.push(this.currentSession);
  }

  addMeasurement(value: number) {
    if (!this.currentSession) throw new Error('No active session');
    this.currentSession.measurements.push({
      value,
      timestamp: new Date().toISOString(),
      roomId: this.currentSession.roomId,
    });
  }

  endSession() {
    if (this.currentSession) {
      this.currentSession.endedAt = new Date().toISOString();
      this.currentSession = null;
    }
  }

  getSessions() {
    return this.sessions;
  }

  getCurrentSession() {
    return this.currentSession;
  }
}
