import Manager from '@manager'
import { child, get, getDatabase, push, ref, remove, set, update } from 'firebase/database'
import FirebaseStorage from './firebaseStorage'
import DB from '@db'
import {
  contains,
  displayAlert,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../globalFunctions'

const DB_UserScoped = {
  // GET
  getCurrentUserRecords: (tableName, currentUser, objectName) => {
    return new Promise((resolve, reject) => {
      DB_UserScoped.getRecordsByUser(tableName, currentUser, objectName)
        .then((currentUserRecord) => {
          if (!Array.isArray(currentUserRecord)) {
            currentUserRecord = Manager.convertToArray(currentUserRecord)
            currentUserRecord = currentUserRecord.map((x) => {
              x.canDelete = true
              return x
            })
          }
          if (currentUserRecord !== undefined) {
            resolve(currentUserRecord)
          } else {
            resolve([])
          }
        })
        .catch((error) => {
          //
        })
    })
  },
  getAllUserRecords: (tableName, currentUser, objectName) => {
    return new Promise((resolve, reject) => {
      DB.getRecordsByUser(tableName, currentUser, objectName)
        .then((currentUserRecord) => {
          if (!Array.isArray(currentUserRecord)) {
            currentUserRecord = Manager.convertToArray(currentUserRecord)
            currentUserRecord = currentUserRecord.map((x) => {
              x.canDelete = true
              return x
            })
          }
          if (currentUserRecord !== undefined) {
            resolve(currentUserRecord)
          } else {
            resolve([])
          }
        })
        .catch((error) => {
          //
        })
    })
  },
  getPropFromUserRecord: (tableName, currentUser, propPath) =>
    new Promise(async (resolve) => {
      const dbRef = ref(getDatabase())
      await get(child(dbRef, `${tableName}/${currentUser.phone}/${propPath}`)).then((snapshot) => {
        let propValue = snapshot.val()
        resolve(propValue || [])
      })
    }),
  getUser: async (tableName, phoneNumber) => {
    const dbRef = ref(getDatabase())
    let tableData = []
    await get(child(dbRef, `${tableName}/${phoneNumber}`)).then((snapshot) => {
      tableData = snapshot.val()
    })
    return tableData
  },
  getUserFromName: async (userName) => {
    let user
    await DB.getTable(DB.tables.users).then((users) => {
      if (!Array.isArray(users)) {
        users = Manager.convertToArray(users)
      }
      user = users.filter((x) => x.name.formatNameFirstNameOnly() === userName.formatNameFirstNameOnly())[0].phone
    })

    return user
  },
  getUserImages: async (tableName, currentUser, objectName) => {
    const dbRef = ref(getDatabase())
    let tableData = []
    await get(child(dbRef, `${tableName}/${currentUser.phone}/${objectName}`)).then((snapshot) => {
      tableData = snapshot.val()
    })
    return tableData
  },
  getRecordsByUser: async (tableName, currentUser, objectName) => {
    return new Promise(async (resolve, reject) => {
      const dbRef = ref(getDatabase())
      await get(child(dbRef, `${tableName}/${currentUser.phone}/${objectName}`))
        .then((snapshot) => {
          if (snapshot.exists()) {
            // console.log("if");
            resolve(snapshot.val())
          } else {
            resolve([])
          }
        })
        .catch((error) => {
          reject(error)
        })
    })
  },
  getCoparentByPhone: async (coparentPhone, currentUser, getBioCoparent) => {
    return new Promise(async (resolve, reject) => {
      const dbRef = ref(getDatabase())
      await get(child(dbRef, `users`)).then((snapshot) => {
        if (snapshot.exists()) {
          const tableData = Manager.convertToArray(snapshot.val())
          if (snapshot.exists() && tableData.length > 0) {
            tableData.forEach((firebaseUser) => {
              if (firebaseUser.phone === coparentPhone) {
                resolve(firebaseUser)
              }
            })
          }
        }
      })
    })
  },

  // ADD
  addMultipleExpenses: async (data) => {
    const dbRef = ref(getDatabase())
    const currentExpenses = await DB.getTable(DB.tables.expenseTracker)
    const toAdd = [...currentExpenses, [...data]].filter((x) => x !== undefined).flat()
    set(child(dbRef, `${DB.tables.expenseTracker}`), toAdd).catch((error) => {})
  },
  addUser: async (newUser) => {
    const dbRef = ref(getDatabase())
    const currentUsers = await DB.getTable(DB.tables.users)
    const toAdd = [...currentUsers, [...newUser]].filter((x) => x !== undefined).flat()
    set(child(dbRef, `${DB.tables.users}`), toAdd).catch((error) => {})
  },
  addCoparent: async (currentUser, newCoparent) => {
    const updatedCoparents = [...currentUser?.coparents, newCoparent]
    await DB_UserScoped.updateUserRecord(currentUser.id, '/coparents', updatedCoparents)
  },
  addUserChild: async (currentUser, newChild) => {
    const dbRef = ref(getDatabase())
    const currentChildren = await DB_UserScoped.getCurrentUserRecords(DB.tables.users, currentUser, 'children')
    await set(child(dbRef, `users/${currentUser.phone}/children`), [...currentChildren, newChild])
  },
  addToUserMemories: async (currentUser, objectName, value, id) => {
    const dbRef = ref(getDatabase())
    let tableRecords = await DB.getTable(DB.tables.users)
    tableRecords = Manager.convertToArray(tableRecords)
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
  addUserChildProp: async (currentUser, activeChild, infoSection, prop, value) => {
    const dbRef = ref(getDatabase())
    console.log(activeChild)
    let key = await DB.getNestedSnapshotKey(`users/${currentUser.phone}/children/`, activeChild, 'id')
    if (key !== null) {
      await set(child(dbRef, `users/${currentUser.phone}/children/${key}/${infoSection}/${prop}`), `${value}`)
    }
    const returnChild = await DB.getTable(`users/${currentUser.phone}/children/${key}`, true)
    return returnChild
  },
  addCoparentProp: async (currentUser, coparent, prop, value) => {
    const dbRef = ref(getDatabase())
    let key = await DB.getNestedSnapshotKey(`users/${currentUser.phone}/coparents/`, coparent, 'id')
    if (key !== null) {
      await set(child(dbRef, `users/${currentUser.phone}/coparents/${key}/${prop}`), `${value}`)
    }
    const returnChild = await DB.getTable(`users/${currentUser.phone}/children/${key}`, true)
    return returnChild
  },

  // UPDATE
  updateUserProp: async (currentUser, parentObjectName, prop, value) => {
    const database = getDatabase()
    let dbRef
    if (Manager.isValid(parentObjectName)) {
      console.log(`${DB.tables.users}/${currentUser.phone}/${parentObjectName}`)
      dbRef = ref(database, `${DB.tables.users}/${currentUser.phone}/${parentObjectName}`)
    } else {
      dbRef = ref(database, `${DB.tables.users}/${currentUser.phone}`)
    }
    update(dbRef, { [prop]: value })
  },
  updateUserChild: async (currentUser, activeChild, section, prop, value) => {
    const dbRef = ref(getDatabase())
    let key = await DB.getNestedSnapshotKey(`users/${currentUser.phone}/children/`, activeChild, 'id')
    await set(child(dbRef, `users/${currentUser.phone}/children/${key}/${section}/${prop}`), value)
    const returnChild = await DB.getTable(`users/${currentUser.phone}/children/${key}`, true)
    return returnChild
  },
  updateCoparent: async (currentUser, coparent, prop, value) => {
    const dbRef = ref(getDatabase())
    let key = await DB.getNestedSnapshotKey(`users/${currentUser.phone}/coparents/`, coparent, 'id')
    await set(child(dbRef, `users/${currentUser.phone}/coparents/${key}/${prop}`), value)
    const returnChild = await DB.getTable(`users/${currentUser.phone}/coparents/${key}`, true)
    return returnChild
  },
  updateUserRecord: async (phoneUid, propPath, value) => {
    const dbRef = ref(getDatabase())
    await set(child(dbRef, `${DB.tables.users}/${phoneUid}/${propPath}`), value)
  },
  updateByPath: (path, newValue) => {
    const dbRef = ref(getDatabase())
    set(child(dbRef, path), newValue)
  },
  updateUserContactInfo: async (currentUser, currentValue, updatedValue, propNameToUpdate) => {
    const dbRef = ref(getDatabase())

    let allData
    await get(dbRef).then((snapshot) => {
      allData = snapshot.val()
    })

    let updatedEmailRecords, updatedPhoneRecords

    if (propNameToUpdate === 'email') {
      updatedEmailRecords = DB_UserScoped.recursiveObjectUpdate(allData, currentValue, updatedValue, propNameToUpdate)
    }

    if (propNameToUpdate === 'phone') {
      updatedPhoneRecords = DB_UserScoped.recursiveObjectUpdate(allData, currentValue, updatedValue, propNameToUpdate)
    }

    const updatedDatabase = { ...updatedEmailRecords, ...updatedPhoneRecords }
    console.log(updatedDatabase)
    await set(dbRef, updatedDatabase)
  },

  // DELETE
  deleteChildInfoProp: async (tableName, currentUser, prop, parentObjectName, selectedChild) => {
    const dbRef = ref(getDatabase())
    let removalKey
    await get(child(dbRef, `users/${currentUser.phone}/children/`)).then(async (snapshot) => {
      if (snapshot.exists()) {
        snapshot.val().forEach((child, index) => {
          if (child.general?.name === selectedChild.general?.name) {
            removalKey = index
          }
        })
      }
      await remove(child(dbRef, `${tableName}/${currentUser.phone}/children/${removalKey}/${parentObjectName}/${prop.toLowerCase()}`))
    })
  },
  deleteCoparentInfoProp: async (currentUser, prop, coparent) => {
    const dbRef = ref(getDatabase())
    let removalKey = await DB.getNestedSnapshotKey(`users/${currentUser.phone}/coparents/`, coparent, 'id')
    await remove(child(dbRef, `users/${currentUser.phone}/coparents/${removalKey}/${prop}`))
  },
  deleteUserChildPropByPath: async (currentUser, activeChild, section, prop) => {
    const dbRef = ref(getDatabase())
    let key = await DB.getNestedSnapshotKey(`users/${currentUser.phone}/children/`, activeChild, 'id')
    await DB.deleteByPath(`/users/${currentUser.phone}/children/${key}/${section}/${prop}`)
    const returnChild = await DB.getTable(`users/${currentUser.phone}/children/${key}`, true)
    return returnChild
  },
  deleteCoparent: async (currentUser, coparent) => {
    const dbRef = ref(getDatabase())

    const key = await DB.getNestedSnapshotKey(`users/${currentUser.phone}/coparents`, coparent, 'id')
    await remove(child(dbRef, `users/${currentUser.phone}/coparents/${key}`))
  },

  // MISC.
  recursiveObjectUpdate: (obj, currentValue, updatedValue, propNameToUpdate) => {
    let updatedObject
    for (const key in obj) {
      if (key === 'pushAlertSubscribers' && propNameToUpdate === 'phone') {
        let updatedPushAlertSubs = {}
        for (let prop in obj[key]) {
          if (prop === currentValue) {
            prop = updatedValue
            updatedPushAlertSubs[prop] = obj[key][currentValue]
          } else {
            updatedPushAlertSubs[prop] = obj[key][currentValue]
          }
        }
        obj['pushAlertSubscribers'] = updatedPushAlertSubs
      }
      if (key === 'users' && propNameToUpdate === 'phone') {
        let updatedUsers = {}
        for (let prop in obj[key]) {
          if (prop === currentValue) {
            prop = updatedValue
            updatedUsers[prop] = obj[key][currentValue]
          } else {
            updatedUsers[prop] = obj[key][currentValue]
          }
        }
        obj['users'] = updatedUsers
      }

      if (obj.hasOwnProperty(key)) {
        const value = obj[key]
        if (value === currentValue) {
          obj[key] = updatedValue
        }

        if (typeof value === 'object' && value !== null) {
          // Recursively iterate over nested objects
          DB_UserScoped.recursiveObjectUpdate(value, currentValue, updatedValue)
        }
      }
    }
    updatedObject = obj
    return updatedObject
  },
}

export default DB_UserScoped
