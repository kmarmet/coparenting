// Path: src\database\DB.js
import Manager from '../managers/manager'
import {child, get, getDatabase, ref, remove, set, update} from 'firebase/database'
import _ from 'lodash'
import LogManager from '../managers/logManager.js'

const DB = {
  tables: {
    expenses: 'expenses',
    swapRequests: 'swapRequests',
    users: 'users',
    calendarEvents: 'calendarEvents',
    transferChangeRequests: 'transferChangeRequests',
    documents: 'documents',
    memories: 'memories',
    notificationSubscribers: 'notificationSubscribers',
    notifications: 'notifications',
    sharedChildInfo: 'sharedChildInfo',
    chatBookmarks: 'chatBookmarks',
    chats: 'chats',
    chatMessages: 'chatMessages',
    holidayEvents: 'holidayEvents',
    documentHeaders: 'documentHeaders',
    mapper: 'mapper',
  },
  find: async (arrayOrTable, matchArray, isFromDb = true, filterFunction = null) => {
    if (filterFunction) {
      if (isFromDb) {
        const records = await DB.getTable(arrayOrTable)
        return _.find(records, filterFunction)
      } else {
        return _.find(arrayOrTable, filterFunction)
      }
    }
    if (isFromDb) {
      const records = await DB.getTable(arrayOrTable)
      return _.find(records, matchArray)
    } else {
      return _.find(arrayOrTable, matchArray)
    }
  },
  convertKeyObjectToArray: (keyObject) => {
    // console.log(keyObject)
    if (Manager.isValid(keyObject)) {
      return Object.entries(keyObject).map((x) => x[1])
    } else {
      return []
    }
  },
  getSnapshotKey: async (path, objectToCheck, propertyToCompare = 'id') =>
    await new Promise((resolve) => {
      try {
        const dbRef = ref(getDatabase())
        get(child(dbRef, path)).then((snapshot) => {
          if (snapshot.exists()) {
            let key = _.findKey(snapshot.val(), [propertyToCompare, objectToCheck[propertyToCompare]])
            console.log(key)
            resolve(key)
          } else {
            console.log(`getSnapshotKey: snapshot does not exist | Path: ${path}`)
          }
        })
      } catch (error) {
        console.log(error.message)
        LogManager.log(error.message, LogManager.logTypes.error, error.stack)
      }
    }),
  getNestedSnapshotKey: async (recordPath, objectToCheck, propertyToCompare) =>
    await new Promise(async (resolve) => {
      const dbRef = ref(getDatabase())
      // await get(child(dbRef, recordPath)).then((snapshot) => {
      //   snapshot.val().forEach((obj) => {
      //     if (obj[propertyToCompare] === '4199615795') {
      //       console.log(snapshot.key)
      //       resolve(data.key)
      //     }
      //   })
      // })
      await DB.getTable(recordPath).then((data) => {
        if (Array.isArray(data)) {
          for (let prop in data) {
            if (data[prop][propertyToCompare] === objectToCheck[propertyToCompare]) {
              // console.log(prop)
              resolve(prop)
            }
          }
          data.forEach((obj) => {
            if (obj[propertyToCompare] === objectToCheck[propertyToCompare]) {
              resolve(data.key)
            }
          })
        } else {
          for (let prop in data) {
            if (data[prop][propertyToCompare] === objectToCheck[propertyToCompare]) {
              resolve(prop)
            }
          }
        }
      })
    }),
  add: async (path, data) =>
    await new Promise(async (resolve) => {
      const dbRef = ref(getDatabase())
      let tableData = []
      tableData = await DB.getTable(path)
      if (Manager.isValid(tableData)) {
        if (tableData.length > 0) {
          tableData = [...tableData, data].filter((item) => item)
        } else {
          tableData = [data]
        }
      }
      // tableData is NULL
      else {
        tableData = [data]
      }
      resolve('')
      try {
        await set(child(dbRef, path), tableData)
      } catch (error) {
        console.log(error.message)
        LogManager.log(error.message, LogManager.logTypes.error, error.stack)
      }
    }),
  addSingleRecord: async (path, record) => {
    const dbRef = ref(getDatabase())
    await set(child(dbRef, path), record).catch((error) => {})
  },
  addSuggestion: async (newSuggestion) => {
    const dbRef = ref(getDatabase())
    let currentSuggestions = await DB.getTable(DB.tables.suggestions)
    if (!Array.isArray(currentSuggestions)) {
      currentSuggestions = []
    }
    const existingSuggestion = currentSuggestions.filter((x) => x.ownerKey === newSuggestion.ownerKey && x.suggestion === newSuggestion.suggestion)[0]
    if (!existingSuggestion) {
      currentSuggestions = currentSuggestions.filter((n) => n)
      set(child(dbRef, `${DB.tables.suggestions}`), [...currentSuggestions, newSuggestion])
    }
  },
  delete: async (path, id) => {
    const dbRef = ref(getDatabase())
    let tableRecords = await DB.getTable(path)
    let rowToDelete = _.find(tableRecords, ['id', id], false)
    if (Manager.isValid(tableRecords, true)) {
      const deleteKey = await DB.getSnapshotKey(path, rowToDelete, 'id')
      if (Manager.isValid(deleteKey)) {
        try {
          await remove(child(dbRef, `${path}/${deleteKey}/`))
        } catch (error) {
          LogManager.log(error.message, LogManager.logTypes.error, error.stack)
        }
      }
    }
  },
  deleteMultipleRows: async function (path, rows, currentUser) {
    rows = Manager.convertToArray(rows)
    let dbRef = ref(getDatabase())
    let idToDelete
    if (Manager.isValid(rows)) {
      for (let row of rows) {
        idToDelete = await DB.getSnapshotKey(path, row, 'id')
        console.log(`${path} | ID to delete: ${idToDelete}`)
        if (Manager.isValid(idToDelete)) {
          try {
            await remove(child(dbRef, `${path}/${idToDelete}/`))
            console.log(`${path} record deleted`)
          } catch (error) {
            LogManager.log(error.message, LogManager.logTypes.error, error.stack)
          }
        }
      }
    }
  },
  deleteByPath: (path) => {
    const dbRef = ref(getDatabase())
    try {
      remove(child(dbRef, path))
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)
    }
  },
  deleteById: async (path, id) => {
    const dbRef = ref(getDatabase())
    let key = null
    const tableRecords = await DB.getTable(path)

    for (const record of tableRecords) {
      if (record?.id === id) {
        key = await DB.getSnapshotKey(path, record, 'id')
      }
    }

    try {
      remove(child(dbRef, `${path}/${key}`))
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)
    }
  },
  deleteMemory: async (userKey, memory) => {
    const dbRef = ref(getDatabase())
    const key = await DB.getSnapshotKey(`${DB.tables.memories}/${userKey}`, memory, 'id')
    try {
      remove(child(dbRef, `${DB.tables.memories}/${userKey}/${key}`))
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)
    }
  },
  getTable: async (path, returnObject = false) => {
    const dbRef = ref(getDatabase())
    let tableData = []
    await get(child(dbRef, path)).then((snapshot) => {
      tableData = snapshot.val()
    })
    let tableAsArray = Manager.convertToArray(tableData)
    tableAsArray = tableAsArray.filter((x) => x)
    return returnObject ? tableData : tableAsArray
  },
  updateByPath: async (path, newValue) => {
    const dbRef = ref(getDatabase())
    try {
      await set(child(dbRef, path), newValue)
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)
    }
  },
  updateRecord: async (tableName, currentUser, recordToUpdate, prop, value, propUid) => {
    const dbRef = ref(getDatabase())
    const tableRecords = Manager.convertToArray(await DB.getTable(tableName))
    let toUpdate
    if (propUid) {
      toUpdate = tableRecords.filter((x) => x[propUid] === recordToUpdate[propUid])[0]
    } else {
      toUpdate = tableRecords.filter((x) => x.id === recordToUpdate.id)[0]
    }
    console.log(toUpdate, prop)
    toUpdate[prop] = value
    try {
      // set(child(dbRef, tableName), tableRecords)
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)
    }
  },
  updateEntireRecord: async (path, updatedRow, id) => {
    try {
      const dbRef = getDatabase()
      let key = null
      const tableRecords = await DB.getTable(path)
      for (const record of tableRecords) {
        if (record?.id === id) {
          key = await DB.getSnapshotKey(path, record, 'id')
        }
      }
      await update(ref(dbRef, `${path}/${key}`), updatedRow)
        .then()
        .catch((error) => {
          console.log(error)
        })
      return await DB.getTable(`${path}/${key}`, true)
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)
    }
  },
}

export default DB