import { JsonSurvey } from "../survey/survey-file-schema";
import { structuredCloneMethod } from "../utils";

export interface UndoRedoConfig {
  maxTotalMemoryMB: number;
  minHistorySize: number;
  maxHistorySize: number;
}

interface HistoryEntry {
  survey: JsonSurvey;
  timestamp: number;
  description: string;
  memorySize: number;
}

// Memory calculation utilities
class MemoryCalculator {
  private static encoder = new TextEncoder();

  static calculateSize(obj: object): number {
    const jsonString = JSON.stringify(obj);
    return this.encoder.encode(jsonString).length;
  }

  static formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}


export class SurveyEditorUndoRedo {
  private history: HistoryEntry[] = [];
  private currentIndex: number = -1;
  private _config: UndoRedoConfig;

  constructor(initialSurvey: JsonSurvey, config: Partial<UndoRedoConfig> = {}) {
    this._config = {
      maxTotalMemoryMB: 50,
      minHistorySize: 10,
      maxHistorySize: 200,
      ...config
    };

    this.saveSnapshot(initialSurvey, 'Initial state');
  }


  private saveSnapshot(survey: JsonSurvey, description: string): void {
    const memorySize = MemoryCalculator.calculateSize(survey);

    // Remove any history after current index
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new snapshot
    this.history.push({
      survey: structuredCloneMethod(survey),
      timestamp: Date.now(),
      description,
      memorySize
    });

    this.currentIndex++;

    // Clean up history based on memory usage
    this.cleanupHistory();
  }

  private cleanupHistory(): void {
    let totalMemory = this.getTotalMemoryUsage();
    const maxMemoryBytes = this._config.maxTotalMemoryMB * 1024 * 1024;

    // Remove oldest snapshots while preserving minimum
    while (this.history.length > this._config.minHistorySize &&
      (totalMemory > maxMemoryBytes || this.history.length > this._config.maxHistorySize)) {

      const removedSnapshot = this.history.shift();
      this.currentIndex--;

      if (removedSnapshot) {
        totalMemory -= removedSnapshot.memorySize;
      }
    }
  }

  private getTotalMemoryUsage(): number {
    return this.history.reduce((total, entry) => total + entry.memorySize, 0);
  }

  // Commit a change to history
  commit(survey: JsonSurvey, description: string): void {
    this.saveSnapshot(survey, description);
  }

  // Get current committed state
  getCurrentState(): JsonSurvey {
    if (this.currentIndex < 0 || this.currentIndex >= this.history.length) {
      throw new Error('Invalid history state');
    }
    return structuredCloneMethod(this.history[this.currentIndex].survey);
  }

  undo(): JsonSurvey | null {
    if (!this.canUndo()) return null;

    this.currentIndex--;
    return this.getCurrentState();
  }

  redo(): JsonSurvey | null {
    if (!this.canRedo()) return null;

    this.currentIndex++;
    return this.getCurrentState();
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  getUndoDescription(): string | null {
    if (!this.canUndo()) return null;
    return this.history[this.currentIndex].description;
  }

  getRedoDescription(): string | null {
    if (!this.canRedo()) return null;
    return this.history[this.currentIndex + 1].description;
  }

  getMemoryUsage(): { totalMB: number; entries: number } {
    return {
      totalMB: this.getTotalMemoryUsage() / (1024 * 1024),
      entries: this.history.length
    };
  }

  getConfig(): UndoRedoConfig {
    return { ...this._config };
  }

  /**
   * Get the full history list with metadata
   */
  getHistory(): Array<{
    index: number;
    description: string;
    timestamp: number;
    memorySize: number;
    isCurrent: boolean;
  }> {
    return this.history.map((entry, index) => ({
      index,
      description: entry.description,
      timestamp: entry.timestamp,
      memorySize: entry.memorySize,
      isCurrent: index === this.currentIndex
    }));
  }

  /**
   * Get the current index in the history
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Get the total number of history entries
   */
  getHistoryLength(): number {
    return this.history.length;
  }

  /**
   * Jump to a specific index in the history (can go forward or backward)
   * @param targetIndex The index to jump to
   * @returns The survey state at the target index, or null if invalid
   */
  jumpToIndex(targetIndex: number): JsonSurvey | null {
    if (targetIndex < 0 || targetIndex >= this.history.length || targetIndex === this.currentIndex) {
      return null;
    }

    this.currentIndex = targetIndex;
    return this.getCurrentState();
  }

  /**
   * Check if we can jump to a specific index
   */
  canJumpToIndex(targetIndex: number): boolean {
    return targetIndex >= 0 && targetIndex < this.history.length && targetIndex !== this.currentIndex;
  }

}
