import { EventManager, GameEventType, EffectEvent, CatStateChangedEvent } from './GameEvents';
import { CatManager } from './CatManager';
import { CatId, CatState } from './CatData';
import { ParticleOverlay } from './ui/ParticleOverlay';
import { SoundManager } from './ui/SoundManager';
import { CatDisplay } from './ui/CatDisplay';
import { CharityPanel } from './ui/CharityPanel';
import { CatProfilePopup } from './ui/CatProfilePopup';

export class EffectManager {
    private static _instance: EffectManager | null = null;
    private _particleOverlay: ParticleOverlay | null = null;
    private _catDisplay: CatDisplay | null = null;
    private _charityPanel: CharityPanel | null = null;
    private _catProfilePopup: CatProfilePopup | null = null;

    static get instance(): EffectManager {
        if (!this._instance) {
            this._instance = new EffectManager();
        }
        return this._instance;
    }

    init(): void {
        // 初始化（已在构造函数中注册事件）
    }

    constructor() {
        this._registerEvents();
    }

    set particleOverlay(overlay: ParticleOverlay) {
        this._particleOverlay = overlay;
    }

    set catDisplay(display: CatDisplay) {
        this._catDisplay = display;
    }

    set charityPanel(panel: CharityPanel) {
        this._charityPanel = panel;
    }

    set catProfilePopup(popup: CatProfilePopup) {
        this._catProfilePopup = popup;
    }

    private _registerEvents(): void {
        EventManager.instance.on(GameEventType.EFFECT_PLAY, (data: EffectEvent) => {
            this._playEffect(data);
        });

        EventManager.instance.on(GameEventType.CAT_STATE_CHANGED, (data: CatStateChangedEvent) => {
            this._onStateChanged(data);
        });
    }

    private _playEffect(data: EffectEvent): void {
        const catId = CatManager.instance.currentCatId as CatId;

        switch (data.type) {
            case 'eating':
                this._playEatingEffect(catId);
                break;
            case 'evolution':
                this._playEvolutionEffect(catId);
                break;
            case 'level_up':
                this._playLevelUpEffect(catId);
                break;
            case 'progress_full':
                this._playProgressFullEffect(catId);
                break;
        }
    }

    private _onStateChanged(data: CatStateChangedEvent): void {
        // 状态切换时的轻量特效
        if (data.newState === CatState.EATING && this._catDisplay) {
            this._catDisplay.dropFood(this._getFoodEmoji(), 5);
        }
    }

    private _playEatingEffect(catId: CatId): void {
        if (this._particleOverlay) {
            this._particleOverlay.playCatFoodRain(catId, 4000);
        }
        if (this._catDisplay) {
            this._catDisplay.dropFood(this._getFoodEmoji(), 6);
            this._catDisplay.spawnHearts(4);
        }
        SoundManager.instance.play('eat');
    }

    private _playEvolutionEffect(catId: CatId): void {
        if (this._particleOverlay) {
            this._particleOverlay.playLevelUpFlash(catId, 1200);
            this._particleOverlay.playHeartFloat(8, 50, 40);
        }
        if (this._catDisplay) {
            this._catDisplay.playEvolutionAnimation();
            this._catDisplay.spawnHearts(6);
        }
        SoundManager.instance.play('evolve');

        // 进化时增加公益捐赠
        if (this._charityPanel) {
            this._charityPanel.addDonation(1);
        }
        // 显示公益猫咪档案弹窗
        if (this._catProfilePopup) {
            this._catProfilePopup.show(catId);
        }
    }

    private _playLevelUpEffect(catId: CatId): void {
        SoundManager.instance.play('levelup');
        if (this._particleOverlay) {
            this._particleOverlay.playHeartFloat(5, 50, 35);
        }
    }

    private _playProgressFullEffect(catId: CatId): void {
        if (this._particleOverlay) {
            this._particleOverlay.playGiftReceived(catId);
        }
        SoundManager.instance.play('gift');
    }

    private _getFoodEmoji(): string {
        const foods = ['🐟', '🍖', '🍤', '🥩', '🍗'];
        return foods[Math.floor(Math.random() * foods.length)];
    }
}
