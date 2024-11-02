let request: IDBOpenDBRequest;
let db: IDBDatabase;
let version = 1;

export interface Zkey {
  id: string;
  data: Uint8Array;
  type: string;
}

export interface ZeroEncrypt {
  id: string;
  data: string;
}

export interface DbEvent {
  id: string;
  game: string;
  data: string;
}


export enum Stores {
  ZKeys = 'zkeys',
  ZeroEncrypts = 'zeroEncrypt',
  Events = 'events',
}

const DB_NAME = 'myDB';

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // open the connection
    request = indexedDB.open(DB_NAME);

    request.onupgradeneeded = () => {
      db = request.result;
      // if the data object store doesn't exist, create it
      if (!db.objectStoreNames.contains(Stores.ZKeys)) {
        console.log('Creating zkeys store');
        db.createObjectStore(Stores.ZKeys, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(Stores.ZeroEncrypts)) {
        console.log('Creating ZeroEncrypts store');
        db.createObjectStore(Stores.ZeroEncrypts, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(Stores.Events)) {
        console.log('Creating Events store');
        var events = db.createObjectStore(Stores.Events, { keyPath: 'id' });
        var name = 'game';
        var keyPath = ['game'];
        events.createIndex(name, keyPath);
      }
      // no need to resolve here
    };

    request.onsuccess = () => {
      db = request.result;
      version = db.version;
      resolve(true);
    };

    request.onerror = () => {
      resolve(false);
    };
  });
};

export const addData = <T>(storeName: string, data: T): Promise<T|string|null> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, version);

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.add(data);
      resolve(data);
    };

    request.onerror = () => {
      const error = request.error?.message
      if (error) {
        resolve(error);
      } else {
        resolve('Unknown error');
      }
    };
  });
};

export const getStoreRecord = <T>(storeName: Stores, key: string): Promise<T> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME);

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const res = store.get(key);
      res.onsuccess = () => {
        resolve(res.result);
      };
    };
  });
};

export const getStoreRecords = <T>(storeName: Stores, indexName: string, values: string[]): Promise<T[]> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME);

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      var index = store.index(indexName);
      var queryRequest = index.openCursor(IDBKeyRange.only(values));
      var results: any = [];
      queryRequest.onsuccess = function() {
        var cursor = queryRequest.result;
        if (cursor) {
          results.push(JSON.parse(cursor.value.data));
          cursor.continue();
        }
        else {
          resolve(results);
        }
      };
    };
  });
};

export const deleteStoreRecord = (storeName: Stores, key: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // again open the connection
    const request = indexedDB.open(DB_NAME, version);

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const res = store.delete(key);

      // add listeners that will resolve the Promise
      res.onsuccess = () => {
        resolve(true);
      };
      res.onerror = () => {
        resolve(false);
      }
    };
  });
};