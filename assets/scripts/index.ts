import { GameManager, GameState } from './GameManager';
import { EffectManager } from './EffectManager';
import { CatManager } from './CatManager';
import { ProgressManager } from './ProgressManager';
import { EventManager, GameEventType, ProgressChangedEvent } from './GameEvents';
import { CatState, CatId } from './CatData';
import { ProgressBar } from './ui/ProgressBar';
import { CatInfoPanel } from './ui/CatInfoPanel';
import { ContributionBubble } from './ui/ContributionBubble';
import { CatDisplay } from './ui/CatDisplay';
import { ParticleOverlay } from './ui/ParticleOverlay';
import { SoundManager } from './ui/SoundManager';
import { CharityPanel } from './ui/CharityPanel';
import { CatProfilePopup } from './ui/CatProfilePopup';
import { GiftConfigData } from './GiftConfig';

export class GameApp {
    private static _instance: GameApp | null = null;
    private _progressBar: ProgressBar | null = null;
    private _catInfoPanel: CatInfoPanel | null = null;
    private _contributionBubble: ContributionBubble | null = null;
    private _catDisplay: CatDisplay | null = null;
    private _particleOverlay: ParticleOverlay | null = null;
    private _charityPanel: CharityPanel | null = null;
    private _catProfilePopup: CatProfilePopup | null = null;
    private _tipElement: HTMLElement | null = null;
    private _controlPanel: HTMLElement | null = null;
    private _isRunning: boolean = false;
    private _isDebug: boolean = true;

    static get instance(): GameApp {
        if (!this._instance) {
            this._instance = new GameApp();
        }
        return this._instance;
    }

    async init(configData?: GiftConfigData): Promise<void> {
        console.log('=== 喵星食堂 Demo启动 ===');

        await GameManager.instance.init(configData);
        EffectManager.instance.init();
        SoundManager.instance.init();

        this._createUI();
        this._setupEffectManager();
        this._registerKeyboardShortcuts();
        this._registerEvents();

        // 创建公益猫咪档案弹窗
        this._catProfilePopup = new CatProfilePopup('game-container');
        EffectManager.instance.catProfilePopup = this._catProfilePopup;

        this._isRunning = true;
        GameManager.instance.startGame();

        console.log('=== 启动完成 ===');
        console.log('键盘快捷键: 1-8 送礼 | C 帅猫 | P 可怜猫 | X 淘气猫 | R 重置 | F 满进度 | M 静音');
    }

    private _createUI(): void {
        const container = document.getElementById('game-container');
        if (!container) {
            console.error('找不到 game-container');
            return;
        }

        // === 猫咪展示区（SVG） ===
        const catDisplayContainer = document.createElement('div');
        catDisplayContainer.id = 'cat-display-container';
        catDisplayContainer.style.cssText = 'position: absolute; top: 42%; left: 50%; transform: translate(-50%, -50%); width: 220px; height: 220px; z-index: 10;';
        container.appendChild(catDisplayContainer);

        this._catDisplay = new CatDisplay('cat-display-container');
        this._catDisplay.renderCat(CatManager.instance.currentCatId as CatId);

        // === 粒子特效层 ===
        this._particleOverlay = new ParticleOverlay('game-container');

        // === 公益面板 ===
        this._charityPanel = new CharityPanel('game-container');

        // === 信息面板 ===
        const catInfoContainer = document.createElement('div');
        catInfoContainer.id = 'cat-info-container';
        catInfoContainer.style.cssText = 'position: absolute; top: 20px; left: 50%; transform: translateX(-50%); width: 340px; max-width: 90vw; z-index: 50;';
        container.appendChild(catInfoContainer);

        this._catInfoPanel = new CatInfoPanel('cat-info-container');
        this._catInfoPanel.onCatSelected = (catId: string) => {
            this._selectCat(catId as CatId);
        };

        // === 进度条 ===
        const progressContainer = document.createElement('div');
        progressContainer.id = 'progress-container';
        progressContainer.style.cssText = 'position: absolute; bottom: 160px; left: 50%; transform: translateX(-50%); width: 85%; max-width: 520px; z-index: 50;';
        container.appendChild(progressContainer);

        this._progressBar = new ProgressBar('progress-container');

        // === 贡献气泡 ===
        this._contributionBubble = new ContributionBubble('game-container');

        // === 提示文字 ===
        this._tipElement = document.createElement('div');
        this._tipElement.className = 'game-tips';
        this._tipElement.innerHTML = `
            <div>🎁 <span style="color:#00ffff">能力药丸</span>→帅猫 | <span style="color:#ffb6c1">甜甜圈</span>→可怜猫 | <span style="color:#00ff00">棒棒糖</span>→淘气猫</div>
            <div style="margin-top:5px;opacity:0.7;">送任何礼物都能涨进度条哦~ | 按 M 静音</div>
        `;
        container.appendChild(this._tipElement);

        // === 调试控制面板 ===
        if (this._isDebug) {
            this._createDebugControls();
        }
    }

