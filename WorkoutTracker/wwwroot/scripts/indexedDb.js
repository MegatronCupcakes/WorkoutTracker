window._databases = {};
const _db = (name, permissions) => {
    const _transaction = window._databases[name].transaction(name, permissions);
    const _objectStore = _transaction.objectStore(name);
    return _objectStore;
}
const DBAccess = {
    init: (name, version, indexFieldArray) => {
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
                    window._databases[name] = _database;
                    resolve();
                };
                _openRequest.onupgradeneeded = (event) => {
                    _database = event.target.result;
                    const _objectStore = _database.createObjectStore(name, { keyPath: "_id" });
                    if (Array.isArray(indexFieldArray)) {
                        indexFieldArray.forEach(field => _objectStore.createIndex(field, field, { unique: false }));
                    }
                    window._databases[name] = _database;
                    resolve();
                }
            } catch (error) {
                reject(error);
            }
        });
    },
    create: (name, document) => {
        return new Promise((resolve, reject) => {
            if (typeof document === 'string') document = JSON.parse(document);
            const _request = _db(name, 'readwrite').add({
                _id: crypto.randomUUID(),
                ...document
            });
            _request.onerror = error => reject(error);
            _request.onsuccess = () => resolve(_request.result);
        });
    },
    update: (name, searchObject, updateObject) => {
        return new Promise((resolve, reject) => {
            if (typeof searchObject === 'string') searchObject = JSON.parse(searchObject);
            if (typeof updateObject === 'string') updateObject = JSON.parse(updateObject);

            const _findRequest = _db(name, 'readonly').get(searchObject._id);
            _findRequest.onerror = error => reject(error);
            _findRequest.onsuccess = () => {
                const _document = _findRequest.result;

                let updatedDocument = _updateDocument(_document, updateObject);
                const _updateRequest = _db(name, 'readwrite').put(updatedDocument);

                _updateRequest.onerror = error => reject(error);
                _updateRequest.onsuccess = () => resolve(_updateRequest.result);
            }
        });
    },
    findOne: (name, searchObject) => {
        return new Promise((resolve, reject) => {
            if (typeof searchObject === 'string') searchObject = JSON.parse(searchObject);
            const _request = _db(name, 'readonly').get(searchObject._id);
            _request.onerror = error => reject(error);
            _request.onsuccess = () => resolve(_request.result);
        });
    },
    find: (name, searchObject) => {
        return new Promise((resolve, reject) => {
            try {
                let results = [];
                const evaluations = _queryEvaluator(searchObject);
                if (typeof searchObject === 'string') searchObject = JSON.parse(searchObject);
                const _cursorRequest = _db(name, 'readonly').openCursor();
                _cursorRequest.onsuccess = ({ target }) => {
                    const _cursor = target.result;
                    if (_cursor) {
                        // do stuff
                        if (evaluations.map(test => test(_cursor.value)).every(bool => bool)) results.push(_cursor.value);
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
        return new Promise((resolve, reject) => {
            if (typeof searchObject === 'string') searchObject = JSON.parse(searchObject);
            const _request = _db(name, 'readwrite').delete(searchObject._id);
            _request.onerror = error => reject(error);
            _request.onsuccess = () => resolve(_request.result);
        });

    }
};
window.DBAccess = DBAccess;

const _queryEvaluator = (searchObject) => {
    let testArray = [];
    const _evaluationForKey = (_key, _searchObject, _parentKeys, _parentObject) => {
        if (!_parentKeys) _parentKeys = [];
        if (!_parentObject) _parentObject = _searchObject;

        const _getValues = (__searchObject, __testedRecord, __key, __parentKeys) => {
            if (__parentKeys) __parentKeys.forEach(__parentKey => __searchObject = __searchObject[__parentKey]);
            const __searchValue = __searchObject[__key];
            if (__parentKeys.length == 0) __parentKeys = [__key];
            let __testedValue = __testedRecord;
            __parentKeys.forEach(__parentKey => {
                __testedValue = __testedValue[__parentKey];
            });
            return [__searchValue, __testedValue];
        }

        switch (_key) {
            case '$and':
                const andArray = _searchObject[_key].map(_conditional => _evaluationForKey(Object.keys(_conditional)[0], _conditional, null, _parentObject));
                // test if every conditional is true
                return _testRecord => andArray.every(test => test(_testRecord));
            case '$not':
                return _testRecord => {
                    const _condition = _evaluationForKey(Object.keys(_searchObject[_key])[0], _searchObject[_key], _parentKeys, _parentObject);
                    return !_condition(_testRecord);
                }
            case '$nor':
                const norArray = _searchObject[_key].map(_conditional => _evaluationForKey(Object.keys(_conditional)[0], _conditional, null, _parentObject));
                // test if every conditional is false
                return _testRecord => norArray.every(test => !test(_testRecord));
            case '$or':
                const orArray = _searchObject[_key].map(_conditional => _evaluationForKey(Object.keys(_conditional)[0], _conditional, null, _parentObject));
                // test if at least one conditional is true
                return _testRecord => orArray.some(test => test(_testRecord));
            case '$eq':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    return _testedValue == _searchValue;
                };
            case '$gt':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    return _testedValue > _searchValue;
                };
            case '$gte':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    return _testedValue >= _searchValue;
                };
            case '$in':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    return _searchValue.indexOf(_testedValue) > -1;
                };
            case '$lt':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    return _testedValue < _searchValue;
                };
            case '$lte':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    return _testedValue <= _searchValue;
                };
            case '$ne':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    return _testedValue != _searchValue;
                };
            case '$nin':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    return _searchValue.indexOf(_testedValue) == -1;
                };
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
    // a searchObject with no keys returns all records
    if (Object.keys(searchObject).length == 0) testArray.push((testRecord) => true);
    return testArray;
};
const _updateDocument = (originalDocument, updateObject) => {
    let _original = { ...originalDocument };
    Object.keys(updateObject).forEach(key => {
        switch (key) {
            case '$currentDate':
                break;
            case '$inc':
                break;
            case '$min':
                break;
            case '$max':
                break;
            case '$mul':
                break;
            case '$rename':
                break;
            case '$set':
                Object.keys(updateObject[key]).forEach(updateKey => {
                    // account for dot notation
                    if (updateKey.includes(".")) {
                        let tempDocument = _original;
                        const subKeys = updateKey.split(".");
                        for (let index = 0; index < subKeys.length; index++) {
                            if (index < subKeys.length - 1) {
                                if (!tempDocument[subKeys[index]]) tempDocument[subKeys[index]] = {};
                            } else {
                                tempDocument[subKeys[index]] = updateObject[key][updateKey];
                            }
                            tempDocument = tempDocument[subKeys[index]];
                        }
                    } else {
                        _original[updateKey] = updateObject[key][updateKey];
                    }
                });
                break;
            case '$setOnInsert':
                break;
            case '$unset':
                break;
            default:
                break;
        }
    });
    return _original;
}