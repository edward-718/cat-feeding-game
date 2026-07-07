export enum CatState {
    IDLE = 'idle',
    EAGER = 'eager',
    EXCITED = 'excited',
    EATING = 'eating',
    EVOLVED = 'evolved',
}

export enum CatId {
    CYBER_CAT = 'cyber_cat',
    PITIFUL_CAT = 'pitiful_cat',
    PIXEL_CAT = 'pixel_cat'
}

export enum EvolutionStage {
    STAGE_1 = 1,
    STAGE_2 = 5,
    STAGE_3 = 10
}

export interface CatInfo {
    id: CatId;
    name: string;
    style: string;
    personality: string;
    selectGiftId: string;
    defaultLevel: number;
}

export const CAT_LIST: CatInfo[] = [
    {
        id: CatId.CYBER_CAT,
        name: '赛博帅猫',
        style: '赛博朋克风',
        personality: '高冷、不屑、偶尔傲娇',
        selectGiftId: 'power_pill',
        defaultLevel: 1
    },
    {
        id: CatId.PITIFUL_CAT,
        name: '可怜猫',
        style: '日系治愈风',
        personality: '楚楚可怜、感恩、爱哭',
        selectGiftId: 'donut',
        defaultLevel: 1
    },
    {
        id: CatId.PIXEL_CAT,
        name: '像素淘气猫',
        style: '16-bit像素风',
        personality: '调皮、贪吃、会偷食物',
        selectGiftId: 'lollipop',
        defaultLevel: 1
    }
];

export interface CatStateData {
    catId: CatId;
    level: number;
    exp: number;
    currentState: CatState;
}

export const LEVEL_THRESHOLDS: { [level: number]: number } = {
    1: 0,
    5: 50,
    10: 200
};

export function getEvolutionStage(level: number): EvolutionStage {
    if (level >= EvolutionStage.STAGE_3) {
        return EvolutionStage.STAGE_3;
    } else if (level >= EvolutionStage.STAGE_2) {
        return EvolutionStage.STAGE_2;
    } else {
        return EvolutionStage.STAGE_1;
    }
}

export function getExpForNextLevel(currentLevel: number): number {
    const levels = Object.keys(LEVEL_THRESHOLDS)
        .map(Number)
        .sort((a, b) => a - b);
    
    for (const level of levels) {
        if (level > currentLevel) {
            return LEVEL_THRESHOLDS[level];
        }
    }
    return LEVEL_THRESHOLDS[levels[levels.length - 1]];
}

export function calculateExpGain(progressValue: number): number {
    const baseExp = 10;
    const bonusExp = Math.floor(progressValue / 100);
    return baseExp + bonusExp;
}