    private _setupEffectManager(): void {
        EffectManager.instance.particleOverlay = this._particleOverlay!;
        EffectManager.instance.catDisplay = this._catDisplay!;
        EffectManager.instance.charityPanel = this._charityPanel!;
    }

    private _registerEvents(): void {
        // EAGER状态检测：进度>80%且IDLE时自动切换
        EventManager.instance.on(GameEventType.PROGRESS_CHANGED, (data: ProgressChangedEvent) => {
            const state = CatManager.instance.currentCatState;
            if (data.percentage >= 80 && state === CatState.IDLE) {
                CatManager.instance.changeState(CatState.EAGER);
            } else if (data.percentage < 80 && state === CatState.EAGER) {
                CatManager.instance.changeState(CatState.IDLE);
            }
        });

        // 进度满时播放特效和音效
        EventManager.instance.on(GameEventType.PROGRESS_FULL, () => {
            const catId = CatManager.instance.currentCatId as CatId;
            SoundManager.instance.play('gift');
            if (this._particleOverlay) {
                this._particleOverlay.playGiftReceived(catId);
            }
        });

        // 收到礼物时的爱心特效
        EventManager.instance.on(GameEventType.GIFT_RECEIVED, () => {
            const catId = CatManager.instance.currentCatId as CatId;
            if (this._particleOverlay) {
                this._particleOverlay.playGiftReceived(catId);
            }
        });
    }

    private _selectCat(catId: CatId): void {
        GameManager.instance.selectCat(catId);
        if (this._catDisplay) {
            this._catDisplay.renderCat(catId);
        }
    }

    private _registerKeyboardShortcuts(): void {
        const giftMap: Record<string, string> = {
            '1': '仙女棒',
            '2': '棒棒糖',
            '3': '大啤酒',
            '4': '人气票',
            '5': '仙女棒花束',
            '6': '能力药丸',
            '7': '甜甜圈',
            '8': '礼花筒',
        };

        document.addEventListener('keydown', (e) => {
            const key = e.key;

            // 1-8 送礼物
            if (giftMap[key]) {
                e.preventDefault();
                this.simulateGift(giftMap[key]);
                return;
            }

            switch (key.toLowerCase()) {
                case 'c':
                    e.preventDefault();
                    this._selectCat(CatId.CYBER_CAT);
                    break;
                case 'p':
                    e.preventDefault();
                    this._selectCat(CatId.PITIFUL_CAT);
                    break;
                case 'x':
                    e.preventDefault();
                    this._selectCat(CatId.PIXEL_CAT);
                    break;
                case 'r':
                    e.preventDefault();
                    this.resetGame();
                    break;
                case 'f':
                    e.preventDefault();
                    // 快速填满进度条
                    ProgressManager.instance.addProgress(1000);
                    break;
                case 'm':
                    e.preventDefault();
                    SoundManager.instance.toggleMute();
                    break;
            }
        });
    }

