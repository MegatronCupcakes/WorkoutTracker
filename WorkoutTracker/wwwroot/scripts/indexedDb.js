/*
    Not (yet) Implemented:
        Queries
            Geospatial Query Operators
            Bitwise Query Operators
            Projection Operators
            Miscellaneous Query Operators
        Updates
            Field Update Operators: '$setOnInsert'
            Array Update Operators: '$', '$[]', '$[<identifier>]'
            Bitwise Update Operator
        Aggregation
            Aggregation Pipeline Stages
            Aggregation Pipeline Operators
*/
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
                if (window._databases[name]) resolve();
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
            // Logical Operators
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
            // Comparison Operators
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
            //Element Query Operators
            case '$exists':
                break;
            case '$type':
                break;
            // Evaluation Query Operators
            case '$expr':
                break;
            case '$jsonSchema':
                break;
            case '$mod':
                break;
            case '$regex':
                break;
            case '$text':
                break;
            case '$where':
                break;
            // Geospatial Query Operators - not implemented
            // Array Query Operators
            case '$all':
                break;
            case '$elemMatch':
                break;
            case '$size':
                break;
            // Bitwise Query Operators - not implemented
            // Projection Operators - not implemented
            // Miscellaneous Query Operators - not implemented
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
    let original = { ...originalDocument };
    Object.keys(updateObject).forEach(key => {
        Object.keys(updateObject[key]).forEach(updateKey => {
            _handleUpdate(original, key, updateKey, updateObject[key][updateKey]);
        });
    });
    return original;
}
const _handleUpdate = (original, action, updateKey, updateValue) => {
    let tempDocument = original;
    const subKeys = updateKey.split(".");
    for (let index = 0; index < subKeys.length; index++) {
        if (index < subKeys.length - 1) {
            if (!tempDocument[subKeys[index]]) tempDocument[subKeys[index]] = {};
        } else {
            switch (action) {
                // Field Update Operators                  
                case '$currentDate':
                    // Currently only supports Date and not Mongo's Timestamp type.                 
                    tempDocument[subKeys[index]] = new Date();
                    break;
                case '$inc':
                    tempDocument[subKeys[index]] = ++tempDocument[subKeys[index]];
                    break;
                case '$min':
                    if (_isNumeric(updateValue) && updateValue < tempDocument[subKeys[index]]) tempDocument[subKeys[index]] = Number(updateValue);
                    break;
                case '$max':
                    if (_isNumeric(updateValue) && updateValue > tempDocument[subKeys[index]]) tempDocument[subKeys[index]] = Number(updateValue);
                    break;
                case '$mul':
                    if (_isNumeric(updateValue)) tempDocument[subKeys[index]] = tempDocument[subKeys[index]] * Number(updateValue);
                    break;
                case '$rename':
                    const value = tempDocument[subKeys[index]];
                    delete tempDocument[subKeys[index]];
                    tempDocument[updateValue] = value;
                    break;
                case '$set':
                    tempDocument[subKeys[index]] = updateValue;
                    break;
                case '$setOnInsert':
                    // Not implemented
                    break;
                case '$unset':
                    delete tempDocument[subKeys[index]];
                    break;
                // Array Update Operators
                case '$':
                    // Not implemented
                    break;
                case '$[]':
                    // Not implemented
                    break;
                case '$[<identifier>]':
                    // Not implemented
                    break;
                case '$addToSet':
                    if (Array.isArray(tempDocument[subKeys[index]])) {
                        if (typeof updateValue == 'object' && Object.keys(updateValue)[0] == '$each' && Array.isArray(updateValue['$each'])) {
                            updateValue['$each'].forEach(_value => {
                                if (tempDocument[subKeys[index]].indexOf(_value) == -1) tempDocument[subKeys[index]].push(_value);
                            });
                        } else if (tempDocument[subKeys[index]].indexOf(updateValue) == -1) {
                            tempDocument[subKeys[index]].push(updateValue);
                        }
                    }
                    break;
                case '$pop':
                    if (Array.isArray(tempDocument[subKeys[index]])) {
                        if (updateValue == 1) tempDocument[subKeys[index]].shift();
                        if (updateValue == -1) tempDocument[subKeys[index]].pop();
                    }
                    break;
                case '$pull':
                    let _testSearchObject = {};
                    _testSearchObject[subKeys[index]] = updateValue;

                    const _test = typeof updateValue == 'object'
                        ?
                        testItem => {
                            // To re-use our query evaluations, we need to wrap the test term in an object matching the search term.
                            let _testObject = {};
                            _testObject[subKeys[index]] = testItem;
                            return !_queryEvaluator(_testSearchObject)[0](_testObject)
                        }
                        :
                        testItem => testItem != updateValue;

                    tempDocument[subKeys[index]] = tempDocument[subKeys[index]].filter(arrayItem => {
                        return _test(arrayItem);
                    });
                    break;
                case '$push':
                    if (Array.isArray(tempDocument[subKeys[index]])) {
                        if (typeof updateValue == 'object') {
                            let _updateSlice;
                            let _updatePosition;
                            let _updateSort;
                            let _updateArray = [];
                            if (updateValue['$slice'] && _isNumeric(updateValue['$slice'])) {
                                _updateSlice = updateValue['$slice'];
                            }
                            if (updateValue['$position'] && _isNumeric(updateValue['$position'])) {
                                _updatePosition = updateValue['$position'];
                            }
                            if (updateValue['$sort'] && _isNumeric(updateValue['$sort'])) {
                                _updateSort = updateValue['$sort'];
                            }
                            if (Array.isArray(updateValue['$each']) && Array.isArray(updateValue['$each'])) {
                                _updateArray = updateValue['$each'];
                            }
                            let _update = [
                                ...tempDocument[subKeys[index]].slice(0, _updatePosition),
                                ..._updateArray,
                                ...tempDocument[subKeys[index]].slice(_updatePosition)
                            ];
                            if (_updateSlice) _update = _update.slice(_updateSlice);
                            if (_updateSort) {
                                if (_isNumeric(_updateSort) && Math.abs(_updateSort) == 1) {
                                    if (_update.every(item => _isNumeric(item))) {
                                        // sort numbers
                                        _update.sort((a, b) => a - b);
                                    } else {
                                        // sort strings
                                        _update.sort();
                                    }
                                    if (_updateSort == -1) _update.reverse();
                                } else if (typeof _updateSort == 'object') {
                                    // sort documents by property
                                    let _sortField = Object.keys(_updateSort)[0];
                                    let _sortDirection = _updateSort[_sortField];
                                    if (_isNumeric(_sortDirection) && Math.abs(_sortDirection) == 1) {
                                        _update.sort((a, b) => {
                                            // account for dot notation....
                                            _sortField.split('.').forEach(key => {
                                                a = a[key];
                                                b = b[key];
                                            });
                                            if (a > b) return 1;
                                            if (a < b) return -1;
                                            return 0;
                                        });
                                        if (_sortDirection == -1) _update.reverse();
                                    }
                                }
                            }
                            tempDocument[subKeys[index]] = _update;
                        } else {
                            tempDocument[subKeys[index]].push(updateValue);
                        }
                    }
                    break;
                case '$pullAll':
                    // this looks logically identical to $pull: {$in: [...]}
                    _handleUpdate(original, '$pull', updateKey, { $in: updateValue });
                    break;
                //case '$each':
                // works with $addToSet and $push...
                // implemented by $addToSet and $push
                //case '$position':
                // works with $push...
                // implemented by $push
                //case '$slice':
                // works with $push...
                // implemented by $push
                //case '$sort':
                // works with $push...
                // implemented by $push
                // Bitwise Update Operator - not implemented                
            }
        }
        tempDocument = tempDocument[subKeys[index]];
    }
    return original
}
const _isNumeric = (value) => {
    try {
        Number(value);
        return true;
    } catch (error) {
        return false;
    }
}