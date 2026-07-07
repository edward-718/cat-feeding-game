export const GameEventType = {
    GIFT_RECEIVED: 'gift_received',
    PROGRESS_CHANGED: 'progress_changed',
    PROGRESS_FULL: 'progress_full',
    CAT_STATE_CHANGED: 'cat_state_changed',
    CAT_SELECTED: 'cat_selected',
    CAT_LEVEL_UP: 'cat_level_up',
    EATING_START: 'eating_start',
    EATING_END: 'eating_end',
    EVOLUTION_START: 'evolution_start',
    EVOLUTION_END: 'evolution_end',
    CONTRIBUTION_BUBBLE: 'contribution_bubble',
    FULL_SCREEN_EFFECT: 'full_screen_effect',
    EFFECT_PLAY: 'effect_play'
} as const;

export type GameEventType = typeof GameEventType[keyof typeof GameEventType];

export interface GiftReceivedEvent {
    giftId: string;
    giftName: string;
    userId: string;
    userName: string;
    progressValue: number;
    catId?: string;
}

export interface ProgressChangedEvent {
    currentProgress: number;
    maxProgress: number;
    percentage: number;
    lastContribution: number;
}

export interface CatStateChangedEvent {
    catId: string;
    oldState: string;
    newState: string;
}

export interface CatSelectedEvent {
    catId: string;
    catName: string;
}

export interface CatLevelUpEvent {
    catId: string;
    oldLevel: number;
    newLevel: number;
    oldStage: number;
    newStage: number;
}

export interface ContributionBubbleEvent {
    userName: string;
    giftName: string;
    progressValue: number;
}

export interface EffectEvent {
    type: 'eating' | 'evolution' | 'level_up' | 'progress_full';
    catId?: string;
}

export type GameEventData =
    | GiftReceivedEvent
    | ProgressChangedEvent
    | CatStateChangedEvent
    | CatSelectedEvent
    | CatLevelUpEvent
    | ContributionBubbleEvent
    | EffectEvent;

export class EventManager {
    private static _instance: EventManager | null = null;
    private _listeners: Map<string, Set<(data: any) => void>> = new Map();

    static get instance(): EventManager {
        if (!this._instance) {
            this._instance = new EventManager();
        }
        return this._instance;
    }

    on(eventType: string, callback: (data: any) => void): void {
        if (!this._listeners.has(eventType)) {
            this._listeners.set(eventType, new Set());
        }
        this._listeners.get(eventType)!.add(callback);
    }

    off(eventType: string, callback: (data: any) => void): void {
        const listeners = this._listeners.get(eventType);
        if (listeners) {
            listeners.delete(callback);
        }
    }

    emit(eventType: string, data?: any): void {
        const listeners = this._listeners.get(eventType);
        if (listeners) {
            for (const callback of listeners) {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`Event listener error for ${eventType}:`, e);
                }
            }
        }
    }

    clearAll(): void {
        this._listeners.clear();
    }
}
