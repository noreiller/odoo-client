'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolvePromises = exports.resolveDependencies = exports.checkDependencies = exports.getDependencies = exports.deepMerge = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _operators = require('./operators');

var _utils = require('./utils');

const deepMerge = exports.deepMerge = (target, newObjets) => {
  for (let modelName in newObjets) {
    const models = newObjets[modelName];

    models.forEach(model => {
      if (!target[modelName]) {
        target[modelName] = [];
      }

      const targetModels = target[modelName].filter(targetModel => targetModel.id === model.id);

      if (targetModels.length === 0) {
        target[modelName].push(model);
      } else if (targetModels.length === 1) {
        target[modelName][0] = _extends({}, target[modelName][0], model);
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

  for (let i in deps) {
    let ids = [];

    for (let k in models) {
      if (models[k][deps[i].key]) {
        if (deps[i].multiple) {
          ids = ids.concat(models[k][deps[i].key]);
        } else {
          ids.push(typeof models[k][deps[i].key] === 'number' ? models[k][deps[i].key] : models[k][deps[i].key][0]);
        }
      }
    }

    if (ids.length) {
      const dependency = dependencies.filter(dep => {
        return dep.model === deps[i].model;
      });

      if (dependency.length) {
        dependency[0].ids = dependency[0].ids.concat(ids);
      } else {
        dependencies.push(_extends({}, deps[i], {
          ids
        }));
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