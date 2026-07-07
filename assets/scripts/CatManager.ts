import { 
    CatState, 
    CatId, 
    CatInfo, 
    CAT_LIST, 
    EvolutionStage,
    getEvolutionStage,
    calculateExpGain,
    LEVEL_THRESHOLDS
} from './CatData';
import { EventManager, GameEventType, CatLevelUpEvent, CatStateChangedEvent, CatSelectedEvent } from './GameEvents';
import { GiftConfig } from './GiftConfig';

export class CatManager {
    private static _instance: CatManager | null = null;
    private _currentCatId: CatId = CatId.PITIFUL_CAT;
    private _catStates: Map<CatId, { level: number; exp: number; state: CatState }> = new Map();
    private _excitedTimer: number | null = null;
    private _eatingTimer: number | null = null;
    private _evolutionTimer: number | null = null;

    static get instance(): CatManager {
        if (!this._instance) {
            this._instance = new CatManager();
        }
        return this._instance;
    }

    init(): void {
        for (const cat of CAT_LIST) {
            this._catStates.set(cat.id, {
                level: cat.defaultLevel,
                exp: 0,
                state: CatState.IDLE
            });
        }
        this._currentCatId = CatId.PITIFUL_CAT;
    }

    get currentCatId(): CatId {
        return this._currentCatId;
    }

    get currentCatInfo(): CatInfo | undefined {
        return CAT_LIST.find(c => c.id === this._currentCatId);
    }

    get currentCatState(): CatState {
        const state = this._catStates.get(this._currentCatId);
        return state?.state ?? CatState.IDLE;
    }

    get currentCatLevel(): number {
        const state = this._catStates.get(this._currentCatId);
        return state?.level ?? 1;
    }

    get currentCatExp(): number {
        const state = this._catStates.get(this._currentCatId);
        return state?.exp ?? 0;
    }

    get currentEvolutionStage(): EvolutionStage {
        return getEvolutionStage(this.currentCatLevel);
    }

    getCatLevel(catId: CatId): number {
        const state = this._catStates.get(catId);
        return state?.level ?? 1;
    }

    getCatExp(catId: CatId): number {
        const state = this._catStates.get(catId);
        return state?.exp ?? 0;
    }

    getCatState(catId: CatId): CatState {
        const state = this._catStates.get(catId);
        return state?.state ?? CatState.IDLE;
    }

    selectCat(catId: CatId): void {
        if (catId === this._currentCatId) {
            return;
        }

        const oldCatId = this._currentCatId;
        this._currentCatId = catId;

        const catInfo = CAT_LIST.find(c => c.id === catId);
        if (catInfo) {
            const event: CatSelectedEvent = {
                catId: catId,
                catName: catInfo.name
            };
            EventManager.instance.emit(GameEventType.CAT_SELECTED, event);
        }

        console.log(`切换猫咪: ${oldCatId} -> ${catId}`);
    }

    selectCatByGiftId(giftId: string): boolean {
        const cat = CAT_LIST.find(c => c.selectGiftId === giftId);
        if (cat) {
            this.selectCat(cat.id);
            return true;
        }
        return false;
    }

    triggerExcited(): void {
        const currentState = this.currentCatState;
        
        if (currentState === CatState.EATING || currentState === CatState.EVOLVED) {
            return;
        }

        if (currentState !== CatState.EXCITED) {
            this._changeState(CatState.EXCITED);
        }

        this._resetExcitedTimer();
    }

    private _resetExcitedTimer(): void {
        if (this._excitedTimer !== null) {
            clearTimeout(this._excitedTimer);
        }

        const timeout = GiftConfig.instance.excitedTimeout;
        this._excitedTimer = window.setTimeout(() => {
            if (this.currentCatState === CatState.EXCITED) {
                this._changeState(CatState.IDLE);
            }
            this._excitedTimer = null;
        }, timeout);
    }

