import Manager from '@manager'
import { child, get, getDatabase, ref, remove, set, update } from 'firebase/database'
import DB_UserScoped from '@userScoped'

const DB = {
  tables: {
    expenseTracker: 'expenseTracker',
    swapRequests: 'swapRequests',
    users: 'users',
    calendarEvents: 'calendarEvents',
    transferChangeRequests: 'transferChangeRequests',
    inbox: 'inbox',
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
  getFlatTableKey: async (table, id) => {
    const records = Manager.convertToArray(await DB.getTable(table))
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
              let records = await DB_UserScoped.getRecordsByUser(tableName, coparentObj, objectName)
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
      console.log(path, objectToCheck, propertyToCompare)
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
  delete: async (tableName, id) => {
    const dbRef = ref(getDatabase())
    let tableRecords = await DB.getTable(tableName)
    if (Manager.isValid(tableRecords, true)) {
      const deleteKey = await DB.getFlatTableKey(tableName, id)
      await remove(child(dbRef, `${tableName}/${deleteKey}/`))
    }
  },

  deleteByPath: (path) => {
    const dbRef = ref(getDatabase())
    remove(child(dbRef, path))
  },
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
  addVisitationSchedule: async (newEvents) => {
    const dbRef = ref(getDatabase())
    let currentEvents = await DB.getTable(DB.tables.calendarEvents)
    if (!Array.isArray(currentEvents)) {
      currentEvents = []
    }
    // Delete Existing
    currentEvents.forEach((event) => {
      newEvents.forEach(async (newEvent) => {
        if (event.fromDate === newEvent.fromDate && event.title === newEvent.title) {
          await DB.delete(DB.tables.calendarEvents, event.id)
        }
      })
    })
    const eventsToAdd = [...currentEvents, [...newEvents]].filter((x) => x !== undefined).flat()
    set(child(dbRef, `${DB.tables.calendarEvents}`), eventsToAdd)
  },
  deleteImage: async (tableName, memory) => {
    const dbRef = ref(getDatabase())
    let toDeleteId
    const key = await DB.getSnapshotKey(tableName, memory, 'id')
    remove(child(dbRef, `${DB.tables.memories}/${toDeleteId}/`))
  },
  deleteMemory: async (phoneUid, memory) => {
    const dbRef = ref(getDatabase())
    const key = await DB.getSnapshotKey(`${DB.tables.memories}/${phoneUid}`, memory, 'id')
    remove(child(dbRef, `${DB.tables.memories}/${phoneUid}/${key}`))
  },
  getTable: async (path, returnObject = false) => {
    const dbRef = ref(getDatabase())
    let tableData = []
    await get(child(dbRef, path)).then((snapshot) => {
      tableData = snapshot.val()
    })
    return returnObject ? tableData : Manager.convertToArray(tableData)
  },
  updateIsAvailable: async (tableName) => {
    const dbRef = ref(getDatabase())
    let available = false
    await get(child(dbRef, '/updateAvailable')).then((snapshot) => {
      available = snapshot.val()
    })
    return available
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
    console.log(prop)
    console.log(toUpdate[prop])
    console.log(tableRecords)
    toUpdate[prop] = value
    set(child(dbRef, tableName), tableRecords)
  },
  updateEntireRecord: async (path, newRecord) => {
    const dbRef = getDatabase()
    // ref(path).update(newRecord)
    console.log(newRecord)
    update(ref(dbRef, path), newRecord)
    // update((ref(dbRef, tableName), { newRecord }))
  },
}

export default DB
