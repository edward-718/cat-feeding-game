import { EventManager, GameEventType, CatStateChangedEvent, CatSelectedEvent, CatLevelUpEvent } from '../GameEvents';
import { CatManager } from '../CatManager';
import { CatState, CatId, getEvolutionStage, LEVEL_THRESHOLDS } from '../CatData';

export class CatInfoPanel {
    private _element: HTMLElement | null = null;
    private _catNameElement: HTMLElement | null = null;
    private _levelElement: HTMLElement | null = null;
    private _stateElement: HTMLElement | null = null;
    private _expBarElement: HTMLElement | null = null;
    private _expFillElement: HTMLElement | null = null;
    private _catIndicatorContainer: HTMLElement | null = null;
    private _catIndicators: Map<string, HTMLElement> = new Map();
    private _onCatSelected?: (catId: string) => void;

    constructor(containerId?: string) {
        if (containerId) {
            this.createInContainer(containerId);
        }
    }

    set onCatSelected(callback: (catId: string) => void) {
        this._onCatSelected = callback;
    }

    createInContainer(containerId: string): void {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`找不到容器: ${containerId}`);
            return;
        }

        this._element = document.createElement('div');
        this._element.className = 'cat-info-panel';

        this._catIndicatorContainer = document.createElement('div');
        this._catIndicatorContainer.className = 'cat-indicators';
        this._createCatIndicators();
        this._element.appendChild(this._catIndicatorContainer);

        const nameRow = document.createElement('div');
        nameRow.className = 'cat-name-row';

        this._catNameElement = document.createElement('span');
        this._catNameElement.className = 'cat-name';
        nameRow.appendChild(this._catNameElement);

        this._levelElement = document.createElement('span');
        this._levelElement.className = 'cat-level';
        nameRow.appendChild(this._levelElement);

        this._element.appendChild(nameRow);

        this._expBarElement = document.createElement('div');
        this._expBarElement.className = 'exp-bar-container';

        this._expFillElement = document.createElement('div');
        this._expFillElement.className = 'exp-bar-fill';
        this._expBarElement.appendChild(this._expFillElement);
        this._element.appendChild(this._expBarElement);

        this._stateElement = document.createElement('div');
        this._stateElement.className = 'cat-state-badge';
        const stateWrapper = document.createElement('div');
        stateWrapper.style.textAlign = 'center';
        stateWrapper.appendChild(this._stateElement);
        this._element.appendChild(stateWrapper);

        container.appendChild(this._element);

        this._registerEvents();
        this._updateDisplay();
    }

    private _createCatIndicators(): void {
        if (!this._catIndicatorContainer) return;

        const cats = [
            { id: CatId.CYBER_CAT, name: '帅猫', color: '#00ffff' },
            { id: CatId.PITIFUL_CAT, name: '可怜猫', color: '#ffb6c1' },
            { id: CatId.PIXEL_CAT, name: '淘气猫', color: '#00ff00' }
        ];

        for (const cat of cats) {
            const indicator = document.createElement('div');
            indicator.className = 'cat-indicator';
            indicator.style.background = cat.color;
            indicator.textContent = cat.name.charAt(0);
            indicator.title = cat.name;
            indicator.dataset.catId = cat.id;

            // 点击切换猫咪
            indicator.addEventListener('click', () => {
                if (this._onCatSelected) {
                    this._onCatSelected(cat.id);
                }
            });

            this._catIndicators.set(cat.id, indicator);
            this._catIndicatorContainer.appendChild(indicator);
        }
    }

    private _registerEvents(): void {
        EventManager.instance.on(GameEventType.CAT_STATE_CHANGED, (data: CatStateChangedEvent) => {
            this._updateState(data.newState);
        });

        EventManager.instance.on(GameEventType.CAT_SELECTED, (data: CatSelectedEvent) => {
            this._updateDisplay();
            this._updateCatIndicator(data.catId);
        });

        EventManager.instance.on(GameEventType.CAT_LEVEL_UP, () => {
            this._updateDisplay();
        });
    }

    private _updateDisplay(): void {
        const catInfo = CatManager.instance.currentCatInfo;
        const level = CatManager.instance.currentCatLevel;
        const exp = CatManager.instance.currentCatExp;
        const state = CatManager.instance.currentCatState;

        if (this._catNameElement && catInfo) {
            this._catNameElement.textContent = catInfo.name;
        }

        if (this._levelElement) {
            const stage = getEvolutionStage(level);
            this._levelElement.textContent = `Lv.${level} · 阶段${stage}`;
        }

        this._updateExpBar(exp, level);
        this._updateState(state);
        this._updateCatIndicator(CatManager.instance.currentCatId);
    }

    private _updateExpBar(exp: number, level: number): void {
        if (!this._expFillElement) return;

        const levels = Object.keys(LEVEL_THRESHOLDS)
            .map(Number)
            .sort((a, b) => a - b);

        let nextLevel = levels[levels.length - 1];
        let prevLevelExp = 0;
        let nextLevelExp = LEVEL_THRESHOLDS[nextLevel];

        for (let i = 0; i < levels.length; i++) {
            if (levels[i] > level) {
                nextLevel = levels[i];
                nextLevelExp = LEVEL_THRESHOLDS[nextLevel];
                if (i > 0) {
                    prevLevelExp = LEVEL_THRESHOLDS[levels[i - 1]];
                }
                break;
            }
        }

        const expInCurrentLevel = exp - prevLevelExp;
        const expNeeded = nextLevelExp - prevLevelExp;
        const percentage = expNeeded > 0 ? Math.min(100, (expInCurrentLevel / expNeeded) * 100) : 100;

        this._expFillElement.style.width = `${percentage}%`;
    }

    private _updateState(state: string): void {
        if (!this._stateElement) return;

        let stateText = '';
        let stateColor = '';

        switch (state) {
            case CatState.IDLE:
                stateText = '💤 待机中';
                stateColor = 'rgba(255, 255, 255, 0.12)';
                break;
            case CatState.EAGER:
                stateText = '✨ 好饿呀~';
                stateColor = 'rgba(255, 215, 0, 0.25)';
                break;
            case CatState.EXCITED:
                stateText = '😻 期待中~';
                stateColor = 'rgba(255, 107, 157, 0.25)';
                break;
            case CatState.EATING:
                stateText = '🍖 进食中...';
                stateColor = 'rgba(0, 255, 100, 0.2)';
                break;
            case CatState.EVOLVED:
                stateText = '🌟 进化中！';
                stateColor = 'rgba(168, 85, 247, 0.35)';
                break;
            default:
                stateText = state;
                stateColor = 'rgba(255, 255, 255, 0.1)';
        }

        this._stateElement.textContent = stateText;
        this._stateElement.style.background = stateColor;
    }

    private _updateCatIndicator(selectedCatId: string): void {
        this._catIndicators.forEach((indicator, catId) => {
            if (catId === selectedCatId) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

    get element(): HTMLElement | null {
        return this._element;
    }

    destroy(): void {
        if (this._element && this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }
        this._element = null;
        this._catNameElement = null;
        this._levelElement = null;
        this._stateElement = null;
        this._expBarElement = null;
        this._expFillElement = null;
        this._catIndicatorContainer = null;
        this._catIndicators.clear();
    }
}
