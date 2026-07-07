import { EventManager, GameEventType, ProgressChangedEvent } from '../GameEvents';
import { ProgressManager } from '../ProgressManager';

export class ProgressBar {
    private _element: HTMLElement | null = null;
    private _fillElement: HTMLElement | null = null;
    private _textElement: HTMLElement | null = null;
    private _glowElement: HTMLElement | null = null;
    private _currentPercentage: number = 0;
    private _targetPercentage: number = 0;
    private _animationFrame: number | null = null;
    private _isNearFull: boolean = false;
    private _glowIntensity: number = 0;
    private _glowDirection: number = 1;

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

        this._element = document.createElement('div');
        this._element.className = 'progress-bar-container';
        this._element.style.cssText = `
            width: 100%;
            height: 30px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 15px;
            position: relative;
            overflow: hidden;
            border: 2px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        `;

        this._glowElement = document.createElement('div');
        this._glowElement.className = 'progress-bar-glow';
        this._glowElement.style.cssText = `
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border-radius: 17px;
            box-shadow: 0 0 0 rgba(255, 215, 0, 0);
            transition: box-shadow 0.3s ease;
            pointer-events: none;
        `;
        this._element.appendChild(this._glowElement);

        this._fillElement = document.createElement('div');
        this._fillElement.className = 'progress-bar-fill';
        this._fillElement.style.cssText = `
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #ff9a56, #ff6b9d);
            border-radius: 14px;
            transition: width 0.3s ease;
            position: relative;
            overflow: hidden;
        `;
        this._element.appendChild(this._fillElement);

        const sparkle = document.createElement('div');
        sparkle.className = 'progress-bar-sparkle';
        sparkle.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
                90deg,
                transparent 0%,
                rgba(255, 255, 255, 0.4) 50%,
                transparent 100%
            );
            animation: sparkle 2s infinite;
        `;
        this._fillElement.appendChild(sparkle);

        this._textElement = document.createElement('div');
        this._textElement.className = 'progress-bar-text';
        this._textElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 14px;
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            z-index: 10;
            white-space: nowrap;
        `;
        this._element.appendChild(this._textElement);

        container.appendChild(this._element);

        this._registerEvents();
        this._updateDisplay();
        this._startGlowAnimation();
    }

    private _registerEvents(): void {
        EventManager.instance.on(GameEventType.PROGRESS_CHANGED, (data: ProgressChangedEvent) => {
            this._onProgressChanged(data);
        });
    }

    private _onProgressChanged(data: ProgressChangedEvent): void {
        this._targetPercentage = data.percentage;
        this._isNearFull = data.percentage >= 80;

        if (!this._animationFrame) {
            this._animateProgress();
        }

        this._updateText(data.currentProgress, data.maxProgress, data.lastContribution);
    }

    private _animateProgress(): void {
        const diff = this._targetPercentage - this._currentPercentage;
        if (Math.abs(diff) < 0.1) {
            this._currentPercentage = this._targetPercentage;
            this._animationFrame = null;
            this._updateFill();
            return;
        }

        this._currentPercentage += diff * 0.15;
        this._updateFill();

        this._animationFrame = requestAnimationFrame(() => this._animateProgress());
    }

    private _updateFill(): void {
        if (this._fillElement) {
            this._fillElement.style.width = `${this._currentPercentage}%`;
        }
    }

    private _updateText(current: number, max: number, lastContribution: number): void {
        if (this._textElement) {
            const percentage = ((current / max) * 100).toFixed(1);
            let text = `${current} / ${max} (${percentage}%)`;
            if (lastContribution > 0) {
                text += `  +${lastContribution}`;
            }
            this._textElement.textContent = text;
        }
    }

    private _updateDisplay(): void {
        const data = ProgressManager.instance.getProgressForDisplay();
        this._targetPercentage = data.percentage;
        this._currentPercentage = data.percentage;
        this._isNearFull = data.isNearFull;
        this._updateFill();
        this._updateText(data.current, data.max, 0);
    }

    private _startGlowAnimation(): void {
        const animate = () => {
            if (this._isNearFull && this._glowElement) {
                this._glowIntensity += 0.05 * this._glowDirection;
                if (this._glowIntensity >= 1) {
                    this._glowIntensity = 1;
                    this._glowDirection = -1;
                } else if (this._glowIntensity <= 0.3) {
                    this._glowIntensity = 0.3;
                    this._glowDirection = 1;
                }

                const glowSize = 10 + this._glowIntensity * 15;
                const opacity = 0.5 + this._glowIntensity * 0.5;
                this._glowElement.style.boxShadow = `0 0 ${glowSize}px rgba(255, 215, 0, ${opacity})`;
            } else if (this._glowElement) {
                this._glowElement.style.boxShadow = '0 0 0 rgba(255, 215, 0, 0)';
            }

            requestAnimationFrame(animate);
        };
        animate();
    }

    setProgress(percentage: number): void {
        this._targetPercentage = Math.max(0, Math.min(100, percentage));
        if (!this._animationFrame) {
            this._animateProgress();
        }
    }

    get element(): HTMLElement | null {
        return this._element;
    }

    destroy(): void {
        if (this._animationFrame) {
            cancelAnimationFrame(this._animationFrame);
            this._animationFrame = null;
        }
        if (this._element && this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);
        }
        this._element = null;
        this._fillElement = null;
        this._textElement = null;
        this._glowElement = null;
    }
}
