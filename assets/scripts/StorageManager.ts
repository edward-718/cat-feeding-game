import { CatId } from './CatData';
import { CatManager } from './CatManager';

const STORAGE_KEYS = {
    CAT_DATA: 'cat_feeding_cat_data',
    SELECTED_CAT: 'cat_feeding_selected_cat',
    GAME_SETTINGS: 'cat_feeding_settings'
} as const;

interface CatSaveData {
    catId: string;
    level: number;
    exp: number;
}

interface AllCatSaveData {
    cats: CatSaveData[];
    selectedCatId: string;
    lastSaveTime: number;
}

export class StorageManager {
    private static _instance: StorageManager | null = null;
    private _isAvailable: boolean = false;

    static get instance(): StorageManager {
        if (!this._instance) {
            this._instance = new StorageManager();
        }
        return this._instance;
    }

    init(): void {
        this._isAvailable = this._checkStorageAvailable();
        console.log(`本地存储可用: ${this._isAvailable}`);
    }

    private _checkStorageAvailable(): boolean {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn('localStorage 不可用:', e);
            return false;
        }
    }

    get isAvailable(): boolean {
        return this._isAvailable;
    }

    saveCatData(): void {
        if (!this._isAvailable) return;

        try {
            const catStates = CatManager.instance.getAllCatStates();
            const cats: CatSaveData[] = [];

            catStates.forEach((state, catId) => {
                cats.push({
                    catId: catId,
                    level: state.level,
                    exp: state.exp
                });
            });

            const saveData: AllCatSaveData = {
                cats: cats,
                selectedCatId: CatManager.instance.currentCatId,
                lastSaveTime: Date.now()
            };

            localStorage.setItem(STORAGE_KEYS.CAT_DATA, JSON.stringify(saveData));
            console.log('猫咪数据已保存');
        } catch (e) {
            console.error('保存猫咪数据失败:', e);
        }
    }

    loadCatData(): void {
        if (!this._isAvailable) return;

        try {
            const dataStr = localStorage.getItem(STORAGE_KEYS.CAT_DATA);
            if (!dataStr) {
                console.log('没有找到保存的猫咪数据，使用默认值');
                return;
            }

            const saveData: AllCatSaveData = JSON.parse(dataStr);

            for (const catData of saveData.cats) {
                CatManager.instance.setCatLevel(
                    catData.catId as CatId,
                    catData.level,
                    catData.exp
                );
            }

            if (saveData.selectedCatId) {
                CatManager.instance.selectCat(saveData.selectedCatId as CatId);
            }

            console.log('猫咪数据已加载');
        } catch (e) {
            console.error('加载猫咪数据失败:', e);
        }
    }

    saveSelectedCat(): void {
        if (!this._isAvailable) return;

        try {
            const selectedCatId = CatManager.instance.currentCatId;
            localStorage.setItem(STORAGE_KEYS.SELECTED_CAT, selectedCatId);
        } catch (e) {
            console.error('保存选中猫咪失败:', e);
        }
    }

    loadSelectedCat(): string | null {
        if (!this._isAvailable) return null;

        try {
            return localStorage.getItem(STORAGE_KEYS.SELECTED_CAT);
        } catch (e) {
            console.error('加载选中猫咪失败:', e);
            return null;
        }
    }

    setItem(key: string, value: string): void {
        if (!this._isAvailable) return;
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error(`保存数据失败 [${key}]:`, e);
        }
    }

    getItem(key: string): string | null {
        if (!this._isAvailable) return null;
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.error(`读取数据失败 [${key}]:`, e);
            return null;
        }
    }

    removeItem(key: string): void {
        if (!this._isAvailable) return;
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error(`删除数据失败 [${key}]:`, e);
        }
    }

    clearAll(): void {
        if (!this._isAvailable) return;
        try {
            localStorage.removeItem(STORAGE_KEYS.CAT_DATA);
            localStorage.removeItem(STORAGE_KEYS.SELECTED_CAT);
            localStorage.removeItem(STORAGE_KEYS.GAME_SETTINGS);
            console.log('所有存储数据已清除');
        } catch (e) {
            console.error('清除数据失败:', e);
        }
    }

    clearCatData(): void {
        if (!this._isAvailable) return;
        try {
            localStorage.removeItem(STORAGE_KEYS.CAT_DATA);
            localStorage.removeItem(STORAGE_KEYS.SELECTED_CAT);
            console.log('猫咪数据已清除');
        } catch (e) {
            console.error('清除猫咪数据失败:', e);
        }
    }

    getSaveInfo(): { hasData: boolean; lastSaveTime?: number } {
        if (!this._isAvailable) return { hasData: false };

        try {
            const dataStr = localStorage.getItem(STORAGE_KEYS.CAT_DATA);
            if (!dataStr) return { hasData: false };

            const saveData: AllCatSaveData = JSON.parse(dataStr);
            return {
                hasData: true,
                lastSaveTime: saveData.lastSaveTime
            };
        } catch (e) {
            return { hasData: false };
        }
    }
}
