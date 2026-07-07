import { GiftConfig, GiftConfigData } from './GiftConfig';
import { CatManager } from './CatManager';
import { ProgressManager } from './ProgressManager';
import { GiftHandler } from './GiftHandler';
import { EventManager, GameEventType } from './GameEvents';
import { StorageManager } from './StorageManager';

export enum GameState {
    INIT = 'init',
    READY = 'ready',
    PLAYING = 'playing',
    PAUSED = 'paused'
}

export class GameManager {
    private static _instance: GameManager | null = null;
    private _gameState: GameState = GameState.INIT;
    private _isInitialized: boolean = false;

    static get instance(): GameManager {
        if (!this._instance) {
            this._instance = new GameManager();
        }
        return this._instance;
    }

    async init(giftConfigData?: GiftConfigData): Promise<void> {
        if (this._isInitialized) {
            console.warn('GameManager 已经初始化过了');
            return;
        }

        console.log('=== 游戏初始化开始 ===');

        if (giftConfigData) {
            GiftConfig.instance.loadConfig(giftConfigData);
        } else {
            await this._loadDefaultConfig();
        }

        StorageManager.instance.init();

        CatManager.instance.init();
        ProgressManager.instance.init();
        GiftHandler.instance.init();

        StorageManager.instance.loadCatData();

        this._registerGameEvents();

        this._gameState = GameState.READY;
        this._isInitialized = true;

        console.log('=== 游戏初始化完成 ===');
        console.log(`当前猫咪: ${CatManager.instance.currentCatInfo?.name}`);
        console.log(`当前等级: Lv.${CatManager.instance.currentCatLevel}`);
        console.log(`进度条: ${ProgressManager.instance.currentProgress}/${ProgressManager.instance.maxProgress}`);
    }

    private async _loadDefaultConfig(): Promise<void> {
        try {
            const response = await fetch('settings/gift-config.json');
            if (response.ok) {
                const configData = await response.json();
                GiftConfig.instance.loadConfig(configData);
                console.log('已加载默认礼物配置');
            } else {
                console.warn('无法加载礼物配置文件，使用内置默认配置');
                this._loadFallbackConfig();
            }
        } catch (e) {
            console.warn('加载礼物配置失败，使用内置默认配置:', e);
            this._loadFallbackConfig();
        }
    }

    private _loadFallbackConfig(): void {
        const fallbackConfig: GiftConfigData = {
            gifts: [
                { id: 'fairy_wand', name: '仙女棒', price: 1, function: 'feed' as any, progressValue: 5, catId: null },
                { id: 'lollipop', name: '棒棒糖', price: 1, function: 'select_feed' as any, progressValue: 5, catId: 'pixel_cat' },
                { id: 'big_beer', name: '大啤酒', price: 1, function: 'feed' as any, progressValue: 5, catId: null },
                { id: 'popularity_ticket', name: '人气票', price: 1, function: 'feed' as any, progressValue: 5, catId: null },
                { id: 'fairy_wand_bouquet', name: '仙女棒花束', price: 10, function: 'feed' as any, progressValue: 40, catId: null },
                { id: 'power_pill', name: '能力药丸', price: 10, function: 'select_feed' as any, progressValue: 40, catId: 'cyber_cat' },
                { id: 'donut', name: '甜甜圈', price: 52, function: 'select_feed' as any, progressValue: 180, catId: 'pitiful_cat' },
                { id: 'confetti_cannon', name: '礼花筒', price: 99, function: 'feed' as any, progressValue: 320, catId: null }
            ],
            maxProgress: 1000,
            excitedTimeout: 5000
        };
        GiftConfig.instance.loadConfig(fallbackConfig);
    }

    private _registerGameEvents(): void {
        EventManager.instance.on(GameEventType.PROGRESS_FULL, (data: any) => {
            this._onProgressFull(data);
        });

        EventManager.instance.on(GameEventType.EATING_END, () => {
            this._onEatingEnd();
        });

        EventManager.instance.on(GameEventType.CAT_LEVEL_UP, (data: any) => {
            StorageManager.instance.saveCatData();
        });

        EventManager.instance.on(GameEventType.CAT_SELECTED, () => {
            StorageManager.instance.saveSelectedCat();
        });
    }

    private _onProgressFull(data: { progressValue: number }): void {
        console.log('GameManager: 进度条已满，开始喂食');
        EventManager.instance.emit(GameEventType.EFFECT_PLAY, { type: 'eating' });
        CatManager.instance.triggerEating(data.progressValue);
    }

    private _onEatingEnd(): void {
        console.log('GameManager: 喂食结束，重置进度条');
        ProgressManager.instance.resetProgress();
    }

    startGame(): void {
        if (!this._isInitialized) {
            console.error('游戏未初始化，无法开始');
            return;
        }
        this._gameState = GameState.PLAYING;
        console.log('游戏开始！');
    }

    pauseGame(): void {
        if (this._gameState === GameState.PLAYING) {
            this._gameState = GameState.PAUSED;
            console.log('游戏暂停');
        }
    }

    resumeGame(): void {
        if (this._gameState === GameState.PAUSED) {
            this._gameState = GameState.PLAYING;
            console.log('游戏继续');
        }
    }

    get gameState(): GameState {
        return this._gameState;
    }

    get isInitialized(): boolean {
        return this._isInitialized;
    }

    selectCat(catId: string): void {
        const { CatId } = require('./CatData');
        CatManager.instance.selectCat(catId as any);
    }

    resetGame(): void {
        CatManager.instance.reset();
        ProgressManager.instance.resetProgress();
        GiftHandler.instance.reset();
        GiftHandler.instance.init();
        StorageManager.instance.clearAll();
        this._gameState = GameState.READY;
        console.log('游戏已重置');
    }

    simulateGift(giftName: string, userName: string = '测试用户', count: number = 1): void {
        if (this._gameState !== GameState.PLAYING && this._gameState !== GameState.READY) {
            console.warn('游戏未在运行状态');
            return;
        }
        GiftHandler.instance.simulateGiftByName(giftName, userName, count);
    }

    getGameInfo(): {
        state: GameState;
        currentCat: string;
        currentLevel: number;
        currentExp: number;
        progress: number;
        maxProgress: number;
        catState: string;
    } {
        return {
            state: this._gameState,
            currentCat: CatManager.instance.currentCatInfo?.name ?? '未知',
            currentLevel: CatManager.instance.currentCatLevel,
            currentExp: CatManager.instance.currentCatExp,
            progress: ProgressManager.instance.currentProgress,
            maxProgress: ProgressManager.instance.maxProgress,
            catState: CatManager.instance.currentCatState
        };
    }
}
