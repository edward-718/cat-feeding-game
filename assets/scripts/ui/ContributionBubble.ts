import { EventManager, GameEventType, ContributionBubbleEvent } from '../GameEvents';

export class ContributionBubble {
    private _container: HTMLElement | null = null;
    private _bubbles: Map<string, HTMLElement> = new Map();
    private _maxBubbles: number = 8;
    private _bubbleLifetime: number = 3000;
    private _animationFrame: number | null = null;

    constructor(containerId?: string) {
        if (containerId) {
            this.createInContainer(containerId);
        }
    }

    createInContainer(containerId: string): void {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`找不到容器: ${containerId}`);
            return;
        }

        this._container = document.createElement('div');
        this._container.className = 'contribution-bubbles-container';
        this._container.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            width: 250px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            pointer-events: none;
            z-index: 100;
            overflow: hidden;
        `;

        container.appendChild(this._container);

        this._registerEvents();
        this._startUpdateLoop();
    }

    private _registerEvents(): void {
        EventManager.instance.on(GameEventType.CONTRIBUTION_BUBBLE, (data: ContributionBubbleEvent) => {
            this._addBubble(data);
        });
    }

    private _addBubble(data: ContributionBubbleEvent): void {
        if (!this._container) return;

        const bubbleId = `bubble_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const bubble = document.createElement('div');
        bubble.className = 'contribution-bubble';
        bubble.style.cssText = `
            background: linear-gradient(135deg, rgba(255, 107, 107, 0.9), rgba(254, 202, 87, 0.9));
            color: white;
            padding: 10px 15px;
            border-radius: 20px;
            font-size: 14px;
            font-family: 'Microsoft YaHei', sans-serif;
            font-weight: 500;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;

        const userNameSpan = document.createElement('span');
        userNameSpan.style.fontWeight = 'bold';
        userNameSpan.textContent = data.userName;
        bubble.appendChild(userNameSpan);

        const textSpan = document.createElement('span');
        textSpan.textContent = ` 送了 ${data.giftName} `;
        bubble.appendChild(textSpan);

        const valueSpan = document.createElement('span');
        valueSpan.style.color = '#ffd700';
        valueSpan.style.fontWeight = 'bold';
        valueSpan.textContent = `+${data.progressValue}`;
        bubble.appendChild(valueSpan);

        this._container.insertBefore(bubble, this._container.firstChild);
        this._bubbles.set(bubbleId, bubble);

        requestAnimationFrame(() => {
            bubble.style.transform = 'translateX(0)';
            bubble.style.opacity = '1';
        });

        if (this._bubbles.size > this._maxBubbles) {
            const oldestKey = Array.from(this._bubbles.keys())[this._bubbles.size - 1];
            if (oldestKey) {
                this._removeBubble(oldestKey);
            }
        }

        setTimeout(() => {
            this._removeBubble(bubbleId);
        }, this._bubbleLifetime);
    }

    private _removeBubble(bubbleId: string): void {
        const bubble = this._bubbles.get(bubbleId);
        if (!bubble) return;

        bubble.style.transform = 'translateX(100%)';
        bubble.style.opacity = '0';

        setTimeout(() => {
            if (bubble.parentNode) {
                bubble.parentNode.removeChild(bubble);
            }
            this._bubbles.delete(bubbleId);
        }, 300);
    }

    private _startUpdateLoop(): void {
    }

    get container(): HTMLElement | null {
        return this._container;
    }

    destroy(): void {
        if (this._animationFrame) {
            cancelAnimationFrame(this._animationFrame);
            this._animationFrame = null;
        }
        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        this._container = null;
        this._bubbles.clear();
    }
}