    private _createDebugControls(): void {
        const container = document.getElementById('game-container');
        if (!container) return;

        this._controlPanel = document.createElement('div');
        this._controlPanel.className = 'debug-controls';

        const title = document.createElement('div');
        title.className = 'debug-title';
        title.textContent = '🎮 测试控制面板';
        this._controlPanel.appendChild(title);

        // === 一键高潮大按钮 ===
        const showcaseBtn = document.createElement('button');
        showcaseBtn.className = 'debug-reset';
        showcaseBtn.style.cssText = `
            display: block;
            width: 100%;
            margin: 0 0 10px 0;
            padding: 10px 16px;
            border: none;
            border-radius: 10px;
            background: linear-gradient(135deg, #ff6b6b, #ff6b9d);
            color: white;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            box-shadow: 0 4px 15px rgba(255,107,107,0.4);
            transition: transform 0.2s ease;
        `;
        showcaseBtn.textContent = '🎬 看高潮演示';
        showcaseBtn.addEventListener('mouseenter', () => {
            showcaseBtn.style.transform = 'scale(1.03)';
        });
        showcaseBtn.addEventListener('mouseleave', () => {
            showcaseBtn.style.transform = 'scale(1)';
        });
        showcaseBtn.addEventListener('click', () => {
            this._playShowcase();
        });
        this._controlPanel.appendChild(showcaseBtn);

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'debug-buttons';

        const gifts = [
            { name: '仙女棒', color: '#ff6b6b' },
            { name: '棒棒糖', color: '#00ff00' },
            { name: '大啤酒', color: '#feca57' },
            { name: '人气票', color: '#48dbfb' },
            { name: '仙女棒花束', color: '#ff9ff3' },
            { name: '能力药丸', color: '#00ffff' },
            { name: '甜甜圈', color: '#ffb6c1' },
            { name: '礼花筒', color: '#ffd700' }
        ];

        for (const gift of gifts) {
            const btn = document.createElement('button');
            btn.className = 'debug-btn';
            btn.textContent = gift.name;
            btn.style.background = gift.color;
            btn.addEventListener('click', () => {
                this.simulateGift(gift.name);
            });
            buttonContainer.appendChild(btn);
        }

        this._controlPanel.appendChild(buttonContainer);

        const resetBtn = document.createElement('button');
        resetBtn.className = 'debug-reset';
        resetBtn.textContent = '🔄 重置游戏';
        resetBtn.addEventListener('click', () => {
            this.resetGame();
        });
        this._controlPanel.appendChild(resetBtn);

        container.appendChild(this._controlPanel);
    }

    /**
     * 自动播放高潮演示：送礼→进度80%→EAGER→满值→eating→进化→重置
     */
    private _playShowcase(): void {
        if (!this._isRunning) return;

        console.log('🎬 开始高潮演示...');
        this.resetGame();

        // 选择可怜猫进行演示（视觉对比最强烈）
        this._selectCat(CatId.PITIFUL_CAT);

        const stepDelay = 600; // 每步间隔

        // Step 1: 送小礼物让进度涨到80%
        setTimeout(() => {
            this.simulateGift('甜甜圈');
        }, stepDelay);

        setTimeout(() => {
            this.simulateGift('甜甜圈');
        }, stepDelay * 2);

        setTimeout(() => {
            this.simulateGift('人气票');
        }, stepDelay * 3);

        // Step 2: 继续送礼冲到100%
        setTimeout(() => {
            this.simulateGift('礼花筒');
        }, stepDelay * 4);

        // Step 3: 等待eating结束后，再送一轮触发升级
        setTimeout(() => {
            // eating动画约4秒，evolved约3秒，等待后送大礼触发升级
            this.simulateGift('能力药丸');
        }, stepDelay * 4 + 8500);

        setTimeout(() => {
            this.simulateGift('礼花筒');
        }, stepDelay * 4 + 9500);

        console.log('🎬 高潮演示序列已启动，约10秒后完成');
    }

    simulateGift(giftName: string, userName: string = '测试用户'): void {
        if (!this._isRunning) return;
        GameManager.instance.simulateGift(giftName, userName);
    }

    resetGame(): void {
        GameManager.instance.resetGame();
        GameManager.instance.startGame();
        if (this._catDisplay) {
            this._catDisplay.renderCat(CatManager.instance.currentCatId as CatId);
        }
        if (this._particleOverlay) {
            this._particleOverlay.clearAll();
        }
        if (this._charityPanel) {
            this._charityPanel.reset();
        }
        console.log('游戏已重置');
    }

    get isRunning(): boolean {
        return this._isRunning;
    }
}

// ===== 入口 =====
if (typeof window !== 'undefined') {
    (window as any).GameApp = GameApp;
    (window as any).GameManager = GameManager;

    window.addEventListener('DOMContentLoaded', async () => {
        try {
            await GameApp.instance.init();
        } catch (e) {
            console.error('游戏初始化失败:', e);
        }
    });
}

export { GameManager, GameState };
