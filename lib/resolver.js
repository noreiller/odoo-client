'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolvePromises = exports.resolveDependencies = exports.checkDependencies = exports.getDependencies = exports.deepMerge = exports.removeDuplicatesFromList = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _operators = require('./operators');

var _utils = require('./utils');

var removeDuplicatesFromList = exports.removeDuplicatesFromList = function removeDuplicatesFromList(list) {
  return list.reduce(function (prev, next) {
    if (prev.indexOf(next) === -1) {
      prev.push(next);
    }

    return prev;
  }, []);
};

/**
 * Merge collections of objects
 * @param  {Object} target     An object which key is the model name, the value is an array
 * @param  {Object} newObjects Same as target
 * @return {Object}            Target updated
 */
var deepMerge = exports.deepMerge = function deepMerge(target, newObjects) {
  var _loop = function _loop(modelName) {
    newObjects[modelName].forEach(function (newObject) {
      // Create the model list if it not exists
      if (!target[modelName]) {
        target[modelName] = [];
      }

      // Find an existing ID
      var existingTarget = target[modelName].find(function (targetModel) {
        return targetModel.id === newObject.id;
      });

      if (existingTarget) {
        target[modelName][target[modelName].indexOf(existingTarget)] = _extends({}, existingTarget, newObject);
      } else {
        target[modelName].push(newObject);
      }
    });
  };

  for (var modelName in newObjects) {
    _loop(modelName);
  }

  return target;
};

/**
 * Get dependency list of a model among a list of models
 * @param  {Object} obj     The object which has a dependencies key
 * @param  {Array} models   The list of models to search in
 * @return {Array}
 */
var getDependencies = exports.getDependencies = function getDependencies(obj, models) {
  var deps = obj.dependencies || [];
  var dependencies = [];

  // For each dependency model

  var _loop2 = function _loop2(i) {
    var ids = [];

    // We loop in each model collection
    for (var k in models) {
      // If the dependency key is found, we get the id
      if (models[k][deps[i].key]) {
        // If multiple, we merge the list of ids
        if (deps[i].multiple) {
          ids = ids.concat(models[k][deps[i].key]);
        }
        // Or we add the id to the list
        else {
            ids.push(typeof models[k][deps[i].key] === 'number' ? models[k][deps[i].key] : models[k][deps[i].key][0]);
          }
      }
    }

    if (ids.length) {
      // We remove the duplicates
      ids = removeDuplicatesFromList(ids);

      var dependency = dependencies.find(function (dep) {
        return dep.model === deps[i].model;
      });

      // If the dependency already exists, we merge and remove the duplicates
      if (dependency) {
        dependency.ids = removeDuplicatesFromList(dependency.ids.concat(ids));
      }
      // Or we add it
      else {
          var _obj = _extends({}, deps[i], {
            ids: ids
          });

          _obj.key && delete _obj.key;
          _obj.multiple && delete _obj.multiple;

          dependencies.push(_obj);
        }
    }
  };

  for (var i in deps) {
    _loop2(i);
  }

  return dependencies;
};

var checkDependencies = exports.checkDependencies = function checkDependencies(obj, models) {
  var deps = obj.dependencies || [];
  var hasDependencies = false;

  for (var i in deps) {
    for (var k in models) {
      if (models[k][deps[i].key]) {
        hasDependencies = true;
        break;
      }
    }

    if (hasDependencies) {
      break;
    }
  }

  return hasDependencies;
};

var resolveDependencies = exports.resolveDependencies = function resolveDependencies(client, response) {
  return new Promise(function (resolve, reject) {
    var deps = [];
    for (var i in client.session.dependencies) {
      for (var name in response) {
        if (client.session.dependencies[i].name === name && checkDependencies(client.session.dependencies[i], response[name])) {
          deps.push(getDependencies(client.session.dependencies[i], response[name]));
        }
      }
    }

    var mergedDeps = [];
    if (deps.length) {
      (function () {
        // De-duplicate dependencies from model name
        for (var _i in deps) {
          var _loop3 = function _loop3(j) {
            var dep = deps[_i][j];
            var deepSearch = mergedDeps.filter(function (mergedDep) {
              return mergedDep.model === dep.model;
            });
            var idx = deepSearch.length ? mergedDeps.indexOf(deepSearch[0]) : -1;

            if (idx === -1) {
              mergedDeps.push(dep);
            } else {
              mergedDeps[idx].ids = mergedDeps[idx].ids.concat(dep.ids);
            }
          };

          for (var j in deps[_i]) {
            _loop3(j);
          }
        }

        // De-duplicate dependencies from model ids and create promises
        var promises = [];
        mergedDeps.forEach(function (dep) {
          if (response[dep.model]) {
            var _ids = dep.ids.filter(function (id) {
              var search = response[dep.model].reduce(function (prev, current) {
                return current.id === id ? current : prev;
              }, {});

              return search.id !== id;
            });

            dep.ids = _ids;
          }

          if (dep.ids.length) {
            dep.filters = (0, _utils.formatFilters)([], [["id", _operators.IN, dep.ids]]);
            delete dep.ids;

            promises.push(client.list(dep));
          }
        });

        if (promises.length) {
          resolvePromises(client, promises, response).then(function (responseWithDependencies) {
            resolve(deepMerge(response, responseWithDependencies));
          }).catch(function (error) {
            return reject(error);
          });
        } else {
          resolve(response);
        }
      })();
    } else {
      resolve(response);
    }
  });
};

var resolvePromises = exports.resolvePromises = function resolvePromises(client, promises) {
  var responseCache = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  return new Promise(function (resolve, reject) {
    Promise.all(promises).then(function (values) {
      var response = {};

      values.forEach(function (value) {
        if (value.model && value.result) {
          response[value.model] = value.result;
        }
      });

      resolveDependencies(client, deepMerge(responseCache, response)).then(function (responseWithDependencies) {
        resolve(responseWithDependencies);
      }).catch(function (error) {
        return reject(error);
      });
    }, function (error) {
      reject(error);
    });
  });
};