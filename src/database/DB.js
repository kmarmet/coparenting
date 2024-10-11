import Manager from '@manager'
import { child, get, getDatabase, push, ref, remove, set, update } from 'firebase/database'
import FirebaseStorage from './firebaseStorage'
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
  },
  runQuery: async (table, query) => {
    const records = await DB.getTable(table)
    return records.filter(query)
  },
  recordExists: async (tableName, record, identifier) =>
    await new Promise(async (resolve) => {
      const dbRef = ref(getDatabase())
      await get(child(dbRef, tableName)).then((snapshot) => {
        if (snapshot.exists()) {
          snapshot.val().forEach((shot) => {
            if (shot[identifier] === record[identifier]) {
              resolve(true)
            }
          })
        }
      })
    }),
  convertKeyObjectToArray: (keyObject) => {
    // console.log(keyObject)
    if (Manager.isValid(keyObject)) {
      return Object.entries(keyObject).map((x) => x[1])
    } else {
      return []
    }
  },
  convertFirebaseObjectToObject: (firebaseObject) => {
    return Object.entries(firebaseObject).flat()[1]
  },
  getFilteredRecords: async (records, currentUser) => {
    let returnRecords = []
    if (records && records !== undefined && records.length > 0) {
      // Handle child records
      if (Manager.isValid(currentUser.accountType) && currentUser.accountType === 'child') {
        records.forEach((record, index) => {
          // Filter by phone
          record.shareWith.push(currentUser.phone)
          const mergedPhoneArrays = Manager.getUniqueArray(record.shareWith).flat()
          if (mergedPhoneArrays.includes(currentUser.phone) || record.phone === currentUser.phone) {
            returnRecords.push(record)
          }
        })
      }
      // Handle parent records
      else {
        const coparentPhones = currentUser.coparents.map((x) => x.phone)
        records.forEach((record, index) => {
          // Filter by phone
          const mergedPhoneArrays = Manager.getUniqueArray(coparentPhones.concat(record.shareWith)).flat()
          if (mergedPhoneArrays.includes(currentUser.phone) || record.phone === currentUser.phone) {
            returnRecords.push(record)
          }
        })
      }
    }
    return returnRecords
  },
  getAllFilteredRecords: async (tableName, currentUser, objectName, type = 'by-phone') => {
    const getRecords = new Promise(async (resolve, reject) => {
      const coparentPhones = currentUser.coparents.map((x) => x.phone)

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
        const currentUserRecords = Manager.convertToArray(await DB_UserScoped.getRecordsByUser(tableName, currentUser, objectName))
        const allRecords = currentUserRecords.concat(coparentRecords).flat()
        resolve(allRecords)
      }
      // Get root table (not dependent on user phone)
      else {
        if (tableName === DB.tables.documents) {
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
  getSnapshotKey: async (tableName, objectToCheck, propertyToCompare) =>
    await new Promise(async (resolve) => {
      const dbRef = ref(getDatabase())
      await get(child(dbRef, tableName)).then((snapshot) => {
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
  add: async (tableName, data) =>
    await new Promise(async (resolve) => {
      const dbRef = ref(getDatabase())
      let tableData = []
      tableData = await DB.getTable(tableName)
      tableData = Manager.convertToArray(tableData)
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
      await set(child(dbRef, tableName), tableData)
    }),
  addToUserMemories: async (currentUser, objectName, value, id) => {
    const dbRef = ref(getDatabase())
    let tableRecords = await DB.getTable(DB.tables.users)
    tableRecords = DB.convertKeyObjectToArray(tableRecords)
    let toUpdate = tableRecords.filter((x) => x.phone === currentUser.phone)[0]
    if (toUpdate[objectName] !== undefined && toUpdate[objectName].length > 0) {
      toUpdate[objectName] = [...toUpdate[objectName], value]
    } else {
      toUpdate[objectName] = [value]
    }
    if (id) {
      await push(child(dbRef, `/users/${currentUser.phone}/${objectName}/${id}/`), value)
      return toUpdate[objectName]
    } else {
      await push(child(dbRef, `/users/${currentUser.phone}/${objectName}`), value)
      return toUpdate[objectName]
    }
  },
  addProfilePicToChildRecord: async (currentUser, objectName, value, id) => {
    const dbRef = ref(getDatabase())
    let basePath = `${DB.tables.users}/${currentUser.phone}/children`
    await get(child(dbRef, basePath)).then(async (snapshot) => {
      let key = null
      snapshot.forEach((child) => {
        if (child.val().id === id) {
          key = child.key
        }
      })
      basePath = `${basePath}/${key}/profilePic/`
      await FirebaseStorage.getProfilePicUrl(FirebaseStorage.directories.profilePics, id, value).then(async (urls) => {
        set(child(dbRef, basePath), urls)
      })
    })
  },
  delete: async (tableName, id) => {
    const dbRef = ref(getDatabase())
    let idToDelete
    let tableRecords = await DB.getTable(tableName)
    if (Manager.isValid(tableRecords, true)) {
      if (!Array.isArray(tableRecords)) {
        tableRecords = DB.convertKeyObjectToArray(tableRecords)
      }
      for (const record of tableRecords) {
        const index = tableRecords.indexOf(record)
        if (record && record.id === id) {
          idToDelete = await DB.getSnapshotKey(tableName, record, 'id')
          remove(child(dbRef, `${tableName}/${idToDelete}/`))
        }
      }
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
  getTable: async (tableName) => {
    const dbRef = ref(getDatabase())
    let tableData = []
    await get(child(dbRef, tableName)).then((snapshot) => {
      tableData = snapshot.val()
    })
    return tableData
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
    const tableRecords = DB.convertKeyObjectToArray(await DB.getTable(tableName))
    let toUpdate
    if (identifier && identifier !== undefined) {
      toUpdate = tableRecords.filter((x) => x[identifier] === recordToUpdate[identifier])[0]
    } else {
      toUpdate = tableRecords.filter((x) => x.id === recordToUpdate.id)[0]
    }
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
  deleteChildInfoProp: async (tableName, currentUser, prop, parentObjectName, selectedChild) => {
    const dbRef = ref(getDatabase())
    let removalKey
    await get(child(dbRef, `${tableName}/${currentUser.phone}/children/`)).then((snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((event) => {
          let child = event.val()
          if (child['general'].name === selectedChild['general'].name) {
            removalKey = event.key
          }
        })
      }
      remove(child(dbRef, `${tableName}/${currentUser.phone}/children/${removalKey}/${parentObjectName}/${prop}`))
    })
  },
  deleteCoparentInfoProp: async (tableName, currentUser, prop, selectedCoparent) => {
    const dbRef = ref(getDatabase())
    let removalKey
    await get(child(dbRef, `${tableName}/${currentUser.phone}/coparents/`)).then((snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((event) => {
          let coparent = event.val()
          if (coparent.phone === selectedCoparent.phone) {
            removalKey = event.key
          }
        })
      }
      remove(child(dbRef, `${tableName}/${currentUser.phone}/coparents/${removalKey}/${prop}`))
    })
  },
  updatePhoneOrEmail: async (currentUser, prop, valueObject) => {
    const { phone, email } = valueObject
    const dbRef = ref(getDatabase())

    // Update archivedChats
    await DB.getTable(DB.tables.archivedChats).then(async (archivedChats) => {
      if (!Array.isArray(archivedChats)) {
        archivedChats = DB.convertKeyObjectToArray(archivedChats)
      }
      if (archivedChats && archivedChats.length > 0) {
        for (const chat of archivedChats) {
          // UPDATE firstMessageFrom
          if (chat.firstMessageFrom === currentUser.phone) {
            chat['firstMessageFrom'] = phone
            // await update(fmfRef, fmfChat)
          }

          // UPDATE MEMBER PHONES
          const members = chat['members']
          members.forEach((thisMember, memberIndex) => {
            if (thisMember.phone === currentUser.phone) {
              thisMember['phone'] = phone
            }
          })
          // replace with set()
          // await update(updateMemberPath, updatedMember)
        }
      }
    })

    // Update swap requests table
    await DB.getTable(DB.tables.swapRequests).then((data) => {
      if (!Array.isArray(data)) {
        data = DB.convertKeyObjectToArray(data)
      }
      if (data && data.length > 0) {
        data.forEach((request, index) => {
          // Update shareWith
          if (request.shareWith.includes(currentUser.phone)) {
            const numberIndex = request.shareWith.indexOf(currentUser.phone)
            request.shareWith[numberIndex] = phone
          }
          // Update record phone
          if (request['phone'] === currentUser.phone) {
            request['phone'] = phone
          }
        })
        // console.log(data);
        // set(child(dbRef, tableName), data)
      }
    })

    // Update expenseTracker table
    await DB.getTable(DB.tables.expenseTracker).then((data) => {
      if (!Array.isArray(data)) {
        data = DB.convertKeyObjectToArray(data)
      }
      if (data && data.length > 0) {
        data.forEach((request) => {
          // Update user expenseTracker
          if (request['phone'] === currentUser.phone) {
            request['phone'] = phone
          }
          if (request.shareWith.includes(currentUser.phone)) {
            const numberIndex = request.shareWith.indexOf(currentUser.phone)
            request.shareWith[numberIndex] = phone
          }
        })
        // set(child(dbRef, tableName), data);
      }
    })

    // Update cal table
    await DB.getTable(DB.tables.calendarEvents).then((data) => {
      if (!Array.isArray(data)) {
        data = DB.convertKeyObjectToArray(data)
      }
      if (data && data.length > 0) {
        data.forEach((event) => {
          // Update user cal
          if (event['phone'] === currentUser.phone) {
            event['phone'] = phone
          }

          if (event.shareWith.includes(currentUser.phone)) {
            const numberIndex = event.shareWith.indexOf(currentUser.phone)
            event.shareWith[numberIndex] = phone
          }
        })
        // console.log(data);
        // set(child(dbRef, tableName), data);
      }
    })

    // Update chats table
    await DB.getTable(DB.tables.chats).then(async (chats) => {
      if (!Array.isArray(chats)) {
        chats = DB.convertKeyObjectToArray(chats)
      }
      const database = getDatabase()
      if (chats && chats.length > 0) {
        for (const chat of chats) {
          // UPDATE firstMessageFrom
          if (chat.firstMessageFrom === currentUser.phone) {
            chat['firstMessageFrom'] = phone
            // await update(fmfRef, fmfChat)
          }

          // UPDATE MEMBER PHONES
          const members = chat['members']
          members.forEach((thisMember, memberIndex) => {
            if (thisMember.phone === currentUser.phone) {
              thisMember['phone'] = phone
            }
          })
          // replace with set()
          // await update(updateMemberPath, updatedMember)
        }
      }
    })

    // Update coparents table
    await DB.getTable(DB.tables.users).then((users) => {
      if (users && users.length > 0) {
        users.forEach((user) => {
          user.coparents.forEach((coparent) => {
            if (coparent[phone] === currentUser.phone) {
              coparent[phone] = phone
            }
          })
        })
        // set(child(dbRef, tableName), data);
      }
    })

    // Update user phone
    await DB_UserScoped.updateUserRecord(currentUser, 'phone', phone)
  },
}

export default DB
