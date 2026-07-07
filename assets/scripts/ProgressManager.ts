import { GiftConfig } from './GiftConfig';
import { EventManager, GameEventType, ProgressChangedEvent } from './GameEvents';

export class ProgressManager {
    private static _instance: ProgressManager | null = null;
    private _currentProgress: number = 0;
    private _lastContribution: number = 0;
    private _isFull: boolean = false;

    static get instance(): ProgressManager {
        if (!this._instance) {
            this._instance = new ProgressManager();
        }
        return this._instance;
    }

    init(): void {
        this._currentProgress = 0;
        this._lastContribution = 0;
        this._isFull = false;
    }

    get currentProgress(): number {
        return this._currentProgress;
    }

    get maxProgress(): number {
        return GiftConfig.instance.maxProgress;
    }

    get percentage(): number {
        return Math.min(100, (this._currentProgress / this.maxProgress) * 100);
    }

    get isFull(): boolean {
        return this._isFull;
    }

    get lastContribution(): number {
        return this._lastContribution;
    }

    get isNearFull(): boolean {
        return this.percentage >= 80;
    }

    addProgress(value: number): number {
        if (this._isFull) {
            return 0;
        }

        const oldProgress = this._currentProgress;
        this._currentProgress = Math.min(this._currentProgress + value, this.maxProgress);
        this._lastContribution = value;

        const actualAdded = this._currentProgress - oldProgress;

        const event: ProgressChangedEvent = {
            currentProgress: this._currentProgress,
            maxProgress: this.maxProgress,
            percentage: this.percentage,
            lastContribution: actualAdded
        };
        EventManager.instance.emit(GameEventType.PROGRESS_CHANGED, event);

        if (this._currentProgress >= this.maxProgress && !this._isFull) {
            this._isFull = true;
            EventManager.instance.emit(GameEventType.PROGRESS_FULL, {
                progressValue: this._currentProgress
            });
            console.log('进度条已满！触发喂食动画');
        }

        console.log(`进度: ${oldProgress} -> ${this._currentProgress} / ${this.maxProgress} (${this.percentage.toFixed(1)}%)`);

        return actualAdded;
    }

    resetProgress(): void {
        this._currentProgress = 0;
        this._lastContribution = 0;
        this._isFull = false;

        const event: ProgressChangedEvent = {
            currentProgress: 0,
            maxProgress: this.maxProgress,
            percentage: 0,
            lastContribution: 0
        };
        EventManager.instance.emit(GameEventType.PROGRESS_CHANGED, event);

        console.log('进度条已重置');
    }

    setProgress(value: number): void {
        this._currentProgress = Math.max(0, Math.min(value, this.maxProgress));
        this._isFull = this._currentProgress >= this.maxProgress;

        const event: ProgressChangedEvent = {
            currentProgress: this._currentProgress,
            maxProgress: this.maxProgress,
            percentage: this.percentage,
            lastContribution: 0
        };
        EventManager.instance.emit(GameEventType.PROGRESS_CHANGED, event);
    }

    getProgressForDisplay(): { current: number; max: number; percentage: number; isNearFull: boolean; isFull: boolean } {
        return {
            current: this._currentProgress,
            max: this.maxProgress,
            percentage: this.percentage,
            isNearFull: this.isNearFull,
            isFull: this._isFull
        };
    }
}
