import { IN } from './operators'
import { formatFilters } from './utils'

export const deepMerge = (target, newObjets) => {
  for (let modelName in newObjets) {
    const models = newObjets[modelName]

    models.forEach((model) => {
      if (!target[modelName]) {
        target[modelName] = []
      }

      const targetModels = target[modelName].filter((targetModel) => targetModel.id === model.id)

      if (targetModels.length === 0) {
        target[modelName].push(model)
      }
      else if (targetModels.length === 1) {
        target[modelName][0] = {
          ...target[modelName][0],
          ...model,
        }
      }
    })
  }

  return target
}

/**
 * Get dependency list of a model among a list of models
 * @param  {Object} obj     The object which has a dependencies key
 * @param  {Array} models   The list of models to search in
 * @return {Array}
 */
export const getDependencies = (obj, models) => {
  const deps = obj.dependencies || []
  let dependencies = []

  for (let i in deps) {
    let ids = []

    for (let k in models) {
      if (models[k][deps[i].key]) {
        if (deps[i].multiple) {
          ids = ids.concat(models[k][deps[i].key])
        }
        else {
            ids.push(typeof models[k][deps[i].key] === 'number'
            ? models[k][deps[i].key]
            : models[k][deps[i].key][0]
          )
        }
      }
    }

    if (ids.length) {
      const dependency = dependencies.filter((dep) => {
        return dep.model === deps[i].model
      })

      if (dependency.length) {
        dependency[0].ids = dependency[0].ids.concat(ids)
      }
      else {
        dependencies.push({
          model: deps[i].model,
          ids,
        })
      }
    }
  }

  return dependencies
}

export const checkDependencies = (obj, models) => {
  const deps = obj.dependencies || []
  let hasDependencies = false

  for (let i in deps) {
    for (let k in models) {
      if (models[k][deps[i].key]) {
        hasDependencies = true
        break
      }
    }

    if (hasDependencies) {
      break
    }
  }

  return hasDependencies
}

export const resolveDependencies = (client, response) => {
  return new Promise((resolve, reject) => {
    let deps = []
    for (let i in client.session.dependencies) {
      for (let name in response) {
        if (
          client.session.dependencies[i].name === name
          && checkDependencies(client.session.dependencies[i], response[name])
        ) {
          deps.push(getDependencies(client.session.dependencies[i], response[name]))
        }
      }
    }

    let mergedDeps = []
    if (deps.length) {
      // De-duplicate dependencies from model name
      for (let i in deps) {
        for (let j in deps[i]) {
          let dep = deps[i][j]
          let deepSearch = mergedDeps.filter((mergedDep) => mergedDep.model === dep.model)
          let idx = deepSearch.length ? mergedDeps.indexOf(deepSearch[0]) : -1

          if (idx === -1) {
            mergedDeps.push(dep)
          }
          else {
            mergedDeps[idx].ids = mergedDeps[idx].ids.concat(dep.ids)
          }
        }
      }

      // De-duplicate dependencies from model ids and create promises
      let promises = []
      mergedDeps.forEach((dep) => {
        if (response[dep.model]) {
          let ids = dep.ids.filter((id) => {
            let search = response[dep.model].reduce((prev, current) => {
              return current.id === id ? current : prev
            }, {})

            return search.id !== id
          })

          dep.ids = ids
        }

        if (dep.ids.length) {
          dep.filters = formatFilters([], [["id", IN, dep.ids]])
          delete dep.ids

          promises.push(
            client.list(dep)
          )
        }
      })

      if (promises.length) {
        resolvePromises(client, promises, response)
          .then((responseWithDependencies) => {
            resolve(deepMerge(response, responseWithDependencies))
          })
          .catch((error) => reject(error))
      }
      else {
        resolve(response)
      }
    }
    else {
      resolve(response)
    }
  })
}

export const resolvePromises = (client, promises, responseCache = {}) => {
  return new Promise((resolve, reject) => {
    Promise.all(promises)
      .then((values) => {
        let response = {}

        values.forEach((value) => {
          if (value.model && value.result) {
            response[value.model] = value.result
          }
        })

        resolveDependencies(client, deepMerge(responseCache, response))
          .then((responseWithDependencies) => {
            resolve(responseWithDependencies)
          })
          .catch((error) => reject(error))
      }, (error) => {
        reject(error)
      })
  })
}
