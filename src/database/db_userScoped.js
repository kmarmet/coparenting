import Manager from '@manager'
import { child, get, getDatabase, push, ref, remove, set, update } from 'firebase/database'
import FirebaseStorage from './firebaseStorage'
import DB from '@db'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  displayAlert,
  uniqueArray,
  getFileExtension,
} from '../globalFunctions'

const DB_UserScoped = {
  getCurrentUserRecords: (tableName, currentUser, objectName) => {
    return new Promise((resolve, reject) => {
      DB_UserScoped.getRecordsByUser(tableName, currentUser, objectName)
        .then((currentUserRecord) => {
          if (!Array.isArray(currentUserRecord)) {
            currentUserRecord = DB.convertKeyObjectToArray(currentUserRecord)
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
  getAllUserRecords: (tableName, currentUser, theme, objectName) => {
    return new Promise((resolve, reject) => {
      DB.getRecordsByUser(tableName, currentUser, theme, objectName)
        .then((currentUserRecord) => {
          if (!Array.isArray(currentUserRecord)) {
            currentUserRecord = DB.convertKeyObjectToArray(currentUserRecord)
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
  getPropFromUserRecord: (tableName, currentUser, theme, propPath) =>
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
        users = DB.convertKeyObjectToArray(users)
      }
      user = users.filter((x) => x.name.formatNameFirstNameOnly() === userName.formatNameFirstNameOnly())[0].phone
    })

    return user
  },
  getUserImages: async (tableName, currentUser, theme, objectName) => {
    const dbRef = ref(getDatabase())
    let tableData = []
    await get(child(dbRef, `${tableName}/${currentUser.phone}/${objectName}`)).then((snapshot) => {
      tableData = snapshot.val()
    })
    return tableData
  },
  updateUserProp: async (currentUser, theme, parentObjectName, prop, value) => {
    const database = getDatabase()
    let dbRef
    if (Manager.isValid(parentObjectName)) {
      console.log(`${DB.tables.users}/${currentUser.phone}/${parentObjectName}`)
      dbRef = ref(database, `${DB.tables.users}/${currentUser.phone}/${parentObjectName}`)
    } else {
      dbRef = ref(database, `${DB.tables.users}/${currentUser.phone}`)
    }
    await update(dbRef, { [prop]: value })
  },
  updateUserRecord: async (phoneUid, propPath, value) => {
    const dbRef = ref(getDatabase())
    set(child(dbRef, `${DB.tables.users}/${phoneUid}/${propPath}`), value)
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
  getCoparentByPhone: async (coparentPhone, currentUser, theme, getBioCoparent) => {
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
    const updatedCoparents = [...currentUser.coparents, newCoparent]
    await DB_UserScoped.updateUserRecord(currentUser.id, '/coparents', updatedCoparents)
  },
  addUserChild: async (currentUser, newChild) => {
    const dbRef = ref(getDatabase())
    const currentChildren = await DB_UserScoped.getCurrentUserRecords(DB.tables.users, currentUser, 'children')
    await set(child(dbRef, `users/${currentUser.phone}/children`), [...currentChildren, newChild])
  },
  updateUserChild: async (currentUser, activeChild, section, prop, value) => {
    const dbRef = ref(getDatabase())
    let key = await DB.getNestedSnapshotKey(`users/${currentUser.phone}/children/`, activeChild, 'id')
    await set(child(dbRef, `users/${currentUser.phone}/children/${key}/${section}/${prop.toLowerCase()}`), value)
    const returnChild = await DB.getTable(`users/${currentUser.phone}/children/${key}`)
    return returnChild
  },
  deleteUserChildPropByPath: async (currentUser, activeChild, section, prop) => {
    const dbRef = ref(getDatabase())
    let key = await DB.getNestedSnapshotKey(`users/${currentUser.phone}/children/`, activeChild, 'id')
    await DB.deleteByPath(`/users/${currentUser.phone}/children/${key}/${section}/${prop.toLowerCase()}`)
    const returnChild = await DB.getTable(`users/${currentUser.phone}/children/${key}`)
    return returnChild
  },
  addUserChildProp: async (currentUser, activeChild, infoSection, prop, value) => {
    const dbRef = ref(getDatabase())
    let key = await DB.getNestedSnapshotKey(`users/${currentUser.phone}/children/`, activeChild, 'id')
    if (key !== null) {
      await set(child(dbRef, `users/${currentUser.phone}/children/${key}/${infoSection}/${prop.toLowerCase()}`), `${value}`)
    }
    const returnChild = await DB.getTable(`users/${currentUser.phone}/children/${key}`)
    return returnChild
  },
}

export default DB_UserScoped
