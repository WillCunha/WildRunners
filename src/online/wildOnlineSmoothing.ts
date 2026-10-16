/**
 * Alpha 8 — suavização APENAS visual de posições autoritativas.
 * Nenhum valor deste módulo altera física, resultado ou ranking na AWS.
 * Sem predição/extrapolação: a representação nunca passa do último x recebido.
 */
export type SmoothingPhase = 'waiting' | 'countdown' | 'racing' | 'paused' | 'finished';

export type PositionSample = {
  sessionId: string;
  x: number;
  speed: number;
};

type TrackedPosition = {
  displayedX: number;
  targetX: number;
};

const FOLLOW_TIME_MS = 105;
const MAX_FRAME_MS = 70;
const MIN_SNAP_DISTANCE = 250;

function safePositive(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export class WildPositionSmoother {
  private positions = new Map<string, TrackedPosition>();
  private phase: SmoothingPhase = 'waiting';
  private lastFrameAt: number | null = null;

  reset() {
    this.positions.clear();
    this.phase = 'waiting';
    this.lastFrameAt = null;
  }

  ingest(samples: PositionSample[], phase: SmoothingPhase, forceSnap = false) {
    const phaseChanged = phase !== this.phase;
    this.phase = phase;
    const liveIds = new Set<string>();

    for (const sample of samples) {
      if (!sample.sessionId || !Number.isFinite(sample.x)) continue;
      liveIds.add(sample.sessionId);
      const targetX = safePositive(sample.x);
      const previous = this.positions.get(sample.sessionId);
      const farAway = previous && Math.abs(targetX - previous.displayedX) >
        Math.max(MIN_SNAP_DISTANCE, safePositive(sample.speed) * 0.85);
      const resetDistance = previous && targetX < previous.targetX - 1;
      const shouldSnap = forceSnap || phase !== 'racing' || phaseChanged ||
        !previous || farAway || resetDistance;

      this.positions.set(sample.sessionId, {
        displayedX: shouldSnap ? targetX : previous!.displayedX,
        targetX,
      });
    }

    for (const sessionId of this.positions.keys()) {
      if (!liveIds.has(sessionId)) this.positions.delete(sessionId);
    }

    if (forceSnap || phaseChanged || phase !== 'racing') this.lastFrameAt = null;
  }

  /** Retorna posições visuais; os valores brutos continuam no Schema. */
  frame(nowMs: number): Record<string, number> {
    const now = Number.isFinite(nowMs) ? nowMs : 0;
    const elapsed = this.lastFrameAt === null ? 0 : Math.max(0, Math.min(MAX_FRAME_MS, now - this.lastFrameAt));
    this.lastFrameAt = now;

    if (this.phase === 'racing' && elapsed > 0) {
      const alpha = 1 - Math.exp(-elapsed / FOLLOW_TIME_MS);
      for (const item of this.positions.values()) {
        item.displayedX += (item.targetX - item.displayedX) * alpha;
        if (Math.abs(item.targetX - item.displayedX) < 0.01) item.displayedX = item.targetX;
      }
    }
    const result: Record<string, number> = {};
    for (const [id, item] of this.positions) result[id] = item.displayedX;
    return result;
  }
}
