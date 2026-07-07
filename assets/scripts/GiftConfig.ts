export enum GiftFunction {
    FEED = 'feed',
    SELECT_FEED = 'select_feed'
}

export interface GiftInfo {
    id: string;
    name: string;
    price: number;
    function: GiftFunction;
    progressValue: number;
    catId: string | null;
}

export interface GiftConfigData {
    gifts: GiftInfo[];
    maxProgress: number;
    excitedTimeout: number;
}

export class GiftConfig {
    private static _instance: GiftConfig | null = null;
    private _config: GiftConfigData | null = null;
    private _giftMap: Map<string, GiftInfo> = new Map();

    static get instance(): GiftConfig {
        if (!this._instance) {
            this._instance = new GiftConfig();
        }
        return this._instance;
    }

    loadConfig(configData: GiftConfigData): void {
        this._config = configData;
        this._giftMap.clear();
        for (const gift of configData.gifts) {
            this._giftMap.set(gift.id, gift);
        }
    }

    getGiftById(giftId: string): GiftInfo | undefined {
        return this._giftMap.get(giftId);
    }

    getGiftByName(giftName: string): GiftInfo | undefined {
        if (!this._config) return undefined;
        return this._config.gifts.find(g => g.name === giftName);
    }

    get maxProgress(): number {
        return this._config?.maxProgress ?? 1000;
    }

    get excitedTimeout(): number {
        return this._config?.excitedTimeout ?? 5000;
    }

    getAllGifts(): GiftInfo[] {
        return this._config?.gifts ?? [];
    }

    getSelectCatGifts(): GiftInfo[] {
        return this.getAllGifts().filter(g => g.function === GiftFunction.SELECT_FEED);
    }
}
