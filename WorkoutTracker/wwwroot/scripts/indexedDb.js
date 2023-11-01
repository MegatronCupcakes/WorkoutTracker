let _databases = {};
const _db = (name, permissions) => {
    return _databases[name].transaction(name, permissions).objectStore(name);
}
const DBAccess = {
    init: (name, version, indexFieldArray) => {
        console.log("I'm actually doing something....");
        return new Promise(async (resolve, reject) => {
            try {
                let _database;
                const _dbVersions = (await window.indexedDB.databases())
                    .filter(dictionary => dictionary.name == name)
                    .map(dictionary => dictionary.version)
                    .sort()
                    .reverse();
                // request most recent version
                const _openRequest = window.indexedDB.open(name, version ? version : _dbVersions[0]);
                _openRequest.onerror = () => reject(`ERROR: could not open IndexedDB "${name}"`);
                _openRequest.onsuccess = (event) => {
                    _database = event.target.result;
                    _databases[name] = _database;
                    resolve();
                };
                _openRequest.onupgradeneeded = (event) => {
                    _database = event.target.result;
                    const _objectStore = _database.createObjectStore(name, { keyPath: "_id" });
                    if (Array.isArray(indexFieldArray)) {
                        indexFieldArray.forEach(field => _objectStore.createIndex(field, field, { unique: false }));
                    }
                    _databases[name] = _database;
                    resolve();
                }
            } catch (error) {
                reject(error);
            }
        });
    },
    create: (name, document) => {
        if (typeof document === 'string') document = JSON.parse(document);
        return _db(name, 'readwrite').add({
            _id: crypto.randomUUID(),
            ...document
        });
    },
    update: (name, searchObject, updateObject) => {
        if (typeof searchObject === 'string') searchObject = JSON.parse(searchObject);
        if (typeof updateObject === 'string') updateObject = JSON.parse(updateObject);        
        return _db(name, 'readwrite').put(searchObject._id, updateObject);
    },
    findOne: (name, searchObject) => {
        if (typeof searchObject === 'string') searchObject = JSON.parse(searchObject);
        return _db(name, 'read').get(searchObject._id);
    },
    find: (name, searchObject) => {
        return new Promise((resolve, reject) => {
            try {
                let results = [];
                if (typeof searchObject === 'string') searchObject = JSON.parse(searchObject);
                const _cursorRequest = _db(name, 'read').openCursor();
                _cursorRequest.onsuccess = ({ target }) => {
                    const _cursor = target.result;
                    if (cursor) {
                        // do stuff
                        if (_queryEvaluator(searchObject).map(test => test(_cursor.value)).every(bool => bool)) results.push(_cursor.value);
                        _cursor.continue();
                    } else {
                        resolve(results);
                    }
                }
            } catch (error) {
                reject(error);
            }                
        });        
    },    
    remove: (name, searchObject) => {
        if (typeof searchObject === 'string') searchObject = JSON.parse(searchObject);
        return _db(name, 'readwrite').delete(searchObject._id);
    }
};
window.DBAccess = DBAccess;

const _queryEvaluator = (searchObject) => {
    let testArray = [];
    const _evaluationForKey = (_key, _searchObject, _parentKeys, _parentObject) => {
        if (!_parentKeys) _parentKeys = [];
        if (!_parentObject) _parentObject = _searchObject;
        const _getTestValue = (__testedRecord, __key, __parentKeys) => {
            if (__parentKeys.length == 0) __parentKeys = [__key];
            let __testedValue = __testedRecord;
            __parentKeys.forEach(__parentKey => {
                __testedValue = __testedValue[__parentKey];
            });
            return __testedValue;
        }
        switch (_key) {
            case '$and':
                const andArray = _searchObject["$and"].map(_conditional => {
                   _parentKeys.push(_key);
                    return _evaluationForKey(Object.keys(_conditional)[0], _conditional, _parentKeys, _parentObject);
                });
                // test if every conditional is true
                return _testRecord => andArray.every(test => test(_testRecord));
            case '$not':
                return _testRecord => {
                    _parentKeys.push(_key);
                    const _condition = _evaluationForKey(_key, _searchObject["$not"], _parentKeys, _parentObject);
                    return !_condition(_testRecord);
                }
            case '$nor':
                const norArray = _searchObject["$and"].map(_conditional => {
                    _parentKeys.push(_key);
                    _evaluationForKey(Object.keys(_conditional)[0], _conditional, _parentKeys, _parentObject);
                });
                // test if every conditional is false
                return _testRecord => norArray.every(test => !test(_testRecord));
            case '$or':
                const orArray = _searchObject["$and"].map(_conditional => {
                    _evaluationForKey(Object.keys(_conditional)[0], _conditional, _parentKeys, _parentObject)
                });
                // test if at least one conditional is true
                return _testRecord => orArray.some(test => test(_testRecord));
            case '$eq':
                return _testRecord => _getTestValue(_testRecord, _key, _parentKeys) == _searchObject[_key];
            case '$gt':
                return _testRecord => _getTestValue(_testRecord, _key, _parentKeys) > _searchObject[_key];
            case '$gte':
                return _testRecord => _getTestValue(_testRecord, _key, _parentKeys) >= _searchObject[_key];
            case '$in':
                return _testRecord => _searchObject[_key].indexOf(_getTestValue(_testRecord, _key, _parentKeys)) > -1;
            case '$lt':
                return _testRecord => _getTestValue(_testRecord, _key, _parentKeys) < _searchObject[_key];
            case '$lte':
                return _testRecord => _getTestValue(_testRecord, _key, _parentKeys) <= _searchObject[_key];
            case '$ne':
                return _testRecord => _getTestValue(_testRecord, _key, _parentKeys) != _searchObject[_key];
            case '$nin':
                return _testRecord => _searchObject["$eq"].indexOf(_getTestValue(_testRecord, _key, _parentKeys)) == -1;
            default:
                if (typeof _searchObject[_key] === 'object') {
                    // nested query objects have a single special operator key
                    _parentKeys.push(_key);
                    return _evaluationForKey(Object.keys(_searchObject[_key])[0], _searchObject, _parentKeys, _parentObject);
                } else {
                    if (_key.includes('.')) {
                        // account for dot notation                
                        return testedRecord => {
                            let _testedRecord = testedRecord;
                            _key.split('.').forEach(subKey => _testedRecord = _testedRecord[subKey]);
                            return _testedRecord == _searchObject[_key];
                        };
                    } else {
                        return testedRecord => {
                            if (_parentKeys.length === 0) return testedRecord[_key] == _searchObject[_key];
                            // we need to accomodate recursion;
                            let testedValue = testedRecord;
                            let searchedValue = _searchObject;
                            _parentKeys.forEach(_parentKey => {
                                testedValue = testedValue[_parentKey];
                                searchedValue = searchedValue[_parentKey];
                            });
                            return searchedValue == testedValue;
                        };
                    }
                }
        }
    }

    Object.keys(searchObject).forEach(key => {
        testArray.push(_evaluationForKey(key, searchObject));
    });

    return testArray;
};