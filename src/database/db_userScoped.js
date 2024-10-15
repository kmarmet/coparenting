import Manager from '@manager'
import { child, get, getDatabase, push, ref, remove, set, update } from 'firebase/database'
import FirebaseStorage from './firebaseStorage'
import DB from '@db'
import '../prototypes'

const DB_UserScoped = {
  getCurrentUserRecords: (tableName, currentUser, theme, objectName) => {
    return new Promise((resolve, reject) => {
      DB_UserScoped.getRecordsByUser(tableName, currentUser, theme, objectName)
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
  getRecordsByUser: async (tableName, currentUser, theme, objectName) => {
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
}

export default DB_UserScoped
