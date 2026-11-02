import { GameId, UserProfile } from '../../types';
import { STORAGE_KEYS } from './storageKeys';
import { StorageVault } from './vault';

export interface GameScoreRecord {
  userId: string;
  userName: string;
  score: number;
}

export const GAME_CP_MULTIPLIERS: Record<GameId, number> = {
  breach_lock: 1.5,
  zero_ms: 2.0,
  cyber_stack: 1.0,
  glitch_flap: 1.2,
  core_injector: 1.8,
  gravity_runner: 1.4,
  chroma_switch: 1.3,
  neural_sequence: 1.5,
  cyber_whack: 1.1,
  orbit_jump: 1.3,
};

export class GameScoreService {
  private gameScores: Record<string, GameScoreRecord>;
  private onQueueChange?: (item: any) => void;

  constructor(onQueueChange?: (item: any) => void) {
    this.onQueueChange = onQueueChange;
    this.gameScores = StorageVault.getItem<Record<string, GameScoreRecord>>(STORAGE_KEYS.GAME_SCORES, {});
  }

  setQueueCallback(cb: (item: any) => void) {
    this.onQueueChange = cb;
  }

  getGameScores(): Record<string, GameScoreRecord> {
    this.gameScores = StorageVault.getItem<Record<string, GameScoreRecord>>(STORAGE_KEYS.GAME_SCORES, {});
    return { ...this.gameScores };
  }

  calculateCp(gameId: GameId, score: number): number {
    const mult = GAME_CP_MULTIPLIERS[gameId] || 1.0;
    return Math.round(score * mult);
  }

  recalculateCrowns(profiles: UserProfile[]): UserProfile[] {
    const crownCounts: Record<string, number> = {};
    for (const record of Object.values(this.gameScores)) {
      if (record && record.userId) {
        crownCounts[record.userId] = (crownCounts[record.userId] || 0) + 1;
      }
    }

    for (const p of profiles) {
      p.crownsCount = crownCounts[p.id] || 0;
      p.totalCp = (p.bankedXp || 0) + p.crownsCount * 500;
    }

    return profiles;
  }

  async submitGameResult(
    userId: string,
    gameId: GameId,
    sessionScore: number,
    multiplier: number,
    profiles: UserProfile[]
  ): Promise<{
    earnedXp: number;
    newHighScore: boolean;
    newCrown: boolean;
    totalCp: number;
    queuedOffline: boolean;
  }> {
    const userIndex = profiles.findIndex((p) => p.id === userId);
    if (userIndex === -1) {
      return { earnedXp: 0, newHighScore: false, newCrown: false, totalCp: 0, queuedOffline: false };
    }

    const earnedXp = Math.round(sessionScore * multiplier);
    profiles[userIndex].bankedXp += earnedXp;

    let newCrown = false;
    const currentRecord = this.gameScores[gameId];
    const prevBestScore = currentRecord?.score || 0;

    if (sessionScore > prevBestScore) {
      this.gameScores[gameId] = {
        userId,
        userName: profiles[userIndex].fullName,
        score: sessionScore,
      };
      this.saveScoresLocally();
      newCrown = true;
    }

    this.recalculateCrowns(profiles);
    StorageVault.setItem(STORAGE_KEYS.PROFILES, profiles);

    const updatedUser = profiles[userIndex];

    if (this.onQueueChange) {
      this.onQueueChange({
        type: 'game_score',
        payload: { userId, gameId, sessionScore, multiplier },
      });
    }

    return {
      earnedXp,
      newHighScore: sessionScore > prevBestScore,
      newCrown,
      totalCp: updatedUser.totalCp,
      queuedOffline: true,
    };
  }

  setScoresFromRemote(remoteScores: Record<string, GameScoreRecord>) {
    this.gameScores = remoteScores;
    this.saveScoresLocally();
  }

  private saveScoresLocally() {
    StorageVault.setItem(STORAGE_KEYS.GAME_SCORES, this.gameScores);
  }
}
