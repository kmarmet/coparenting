import Manager from '@manager'
import { child, get, getDatabase, ref, remove, set, update } from 'firebase/database'
import DB_UserScoped from '@userScoped'
import DatasetManager from '../managers/datasetManager'

const DB = {
  tables: {
    expenseTracker: 'expenseTracker',
    swapRequests: 'swapRequests',
    users: 'users',
    calendarEvents: 'calendarEvents',
    transferChangeRequests: 'transferChangeRequests',
    pushAlertSubscribers: 'pushAlertSubscribers',
    profilePics: 'profilePics',
    chats: 'chats',
    documents: 'documents',
    archivedChats: 'archivedChats',
    chatRecoveryRequests: 'chatRecoveryRequests',
    suggestions: 'suggestions',
    memories: 'memories',
    parentPermissionCodes: 'parentPermissionCodes',
  },
  runQuery: async (table, query) => {
    const records = await DB.getTable(table)
    return records.filter(query)
  },
  convertKeyObjectToArray: (keyObject) => {
    // console.log(keyObject)
    if (Manager.isValid(keyObject)) {
      return Object.entries(keyObject).map((x) => x[1])
    } else {
      return []
    }
  },
  getFlatTableKey: async (path, id) => {
    const records = await DB.getTable(path)
    let key
    records.forEach((record, index) => {
      if (record.id === id) {
        key = index
      }
    })
    return key
  },
  getAllFilteredRecords: async (path, currentUser, objectName, type = 'by-phone') => {
    const getRecords = new Promise(async (resolve, reject) => {
      const coparentPhones = currentUser?.coparents.map((x) => x.phone)

      // Records based on phone
      if (type === 'by-phone') {
        // Coparent Data
        let coparentRecords = []
        // let currentUserRecords = []

        const coparentsPromise = new Promise(async (resolve) => {
          let toReturn = []
          for (const coparentPhone of coparentPhones) {
            await DB_UserScoped.getCoparentByPhone(coparentPhone).then(async (coparentObj) => {
              let records = await DB_UserScoped.getRecordsByUser(path, coparentObj, objectName)
              records = Manager.convertToArray(records)
              if (records && records.length > 0) {
                records = records.filter((x) => x.shareWith.includes(coparentObj.phone) || x.shareWith.includes(currentUser.phone))
                toReturn.push(records)
              }
            })
          }
          resolve(toReturn)
        })

        coparentRecords = await coparentsPromise

        // Current user Records
        const currentUserRecords = Manager.convertToArray(await DB_UserScoped.getRecordsByUser(path, currentUser, objectName))
        const allRecords = currentUserRecords.concat(coparentRecords).flat()
        resolve(allRecords)
      }
      // Get root table (not dependent on user phone)
      else {
        if (path === DB.tables.documents) {
          await DB.getTable(DB.tables.documents).then((docs) => {
            if (docs && docs.length > 0) {
              docs.forEach((doc) => {
                if (doc.uploadedBy === currentUser.phone || coparentPhones.includes(doc.uploadedBy) || doc.shareWith.includes(doc.phone)) {
                  resolve(docs)
                }
              })
            }
          })
        }
      }
    })
    return await getRecords
  },
  getSnapshotKey: async (path, objectToCheck, propertyToCompare) =>
    await new Promise(async (resolve) => {
      const dbRef = ref(getDatabase())
      await get(child(dbRef, path)).then((snapshot) => {
        if (snapshot.exists()) {
          snapshot.forEach((event) => {
            if (event.val()[propertyToCompare] == objectToCheck[propertyToCompare]) {
              resolve(event.key)
            }
          })
        }
      })
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
      console.log(tableData)
      resolve('')
      await set(child(dbRef, path), tableData)
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
    if (Manager.isValid(tableRecords, true)) {
      const deleteKey = await DB.getFlatTableKey(path, id)
      if (Manager.isValid(deleteKey)) {
        await remove(child(dbRef, `${path}/${deleteKey}/`))
      }
    }
  },
  deleteMultipleRows: async function (table, rows, currentUser) {
    rows = DatasetManager.getUniqueArray(rows, true)
    console.log(rows)
    let dbRef, row, i, idToDelete, len
    dbRef = ref(getDatabase())
    if (Manager.isValid(rows, true)) {
      for (i = 0, len = rows.length; i < len; i++) {
        if (Manager.isValid(rows[i])) {
          row = rows[i]
          idToDelete = await DB.getSnapshotKey(table, row, 'id')
          if (Manager.isValid(idToDelete)) {
            await remove(child(dbRef, `${table}/${idToDelete}/`))
          }
        }
      }
    }
  },

  deleteByPath: (path) => {
    const dbRef = ref(getDatabase())
    remove(child(dbRef, path))
  },
  deleteImage: async (tableName, memory) => {
    const dbRef = ref(getDatabase())
    let toDeleteId
    const key = await DB.getSnapshotKey(tableName, memory, 'id')
    remove(child(dbRef, `${DB.tables.memories}/${toDeleteId}/`))
  },
  deleteMemory: async (phoneUid, memory) => {
    const dbRef = ref(getDatabase())
    const key = await DB.getSnapshotKey(`${DB.tables.memories}`, memory, 'id')
    remove(child(dbRef, `${DB.tables.memories}/${key}`))
  },
  removeShareWithAccess: async (path, currentUser, record) => {
    const shareWith = record.shareWith
    const dbShareWith = await DB.getTable(path)
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
    set(child(dbRef, path), newValue)
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
    set(child(dbRef, tableName), tableRecords)
  },
  updateEntireRecord: async (path, updatedRow) => {
    const dbRef = getDatabase()
    // ref(path).update(newRecord)
    update(ref(dbRef, path), updatedRow)
    // update((ref(dbRef, tableName), { newRecord }))
  },
}

export default DB