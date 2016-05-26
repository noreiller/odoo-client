'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolveDependencies = exports.checkDependencies = exports.getDependencies = exports.deepMerge = undefined;
exports.resolvePromises = resolvePromises;

var _operators = require('./operators');

var _utils = require('./utils');

const deepMerge = exports.deepMerge = (target, newObjets) => {
  for (let i in newObjets) {
    const modelName = i;
    const models = newObjets[i];

    for (let j in models) {
      const model = models[j];

      if (!target[modelName]) {
        target[modelName] = [];
      }

      if (target[modelName].filter(targetModel => targetModel.id === model.id).length === 0) {
        target[modelName].push(model);
      }
    }
  }

  return target;
};

const getDependencies = exports.getDependencies = (db, models) => {
  const deps = db.dependencies || [];
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
      dependencies.push({
        model: deps[i].db,
        ids
      });
    }
  }

  return dependencies;
};

const checkDependencies = exports.checkDependencies = (db, models) => {
  const deps = db.dependencies || [];
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
    for (let i in client.session.dbs) {
      for (let name in response) {
        if (client.session.dbs[i].name === name && checkDependencies(client.session.dbs[i], response[name])) {
          deps.push(getDependencies(client.session.dbs[i], response[name]));
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
              if (current.id === id) {
                return current;
              } else {
                return prev;
              }
            });

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

function resolvePromises(client, promises) {
  let responseCache = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  return new Promise((resolve, reject) => {
    Promise.all(promises).then(values => {
      let response = {};

      values.forEach(value => {
        response[value.model] = value.result;
      });

      resolveDependencies(client, deepMerge(responseCache, response)).then(responseWithDependencies => {
        resolve(responseWithDependencies);
      }).catch(error => reject(error));
    }, error => {
      reject(error);
    });
  });
}