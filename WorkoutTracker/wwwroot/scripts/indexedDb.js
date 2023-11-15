/*
    Not (yet) Implemented:
        Queries
            Evaluation Query Operators: '$jsonSchema'
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
        Other Options
            multi
            limit
            sort
*/
window._databases = {};
const _db = (databaseName, objectStoreName, permissions) => {
    try {
        const _transaction = window._databases[databaseName].transaction(objectStoreName, permissions);
        const _objectStore = _transaction.objectStore(objectStoreName);
        return _objectStore;
    } catch (error) {
        throw new Error(`DBAccess Error: "${error.message}" - is the database initialized?`);
    }
}
const _createObjectStore = (db, objectStoreName, indexFieldArray, upgradeBool) => {
    const _names = Object.keys(db.objectStoreNames).map(key => db.objectStoreNames[key]);
    if (upgradeBool || _names.indexOf(objectStoreName) == -1) {
        const _objectStore = db.createObjectStore(objectStoreName, { keyPath: "_id" });
        if (Array.isArray(indexFieldArray)) {
            indexFieldArray.forEach(field => _objectStore.createIndex(field, field, { unique: false }));
        }
    }
}
const DBAccess = {
    init: (databaseName, objectStoreName, version, indexFieldArray) => {
        return new Promise(async (resolve, reject) => {
            try {
                let _database;
                if (window._databases[databaseName]) resolve(true);
                if (typeof indexFieldArray === 'string') indexFieldArray = JSON.parse(indexFieldArray);
                const _dbVersions = (await window.indexedDB.databases())
                    .filter(dictionary => dictionary.name == databaseName)
                    .map(dictionary => dictionary.version)
                    .sort((a, b) => b - a);
                // request most recent version
                const _openRequest = window.indexedDB.open(databaseName, version ? version : _dbVersions[0]);
                _openRequest.onerror = () => {
                    console.error(`DBAccess.init Error: could not open IndexedDB "${databaseName}" (${error.message})`);
                    reject(false);
                };
                _openRequest.onsuccess = (event) => {
                    _database = event.target.result;
                    _createObjectStore(_database, objectStoreName, indexFieldArray, false);
                    window._databases[databaseName] = _database;
                    resolve(true);
                };
                _openRequest.onupgradeneeded = (event) => {
                    _database = event.target.result;
                    _createObjectStore(_database, objectStoreName, indexFieldArray, true);
                    window._databases[databaseName] = _database;
                    resolve(true);
                }
            } catch (error) {
                console.error(`DBAccess.init Error: ${error.message}`);
                reject(false);
            }
        });
    },
    insert: function(databaseName, objectStoreName, document){
        return new Promise(async (resolve, reject) => {
            if (typeof document === 'string') document = JSON.parse(document);
            // if document._id is provided and not already used, use the provided value; otherwise generate a new value.
            const _keyIsUnique = document._id && (await this.findOne(databaseName, objectStoreName, { _id: document._id })) == null;
            const _request = _db(databaseName, objectStoreName, 'readwrite').add({
                _id: _keyIsUnique ? document._id : crypto.randomUUID(),
                ...document,
                createdAt: new Date()
            });
            _request.onerror = error => reject(error);
            _request.onsuccess = () => {
                resolve(_request.result);
            };
        });
    },
    update: function (databaseName, objectStoreName, searchObject, updateObject) {
        return new Promise(async (resolve, reject) => {
            try {                
                if (typeof searchObject === 'string') searchObject = JSON.parse(searchObject);
                if (typeof updateObject === 'string') updateObject = JSON.parse(updateObject);                
                // allow for updating multiple documents ("multi" option not implemented yet);
                const _matchingDocuments = await this.find(databaseName, objectStoreName, searchObject);
                await Promise.all(_matchingDocuments.map(_matchingDocument => {
                    return new Promise((_resolve, _reject) => {
                        let _updatedDocument = _updateDocument(_matchingDocument, updateObject);
                        // disallow updating the _id property by setting it back to its pre-update value.
                        _updatedDocument._id = _matchingDocument._id;
                        _updatedDocument.updatedAt = new Date();
                        const _updateRequest = _db(databaseName, objectStoreName, 'readwrite').put(_updatedDocument);
                        _updateRequest.onerror = error => _reject();
                        _updateRequest.onsuccess = () => _resolve();
                    });
                }));
                resolve(true);
            } catch (error) {
                resolve(false);
            }
        });
    },
    findOne: (databaseName, objectStoreName, searchObject) => {
        return new Promise(async (resolve, reject) => {
            try {
                if (typeof searchObject === 'string') searchObject = JSON.parse(searchObject);
                const evaluations = _queryEvaluator(searchObject ? searchObject : {});                
                const _cursorRequest = _db(databaseName, objectStoreName, 'readonly').openCursor();
                _cursorRequest.onsuccess = ({ target }) => {
                    const _cursor = target.result;
                    if (_cursor) {
                        if (evaluations.map(test => test(_cursor.value)).every(bool => bool)) {
                            resolve(_cursor.value);
                        } else {
                            _cursor.continue();
                        }
                    } else {
                        resolve(null);
                    }
                }
            } catch (error) {
                reject(error);
            }
        });
    },
    find: (databaseName, objectStoreName, searchObject) => {
        return new Promise(async (resolve, reject) => {
            try {                
                let results = [];
                if (typeof searchObject === 'string') searchObject = JSON.parse(searchObject);
                const evaluations = _queryEvaluator(searchObject ? searchObject : {});                
                const _cursorRequest = _db(databaseName, objectStoreName, 'readonly').openCursor();
                _cursorRequest.onsuccess = ({ target }) => {
                    const _cursor = target.result;
                    if (_cursor) {
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
    remove: (databaseName, objectStoreName, searchObject) => {
        // currently restricted to remove single record by _id only.
        return new Promise((resolve, reject) => {
            try {
                if (typeof searchObject === 'string') searchObject = JSON.parse(searchObject);
                if (!searchObject._id) resolve(false);
                const _request = _db(databaseName, objectStoreName, 'readwrite').delete(searchObject._id);
                _request.onerror = error => resolve(false);
                _request.onsuccess = () => resolve(true);
            } catch (error) {
                reject(error);
            }            
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
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    const _searchingForExist = _searchValue === true || (typeof _searchValue === 'string' && _searchValue.toLowerCase() === 'true') || (_isNumeric(_searchValue) && Number(_searchValue) === 1) ? true : false;
                    // account for dot notation
                    try {
                        _parentKeys[_parentKeys.length - 1].split('.').forEach(subkey => _testRecord = _testRecord[subkey]);
                        return _searchingForExist ? true : false;
                    } catch (_error) {
                        return _searchingForExist ? false : true;
                    }
                }
                break;
            case '$type':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    console.log(`_testRecord: ${JSON.stringify(_testRecord)} searchObject: ${JSON.stringify(searchObject)} _key: ${_key}, _parentKeys: ${JSON.stringify(_parentKeys)} _searchValue: ${_searchValue} _testedValue: ${_testedValue}`);
                    return typeof _testedValue === _searchValue;
                }
            // Evaluation Query Operators
            case '$expr':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    const _expressionOperator = Object.keys(_searchValue)[0];
                    const _expressionKeys = _searchValue[_expressionOperator];
                    // get values for keys....
                    const _getValuesFromExpressionKeys = (testRecord, key) => {
                        if (key[0] == '$') {
                            // get value for key... and of course, account for dot notation
                            key.replace('$', '').split('.').forEach(subKey => {
                                testRecord = testRecord[subKey];
                            });
                            return testRecord;
                        } else {
                            return key;
                        }
                    };
                    const valuesFromKeys = _expressionKeys.map(key => _getValuesFromExpressionKeys({ ..._testRecord }, key));
                    console.log(`valuesFromKeys[0]: ${valuesFromKeys[0]} valuesFromKeys[1]: ${valuesFromKeys[1]}`);
                    switch (_expressionOperator) {
                        case '$eq':
                            return valuesFromKeys[0] == valuesFromKeys[1];
                        case '$gt':
                            return valuesFromKeys[0] > valuesFromKeys[1];
                        case '$gte':
                            return valuesFromKeys[0] >= valuesFromKeys[1];
                        case '$lt':
                            return valuesFromKeys[0] < valuesFromKeys[1];
                        case '$lte':
                            return valuesFromKeys[0] <= valuesFromKeys[1];
                    }
                }
            case '$jsonSchema':
                // Not Implemented (yet)
                break;
            case '$mod':
                return _testRecord => {
                    const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                    if (Array.isArray(_searchValue)) {
                        const _parentKey = _parentKeys[_parentKeys.length - 1];
                        let _testValue = _testRecord;
                        _parentKey.split('.').forEach(subKey => {
                            _testValue = _testValue[subKey];
                        });
                        return _testValue % _searchValue[0] == _searchValue[1];
                    } else {
                        return false;
                    }
                }
            case '$regex':
                console.log(`_testRecord: ${JSON.stringify(_testRecord)} searchObject: ${JSON.stringify(searchObject)} _key: ${_key}, _parentKeys: ${JSON.stringify(_parentKeys)} _searchValue: ${JSON.stringify(_searchValue)} _testedValue: ${JSON.stringify(_testedValue)}`);
                const [_searchValue, _testedValue] = _getValues(_searchObject, _testRecord, _key, _parentKeys);
                const _parentKey = _parentKeys[_parentKeys.length - 1];
                Object.keys(_searchValue)
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