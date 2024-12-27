import Manager from '@manager'
import { child, get, getDatabase, ref, remove, set, update } from 'firebase/database'
import _ from 'lodash'
import LogManager from '../managers/logManager'

const DB = {
  tables: {
    expenseTracker: 'expenseTracker',
    swapRequests: 'swapRequests',
    users: 'users',
    calendarEvents: 'calendarEvents',
    transferChangeRequests: 'transferChangeRequests',
    chats: 'chats',
    documents: 'documents',
    archivedChats: 'archivedChats',
    chatRecoveryRequests: 'chatRecoveryRequests',
    suggestions: 'suggestions',
    memories: 'memories',
    parentPermissionCodes: 'parentPermissionCodes',
    notificationSubscribers: 'notificationSubscribers',
    activities: 'activities',
    sharedChildInfo: 'sharedChildInfo',
  },
  find: async (arrayOrTable, matchArray, isFromDb = true) => {
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
    await new Promise(async (resolve) => {
      try {
        const dbRef = ref(getDatabase())
        await get(child(dbRef, path)).then((snapshot) => {
          if (snapshot.exists()) {
            let row = _.findKey(snapshot.val(), [propertyToCompare, objectToCheck[propertyToCompare]])
            // console.log(row)
            resolve(row)
            // snapshot.forEach((event) => {
            //   if (event.val()[propertyToCompare] == objectToCheck[propertyToCompare]) {
            //     resolve(event.key)
            //   }
            // })
          }
        })
      } catch (error) {
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
      if (Manager.isValid(tableData, true)) {
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
  addSuggestion: async (newSuggestion) => {
    const dbRef = ref(getDatabase())
    let currentSuggestions = await DB.getTable(DB.tables.suggestions)
    if (!Array.isArray(currentSuggestions)) {
      currentSuggestions = []
    }
    const existingSuggestion = currentSuggestions.filter(
      (x) => x.ownerPhone === newSuggestion.ownerPhone && x.suggestion === newSuggestion.suggestion
    )[0]
    if (!existingSuggestion) {
      currentSuggestions = currentSuggestions.filter((n) => n)
      set(child(dbRef, `${DB.tables.suggestions}`), [...currentSuggestions, newSuggestion])
    }
  },
  delete: async (path, id) => {
    const dbRef = ref(getDatabase())
    let tableRecords = await DB.getTable(path)
    let rowToDelete = _.find(tableRecords, ['id', id])
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
  deleteMultipleRows: async function (table, rows, currentUser) {
    rows = Manager.convertToArray(rows)
    let dbRef = ref(getDatabase())
    let idToDelete
    if (Manager.isValid(rows, true)) {
      for (let row of rows) {
        idToDelete = await DB.getSnapshotKey(table, row, 'id')
        console.log(`${table} | ID to delete: ${idToDelete}`)
        if (Manager.isValid(idToDelete)) {
          try {
            await remove(child(dbRef, `${table}/${idToDelete}/`))
            console.log(`${table} record deleted`)
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
  deleteMemory: async (phoneUid, memory) => {
    const dbRef = ref(getDatabase())
    const key = await DB.getSnapshotKey(`${DB.tables.memories}`, memory, 'id')
    try {
      remove(child(dbRef, `${DB.tables.memories}/${key}`))
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
    return returnObject ? tableData : Manager.convertToArray(tableData)
  },
  updateByPath: (path, newValue) => {
    const dbRef = ref(getDatabase())
    try {
      set(child(dbRef, path), newValue)
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)
    }
  },
  updateRecord: async (tableName, recordToUpdate, prop, value, identifier) => {
    const dbRef = ref(getDatabase())
    const tableRecords = Manager.convertToArray(await DB.getTable(tableName))
    let toUpdate
    if (identifier && identifier !== undefined) {
      toUpdate = tableRecords.filter((x) => x[identifier] === recordToUpdate[identifier])[0]
    } else {
      toUpdate = tableRecords.filter((x) => x.id === recordToUpdate.id)[0]
    }
    toUpdate[prop] = value
    try {
      set(child(dbRef, tableName), tableRecords)
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)
    }
  },
  updateEntireRecord: async (path, updatedRow) => {
    const dbRef = getDatabase()
    try {
      update(ref(dbRef, path), updatedRow)
    } catch (error) {
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)
    }
  },
}

export default DB