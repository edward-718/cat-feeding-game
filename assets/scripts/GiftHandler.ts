import { GiftConfig, GiftFunction, GiftInfo } from './GiftConfig';
import { ProgressManager } from './ProgressManager';
import { CatManager } from './CatManager';
import { EventManager, GameEventType, GiftReceivedEvent, ContributionBubbleEvent } from './GameEvents';

export interface GiftEventData {
    giftId: string;
    giftName?: string;
    userId: string;
    userName: string;
    giftCount?: number;
}

export class GiftHandler {
    private static _instance: GiftHandler | null = null;
    private _isInitialized: boolean = false;

    static get instance(): GiftHandler {
        if (!this._instance) {
            this._instance = new GiftHandler();
        }
        return this._instance;
    }

    init(): void {
        if (this._isInitialized) {
            return;
        }

        this._isInitialized = true;
        console.log('GiftHandler 初始化完成');
    }

    handleGift(giftData: GiftEventData): void {
        if (!this._isInitialized) {
            console.warn('GiftHandler 未初始化');
            return;
        }

        const gift = this._findGift(giftData);
        if (!gift) {
            console.warn(`未找到礼物配置: ${giftData.giftId} / ${giftData.giftName}`);
            return;
        }

        const count = giftData.giftCount ?? 1;
        const totalProgress = gift.progressValue * count;

        const event: GiftReceivedEvent = {
            giftId: gift.id,
            giftName: gift.name,
            userId: giftData.userId,
            userName: giftData.userName,
            progressValue: totalProgress
        };

        if (gift.function === GiftFunction.SELECT_FEED && gift.catId) {
            event.catId = gift.catId;
            CatManager.instance.selectCatByGiftId(gift.id);
        }

        EventManager.instance.emit(GameEventType.GIFT_RECEIVED, event);

        const bubbleEvent: ContributionBubbleEvent = {
            userName: giftData.userName,
            giftName: gift.name,
            progressValue: totalProgress
        };
        EventManager.instance.emit(GameEventType.CONTRIBUTION_BUBBLE, bubbleEvent);

        CatManager.instance.triggerExcited();

        ProgressManager.instance.addProgress(totalProgress);

        console.log(`收到礼物: ${gift.name} x${count} from ${giftData.userName}, 进度+${totalProgress}`);
    }

    private _findGift(giftData: GiftEventData): GiftInfo | undefined {
        let gift = GiftConfig.instance.getGiftById(giftData.giftId);
        
        if (!gift && giftData.giftName) {
            gift = GiftConfig.instance.getGiftByName(giftData.giftName);
        }

        return gift;
    }

    simulateGift(giftId: string, userName: string = '测试用户', count: number = 1): void {
        const giftData: GiftEventData = {
            giftId: giftId,
            userId: `test_${Date.now()}`,
            userName: userName,
            giftCount: count
        };
        this.handleGift(giftData);
    }

    simulateGiftByName(giftName: string, userName: string = '测试用户', count: number = 1): void {
        const gift = GiftConfig.instance.getGiftByName(giftName);
        if (gift) {
            this.simulateGift(gift.id, userName, count);
        } else {
            console.warn(`未找到礼物: ${giftName}`);
        }
    }

    get isInitialized(): boolean {
        return this._isInitialized;
    }

    reset(): void {
        this._isInitialized = false;
    }
}