    triggerEating(progressValue: number): void {
        if (this.currentCatState === CatState.EATING || this.currentCatState === CatState.EVOLVED) {
            return;
        }

        this._changeState(CatState.EATING);
        EventManager.instance.emit(GameEventType.EATING_START);

        const expGain = calculateExpGain(progressValue);
        this._addExp(expGain);

        const eatingDuration = 4000;
        this._eatingTimer = window.setTimeout(() => {
            this._onEatingEnd();
            this._eatingTimer = null;
        }, eatingDuration);
    }

    private _onEatingEnd(): void {
        EventManager.instance.emit(GameEventType.EATING_END);

        const leveledUp = this._checkLevelUp();
        
        if (leveledUp) {
            this._playEvolution();
        } else {
            this._changeState(CatState.IDLE);
        }
    }

    private _playEvolution(): void {
        this._changeState(CatState.EVOLVED);
        EventManager.instance.emit(GameEventType.EFFECT_PLAY, { type: 'evolution' });
        EventManager.instance.emit(GameEventType.EVOLUTION_START);

        const evolutionDuration = 3000;
        this._evolutionTimer = window.setTimeout(() => {
            EventManager.instance.emit(GameEventType.EVOLUTION_END);
            this._changeState(CatState.IDLE);
            this._evolutionTimer = null;
        }, evolutionDuration);
    }

    changeState(newState: CatState): void {
        this._changeState(newState);
    }

    private _changeState(newState: CatState): void {
        const oldState = this.currentCatState;
        if (oldState === newState) {
            return;
        }

        const catState = this._catStates.get(this._currentCatId);
        if (catState) {
            catState.state = newState;
        }

        const event: CatStateChangedEvent = {
            catId: this._currentCatId,
            oldState: oldState,
            newState: newState
        };
        EventManager.instance.emit(GameEventType.CAT_STATE_CHANGED, event);

        console.log(`猫咪状态变化: ${oldState} -> ${newState}`);
    }

    private _addExp(exp: number): void {
        const catState = this._catStates.get(this._currentCatId);
        if (!catState) return;

        catState.exp += exp;
        console.log(`获得经验: +${exp}, 当前经验: ${catState.exp}`);
    }

    private _checkLevelUp(): boolean {
        const catState = this._catStates.get(this._currentCatId);
        if (!catState) return false;

        const levels = Object.keys(LEVEL_THRESHOLDS)
            .map(Number)
            .sort((a, b) => a - b);

        let newLevel = catState.level;
        for (const level of levels) {
            if (catState.exp >= LEVEL_THRESHOLDS[level] && level > catState.level) {
                newLevel = level;
            }
        }

        if (newLevel > catState.level) {
            const oldLevel = catState.level;
            const oldStage = getEvolutionStage(oldLevel);
            catState.level = newLevel;
            const newStage = getEvolutionStage(newLevel);

            const event: CatLevelUpEvent = {
                catId: this._currentCatId,
                oldLevel: oldLevel,
                newLevel: newLevel,
                oldStage: oldStage,
                newStage: newStage
            };
            EventManager.instance.emit(GameEventType.CAT_LEVEL_UP, event);

            console.log(`猫咪升级: Lv.${oldLevel} -> Lv.${newLevel}`);
            
            return newStage > oldStage;
        }

        return false;
    }

    setCatLevel(catId: CatId, level: number, exp: number): void {
        const catState = this._catStates.get(catId);
        if (catState) {
            catState.level = level;
            catState.exp = exp;
        }
    }

    getAllCatStates(): Map<CatId, { level: number; exp: number; state: CatState }> {
        return new Map(this._catStates);
    }

    reset(): void {
        if (this._excitedTimer !== null) {
            clearTimeout(this._excitedTimer);
            this._excitedTimer = null;
        }
        if (this._eatingTimer !== null) {
            clearTimeout(this._eatingTimer);
            this._eatingTimer = null;
        }
        if (this._evolutionTimer !== null) {
            clearTimeout(this._evolutionTimer);
            this._evolutionTimer = null;
        }
        this.init();
    }
}
