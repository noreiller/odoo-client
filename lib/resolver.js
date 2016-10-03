'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolvePromises = exports.resolveDependencies = exports.checkDependencies = exports.getDependencies = exports.deepMerge = exports.removeDuplicatesFromList = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _operators = require('./operators');

var _utils = require('./utils');

const removeDuplicatesFromList = exports.removeDuplicatesFromList = list => {
  return list.reduce((prev, next) => {
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
const deepMerge = exports.deepMerge = (target, newObjects) => {
  for (let modelName in newObjects) {
    newObjects[modelName].forEach(newObject => {
      // Create the model list if it not exists
      if (!target[modelName]) {
        target[modelName] = [];
      }

      // Find an existing ID
      const existingTarget = target[modelName].find(targetModel => targetModel.id === newObject.id);

      if (existingTarget) {
        target[modelName][target[modelName].indexOf(existingTarget)] = _extends({}, existingTarget, newObject);
      } else {
        target[modelName].push(newObject);
      }
    });
  }

  return target;
};

/**
 * Get dependency list of a model among a list of models
 * @param  {Object} obj     The object which has a dependencies key
 * @param  {Array} models   The list of models to search in
 * @return {Array}
 */
const getDependencies = exports.getDependencies = (obj, models) => {
  const deps = obj.dependencies || [];
  let dependencies = [];

  // For each dependency model
  for (let i in deps) {
    let ids = [];

    // We loop in each model collection
    for (let k in models) {
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

      const dependency = dependencies.find(dep => dep.model === deps[i].model);

      // If the dependency already exists, we merge and remove the duplicates
      if (dependency) {
        dependency.ids = removeDuplicatesFromList(dependency.ids.concat(ids));
      }
      // Or we add it
      else {
          const obj = _extends({}, deps[i], {
            ids
          });

          obj.key && delete obj.key;
          obj.multiple && delete obj.multiple;

          dependencies.push(obj);
        }
    }
  }

  return dependencies;
};

const checkDependencies = exports.checkDependencies = (obj, models) => {
  const deps = obj.dependencies || [];
  let hasDependencies = false;

  for (let i in deps) {
    for (let k in models) {
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

const resolveDependencies = exports.resolveDependencies = (client, response) => {
  return new Promise((resolve, reject) => {
    let deps = [];
    for (let i in client.session.dependencies) {
      for (let name in response) {
        if (client.session.dependencies[i].name === name && checkDependencies(client.session.dependencies[i], response[name])) {
          deps.push(getDependencies(client.session.dependencies[i], response[name]));
        }
      }
    }

    let mergedDeps = [];
    if (deps.length) {
      // De-duplicate dependencies from model name
      for (let i in deps) {
        for (let j in deps[i]) {
          let dep = deps[i][j];
          let deepSearch = mergedDeps.filter(mergedDep => mergedDep.model === dep.model);
          let idx = deepSearch.length ? mergedDeps.indexOf(deepSearch[0]) : -1;

          if (idx === -1) {
            mergedDeps.push(dep);
          } else {
            mergedDeps[idx].ids = mergedDeps[idx].ids.concat(dep.ids);
          }
        }
      }

      // De-duplicate dependencies from model ids and create promises
      let promises = [];
      mergedDeps.forEach(dep => {
        if (response[dep.model]) {
          let ids = dep.ids.filter(id => {
            let search = response[dep.model].reduce((prev, current) => {
              return current.id === id ? current : prev;
            }, {});

            return search.id !== id;
          });

          dep.ids = ids;
        }

        if (dep.ids.length) {
          dep.filters = (0, _utils.formatFilters)([], [["id", _operators.IN, dep.ids]]);
          delete dep.ids;

          promises.push(client.list(dep));
        }
      });

      if (promises.length) {
        resolvePromises(client, promises, response).then(responseWithDependencies => {
          resolve(deepMerge(response, responseWithDependencies));
        }).catch(error => reject(error));
      } else {
        resolve(response);
      }
    } else {
      resolve(response);
    }
  });
};

const resolvePromises = exports.resolvePromises = function resolvePromises(client, promises) {
  let responseCache = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  return new Promise((resolve, reject) => {
    Promise.all(promises).then(values => {
      let response = {};

      values.forEach(value => {
        if (value.model && value.result) {
          response[value.model] = value.result;
        }
      });

      resolveDependencies(client, deepMerge(responseCache, response)).then(responseWithDependencies => {
        resolve(responseWithDependencies);
      }).catch(error => reject(error));
    }, error => {
      reject(error);
    });
  });
};