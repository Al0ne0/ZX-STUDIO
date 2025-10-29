import { VFSFile } from '../types';

const DB_NAME = 'GeminiOSDB';
const DB_VERSION = 1;
const OS_STATE_STORE = 'osState';
const VFS_FILES_STORE = 'vfsFiles';
const OS_STATE_KEY = 'mainState';

let db: IDBDatabase;

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('IndexedDB error:', request.error);
            reject(request.error);
        };

        request.onsuccess = (event) => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            if (!dbInstance.objectStoreNames.contains(OS_STATE_STORE)) {
                dbInstance.createObjectStore(OS_STATE_STORE);
            }
            if (!dbInstance.objectStoreNames.contains(VFS_FILES_STORE)) {
                dbInstance.createObjectStore(VFS_FILES_STORE, { keyPath: 'id' });
            }
        };
    });
};

export const saveOsState = async (state: any): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(OS_STATE_STORE, 'readwrite');
        const store = transaction.objectStore(OS_STATE_STORE);
        const request = store.put(state, OS_STATE_KEY);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const loadOsState = async (): Promise<any | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(OS_STATE_STORE, 'readonly');
        const store = transaction.objectStore(OS_STATE_STORE);
        const request = store.get(OS_STATE_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};

export const saveVfsFile = async (file: VFSFile): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(VFS_FILES_STORE, 'readwrite');
        const store = transaction.objectStore(VFS_FILES_STORE);
        const fileToStore = {
            id: file.id,
            name: file.name,
            type: file.type,
            blob: file.blob,
        };
        const request = store.put(fileToStore);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};


export const loadAllVfsFiles = async (): Promise<VFSFile[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(VFS_FILES_STORE, 'readonly');
        const store = transaction.objectStore(VFS_FILES_STORE);
        const request = store.getAll();
        request.onsuccess = () => {
            const filesWithUrls = request.result.map((f: any) => ({
                ...f,
                url: URL.createObjectURL(f.blob)
            }));
            resolve(filesWithUrls);
        };
        request.onerror = () => reject(request.error);
    });
};

export const deleteVfsFile = async (fileId: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(VFS_FILES_STORE, 'readwrite');
        const store = transaction.objectStore(VFS_FILES_STORE);
        const request = store.delete(fileId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};