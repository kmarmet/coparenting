// Path: src\database\db_userScoped.js
import DatasetManager from '/src/managers/datasetManager'
import ObjectManager from '/src/managers/objectManager'
import StringManager from '/src/managers/stringManager.coffee'
import {child, get, getDatabase, push, ref, remove, set, update} from 'firebase/database'
import _ from 'lodash'
import moment from 'moment'
import DatetimeFormats from '../constants/datetimeFormats'
import AppManager from '../managers/appManager'
import LogManager from '../managers/logManager'
import Manager from '../managers/manager'
import ModelNames from '../models/modelNames'
import User from '../models/user'
import DB from './DB'
import FirebaseStorage from './firebaseStorage'

const DB_UserScoped = {
  // GET
  getCoparentObjArray: (currentUser, coparents) => {
    let objArray = []
    let validCoparentsArray = DatasetManager.GetValidArray(coparents)
    if (Manager.IsValid(currentUser) && Manager.IsValid(validCoparentsArray)) {
      for (let coparent of validCoparentsArray) {
        if (coparent?.userKey) {
          objArray.push({
            key: coparent.userKey,
            name: coparent.name,
          })
        }
      }
    }
    return objArray
  },
  getCoparentOrChildObjArray: (currentUser) => {
    let objArray = []
    if (Manager.IsValid(currentUser?.coparents)) {
      for (let coparent of currentUser.coparents) {
        if (coparent?.key) {
          objArray.push({
            key: coparent.key,
            name: coparent.name,
          })
        }
      }
    }
    if (Manager.IsValid(currentUser?.children)) {
      for (let child of currentUser.children) {
        if (child?.key) {
          objArray.push({
            key: child.key,
            name: child.name,
          })
        }
      }
    }
    return objArray
  },
  getChildAccounts: async (currentUser) => {
    let childrenAccounts = []
    if (Manager.IsValid(currentUser?.children)) {
      for (let child of currentUser.children) {
        if (child?.userKey) {
          const childAccount = await DB.find(DB.tables.users, ['key', child?.userKey], true)
          if (Manager.IsValid(childAccount)) {
            childrenAccounts.push(child)
          }
        }
      }
    }
    return childrenAccounts
  },
  getParentAccounts: async (currentUser) => {
    let parentAccounts = []
    if (Manager.IsValid(currentUser?.parents)) {
      for (let parent of currentUser.parents) {
        if (parent?.userKey) {
          const parentAccount = await DB.find(DB.tables.users, ['key', parent?.userKey], true)
          if (Manager.IsValid(parentAccount)) {
            parentAccounts.push(parentAccount)
          }
        }
      }
    }
    return parentAccounts
  },
  getCoparentAccounts: async (currentUser) => {
    let coparentAccounts = []
    if (Manager.IsValid(currentUser?.coparents)) {
      for (let coparent of currentUser.coparents) {
        if (coparent?.userKey) {
          const coparentAccount = await DB.find(DB.tables.users, ['key', coparent?.userKey], true)
          if (Manager.IsValid(coparentAccount)) {
            coparentAccounts.push(coparentAccount)
          }
        }
      }
    }
    return coparentAccounts
  },
  getValidAccountsCountForUser: async (currentUser) => {
    const children = await DB_UserScoped.getChildAccounts(currentUser)
    const parents = await DB_UserScoped.getParentAccounts(currentUser)
    const coparents = await DB_UserScoped.getCoparentAccounts(currentUser)
    return children?.length + parents?.length + coparents?.length
  },
  getValidAccountsForUser: async (currentUser) => {
    const children = await DB_UserScoped.getChildAccounts(currentUser)
    const parents = await DB_UserScoped.getParentAccounts(currentUser)
    const coparents = await DB_UserScoped.getCoparentAccounts(currentUser)
    return DatasetManager.getUniqueArray([...children, ...parents, ...coparents], true)
  },
  getLinkedAccounts: async (currentUser) => {
    const children = currentUser?.children?.filter((x) => x?.userKey) || []
    const parents = currentUser?.parents?.filter((x) => x?.userKey) || []
    const coparents = currentUser?.coparents?.filter((x) => x?.userKey) || []
    const accounts = DatasetManager.getUniqueArray([...children, ...parents, ...coparents], true)
    const accountKeys = accounts.map((x) => x?.userKey)
    return {
      accounts,
      accountKeys,
    }
  },
  getPropFromUserRecord: (tableName, currentUser, propPath) =>
    new Promise((resolve) => {
      const dbRef = ref(getDatabase())
      get(child(dbRef, `${tableName}/${currentUser?.key}/${propPath}`)).then((snapshot) => {
        let propValue = snapshot.val()
        resolve(propValue || [])
      })
    }),
  getUserImages: async (tableName, currentUser, objectName) => {
    const dbRef = ref(getDatabase())
    let tableData = []
    await get(child(dbRef, `${tableName}/${currentUser?.key}/${objectName}`)).then((snapshot) => {
      tableData = snapshot.val()
    })
    return tableData
  },
  getRecordsByUser: async (tableName, currentUser, objectName) => {
    return new Promise((resolve, reject) => {
      const dbRef = ref(getDatabase())
      get(child(dbRef, `${tableName}/${currentUser?.key}/${objectName}`))
        .then((snapshot) => {
          if (snapshot.exists()) {
            // console.Log("if");
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
  getNameFromKey: async (currentUser, key) => {
    if (key === currentUser.key) {
      return StringManager.GetFirstNameOnly(currentUser?.name)
    } else {
      return currentUser?.coparents.find((c) => c.key === key)?.name
    }
  },

  // ADD
  addMultipleExpenses: async (currentUser, data) => {
    const dbRef = ref(getDatabase())
    const currentExpenses = await DB.getTable(`${DB.tables.expenses}/${currentUser.key}`)
    const toAdd = [...currentExpenses, [...data]].filter((x) => x !== undefined).flat()
    set(child(dbRef, `${DB.tables.expenses}/${currentUser.key}`), toAdd).catch((error) => {
      console.log(error)
    })
  },
  addUser: async (newUser) => {
    const dbRef = ref(getDatabase())
    const currentUsers = await DB.getTable(DB.tables.users)
    const toAdd = [...currentUsers, [...newUser]].filter((x) => x !== undefined).flat()
    set(child(dbRef, `${DB.tables.users}`), toAdd).catch((error) => {
      console.log(error)
    })
  },
  addCoparent: async (currentUser, newCoparent) => {
    const dbRef = ref(getDatabase())
    let updatedCoparents = []
    const coparents = await DB.getTable(`${DB.tables.users}/${currentUser?.key}/coparents`)
    if (Manager.IsValid(coparents, true)) {
      updatedCoparents = DatasetManager.GetValidArray([...coparents, newCoparent])
    } else {
      updatedCoparents = [newCoparent]
    }
    await set(child(dbRef, `${DB.tables.users}/${currentUser?.key}/coparents/`), updatedCoparents)
  },
  AddParent: async (currentUser, newParent) => {
    try {
      const dbRef = ref(getDatabase())
      const existingParents = currentUser?.parents || []
      let updatedParents = []
      const existingParent = existingParents.find((x) => x?.userKey === newParent?.userKey)
      if (!Manager.IsValid(existingParent)) {
        if (Manager.IsValid(existingParents, true)) {
          updatedParents = DatasetManager.GetValidArray([...existingParents, newParent])
        } else {
          updatedParents = [newParent]
        }
        await set(child(dbRef, `${DB.tables.users}/${currentUser?.key}/parents`), updatedParents)
      }
    } catch (error) {
      LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
    }
  },
  AddChecklist: async (path, existingChecklists, newChecklistObject) => {
    try {
      const dbRef = ref(getDatabase())
      const combined = DatasetManager.AddToArray(existingChecklists, newChecklistObject)
      await set(child(dbRef, path), combined)
    } catch (error) {
      console.log(`Error: ${error} | Code File: DB_UserScoped | Function: AddChecklist  `)
      LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
    }
  },
  AddItemsToChecklist: async (path, updatedChecklist) => {
    try {
      const dbRef = ref(getDatabase())
      await set(child(dbRef, path), updatedChecklist)
    } catch (error) {
      console.log(`Error: ${error} | Code File: DB_UserScoped | Function: AddChecklist  `)
      LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
    }
  },
  AddChildToParentProfile: async (currentUser, newChild) => {
    const dbRef = ref(getDatabase())
    const currentChildren = currentUser?.children
    const updatedChildren = DatasetManager.AddToArray(currentChildren, newChild)
    await set(child(dbRef, `${DB.tables.users}/${currentUser?.key}/children`), updatedChildren)
  },
  addToUserMemories: async (currentUser, objectName, value, id) => {
    const dbRef = ref(getDatabase())
    let tableRecords = await DB.getTable(DB.tables.users)
    tableRecords = DatasetManager.GetValidArray(tableRecords)
    let toUpdate = tableRecords.filter((x) => x.phone === currentUser?.key)[0]
    if (toUpdate[objectName] !== undefined && toUpdate[objectName].length > 0) {
      toUpdate[objectName] = [...toUpdate[objectName], value]
    } else {
      toUpdate[objectName] = [value]
    }
    if (id) {
      await push(child(dbRef, `/users/${currentUser?.key}/${objectName}/${id}/`), value)
      return toUpdate[objectName]
    } else {
      await push(child(dbRef, `/users/${currentUser?.key}/${objectName}`), value)
      return toUpdate[objectName]
    }
  },
  addProfilePicToChildRecord: async (currentUser, objectName, value, id) => {
    const dbRef = ref(getDatabase())
    let basePath = `${DB.tables.users}/${currentUser?.key}/children`
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
  addUserChildProp: async (currentUser, activeChild, infoSection, prop, value, shareWith) => {
    const dbRef = ref(getDatabase())
    const childKey = DB.GetChildIndex(currentUser?.children, activeChild?.id)
    if (childKey !== null) {
      if (Manager.IsValid(shareWith, true)) {
        for (let userKey of shareWith) {
          const shareWithSet = await DB.getTable(`${DB.tables.sharedChildInfo}/${userKey}`)
          let sharedObject
          sharedObject = {
            prop: prop,
            infoSection: infoSection,
            childName: activeChild?.general?.name,
            sharedByName: currentUser?.name,
            sharedByOwnerKey: currentUser?.key,
            id: Manager.GetUid(),
            value: value,
          }
          await set(child(dbRef, `${DB.tables.sharedChildInfo}/${userKey}`), [...shareWithSet, sharedObject])
        }
      }
      await set(
        child(dbRef, `${DB.tables.users}/${currentUser?.key}/children/${childKey}/${infoSection}/${StringManager.formatDbProp(prop)}`),
        `${value}`
      )
    }
  },
  addCoparentProp: async (currentUser, coparent, prop, value) => {
    const dbRef = ref(getDatabase())
    let key = await DB.getNestedSnapshotKey(`${DB.tables.users}/${currentUser?.key}/coparents/`, coparent, 'id')
    if (key !== null) {
      await set(child(dbRef, `${DB.tables.users}/${currentUser?.key}/coparents/${key}/${StringManager.formatDbProp(prop)}`), `${value}`)
    }
    return await DB.getTable(`${DB.tables.users}/${currentUser?.key}/coparents/${key}`, true)
  },
  addParentProp: async (currentUser, parent, prop, value) => {
    const dbRef = ref(getDatabase())
    let key = await DB.getNestedSnapshotKey(`${DB.tables.users}/${currentUser?.key}/parents/`, parent, 'id')
    if (key !== null) {
      await set(child(dbRef, `${DB.tables.users}/${currentUser?.key}/parents/${key}/${StringManager.formatDbProp(prop)}`), `${value}`)
    }
  },
  CreateAndInsertUser: async (userObject) => {
    const dbRef = ref(getDatabase())
    const {email, key, accountType, phone, name} = userObject

    const locationDetails = (await AppManager.getLocationDetails()) || {}

    // User Record
    let newUser = new User()
    newUser.email = email
    newUser.key = key
    newUser.creationDate = moment().format(DatetimeFormats.dateForDb)
    newUser.location = locationDetails
    newUser.name = StringManager.uppercaseFirstLetterOfAllWords(name).trim()
    newUser.accountType = accountType.toLowerCase()
    newUser.phone = StringManager.FormatPhone(phone)
    const cleanUser = ObjectManager.GetModelValidatedObject(newUser, accountType === 'parent' ? ModelNames.user : ModelNames.childUser)
    // Insert
    await set(child(dbRef, `${DB.tables.users}/${key}`), cleanUser).catch((error) => {
      console.log(error)
    })

    return newUser
  },

  // UPDATE
  updateUserProp: async (currentUser, parentObjectName, prop, value) => {
    const database = getDatabase()
    let dbRef
    if (Manager.IsValid(parentObjectName)) {
      console.log(`${DB.tables.users}/${currentUser?.key}/${parentObjectName}`)
      dbRef = ref(database, `${DB.tables.users}/${currentUser?.key}/${parentObjectName}`)
    } else {
      dbRef = ref(database, `${DB.tables.users}/${currentUser?.key}`)
    }
    update(dbRef, {[StringManager.formatDbProp(prop)]: value})
  },
  UpdateChildInfo: async (currentUser, activeChild, section, prop, value) => {
    const dbRef = ref(getDatabase())
    if (Manager.IsValid(currentUser)) {
      const childKey = DB.GetChildIndex(currentUser?.children, activeChild?.id)

      if (Manager.IsValid(childKey)) {
        await set(child(dbRef, `${DB.tables.users}/${currentUser?.key}/children/${childKey}/${section}/${StringManager.formatDbProp(prop)}`), value)
      }
    }
  },
  addSharedDataUser: async (currentUser, newKey) => {
    const dbRef = ref(getDatabase())
    const existingKeys = DatasetManager.getUniqueArray(currentUser?.sharedDataUsers, true) ?? []
    if (!existingKeys.includes(newKey)) {
      const toAdd = DatasetManager.getUniqueArray([...existingKeys, newKey].filter((x) => x).flat())
      await set(child(dbRef, `${DB.tables.users}/${currentUser?.key}/sharedDataUsers`), toAdd)
    }
  },
  UpdateCoparent: async (currentUserKey, coparentKey, prop, value) => {
    const dbRef = ref(getDatabase())
    await set(child(dbRef, `${DB.tables.users}/${currentUserKey}/coparents/${coparentKey}/${StringManager.formatDbProp(prop)}`), value)
  },
  UpdateParent: async (currentUserKey, parentIndex, prop, value) => {
    const dbRef = ref(getDatabase())
    await set(child(dbRef, `${DB.tables.users}/${currentUserKey}/parents/${parentIndex}/${StringManager.formatDbProp(prop)}`), value)
  },
  updateUserRecord: async (keyOrUid, propPath, value) => {
    const dbRef = ref(getDatabase())
    await set(child(dbRef, `${DB.tables.users}/${keyOrUid}/${propPath}`), value)
  },

  updateByPath: async (path, newValue) => {
    const dbRef = ref(getDatabase())
    await set(child(dbRef, path), newValue)
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

    const updatedDatabase = {...updatedEmailRecords, ...updatedPhoneRecords}
    await set(dbRef, updatedDatabase)
  },

  // DELETE
  DeleteChildInfoProp: async (currentUserKey, childIndex, section, prop) => {
    try {
      const dbRef = ref(getDatabase())
      if (!Manager.IsValid(childIndex) || !Manager.IsValid(section) || !Manager.IsValid(prop)) {
        return false
      }
      await remove(child(dbRef, `${DB.tables.users}/${currentUserKey}/children/${childIndex}/${section}/${prop}`))
    } catch (error) {
      LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
    }
  },
  DeleteCoparentInfoProp: async (currentUserKey, coparentIndex, prop) => {
    try {
      const dbRef = ref(getDatabase())
      await remove(child(dbRef, `${DB.tables.users}/${currentUserKey}/coparents/${coparentIndex}/${StringManager.formatDbProp(prop)}`))
    } catch (error) {
      LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
    }
  },
  DeleteSharedDataUserKey: async (currentUser, keyToRemove) => {
    const dbRef = ref(getDatabase())
    let existingKeys = DatasetManager.getUniqueArray(currentUser?.sharedDataUsers, true)

    if (existingKeys.includes(keyToRemove)) {
      if (Manager.IsValid(existingKeys)) {
        let updatedKeys = existingKeys.filter((x) => x !== keyToRemove)
        await set(child(dbRef, `${DB.tables.users}/${currentUser?.key}/sharedDataUsers`), updatedKeys)
      }
    }
  },
  deleteParentInfoProp: async (currentUser, prop, parent) => {
    const dbRef = ref(getDatabase())
    let removalKey = await DB.getNestedSnapshotKey(`${DB.tables.users}/${currentUser?.key}/parents/`, parent, 'userKey')
    await remove(child(dbRef, `${DB.tables.users}/${currentUser?.key}/parents/${removalKey}/${StringManager.formatDbProp(prop)}`))
  },
  DeleteCoparent: async (currentUser, coparentIndex, coparentUserKey) => {
    try {
      const dbRef = ref(getDatabase())
      // console.log(`${DB.tables.users}/${currentUser?.key}/coparents/${coparentIndex}`)
      await DB_UserScoped.DeleteSharedDataUserKey(currentUser, coparentUserKey)
      await remove(child(dbRef, `${DB.tables.users}/${currentUser?.key}/coparents/${coparentIndex}`))
    } catch (error) {
      LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
    }
  },
  DeleteParent: async (currentUser, parentIndex, parentUserKey) => {
    const dbRef = ref(getDatabase())
    try {
      await remove(child(dbRef, `${DB.tables.users}/${currentUser?.key}/parents/${parentIndex}`))
      await DB_UserScoped.DeleteSharedDataUserKey(currentUser, parentUserKey)
    } catch (error) {
      LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
    }
  },
  DeleteChild: async (currentUser, childIndex, childUserKey) => {
    const dbRef = ref(getDatabase())
    console.log(currentUser, childIndex, childUserKey)
    if (Manager.IsValid(childUserKey)) {
      await DB_UserScoped.DeleteSharedDataUserKey(currentUser, childUserKey)
    }
    await remove(child(dbRef, `${DB.tables.users}/${currentUser?.key}/children/${childIndex}`))
  },
  DeleteUser: async (userIndex) => {
    const dbRef = ref(getDatabase())
    await remove(child(dbRef, `${DB.tables.users}/${userIndex}`))
  },
  deleteUserData: async (currentUser) => {
    const dbRef = ref(getDatabase())
    const events = await DatasetManager.GetValidArray(DB.getTable(DB.tables.calendarEvents))
    const memories = await DatasetManager.GetValidArray(DB.getTable(DB.tables.memories))
    const expenses = await DatasetManager.GetValidArray(DB.getTable(DB.tables.expenses))
    const suggestions = await DatasetManager.GetValidArray(DB.getTable(DB.tables.suggestions))
    const merged = _.concat(events, memories, expenses, suggestions).filter((x) => x)
    const scopedToCurrentUser = merged.filter(
      (x) =>
        x?.ownerKey === currentUser?.key ||
        x?.phone === currentUser?.key ||
        StringManager.GetFirstNameOnly(x?.createdBy) === StringManager.GetFirstNameOnly(currentUser?.name)
    )

    // Delete subscriber from DB
    const subscriber = await DB.find(DB.tables.Updatesubscribers, ['phone', currentUser.key], true)

    if (Manager.IsValid(subscriber)) {
      const notifSubDeleteKey = await DB.getSnapshotKey(DB.tables.Updatesubscribers, subscriber, 'id')
      DB.DeleteByPath(`${DB.tables.Updatesubscribers}/${notifSubDeleteKey}`)
    }
    for (let record of scopedToCurrentUser) {
      // eslint-disable-next-line no-prototype-builtins
      if (record.hasOwnProperty('fromVisitationSchedule')) {
        await DB.deleteMultipleRows(DB.tables.calendarEvents, events, currentUser)
      }
      // eslint-disable-next-line no-prototype-builtins
      if (record.hasOwnProperty('paidStatus')) {
        await DB.deleteMultipleRows(DB.tables.expenses, expenses, currentUser)
      }
      // eslint-disable-next-line no-prototype-builtins
      if (record.hasOwnProperty('memoryCaptureDate')) {
        // await DB.deleteMultipleRows(DB.tables.memories, memories, currentUser)
      }
      // eslint-disable-next-line no-prototype-builtins
      if (record.hasOwnProperty('suggestion')) {
        console.log(record)
        await DB.deleteMultipleRows(DB.tables.suggestions, suggestions, currentUser)
      }
    }

    // DELETE ROOTED (users, archivedChat)
    await remove(child(dbRef, `${DB.tables.users}/${currentUser?.key}`))
    await remove(child(dbRef, `${DB.tables.archivedChats}/${currentUser?.key}`))
  },
  deleteSharedChildInfoProp: async (currentUser, sharedRecordProp, prop, sharedByOwnerKey) => {
    const dbRef = ref(getDatabase())
    if (
      Manager.IsValid(sharedRecordProp) &&
      sharedRecordProp.hasOwnProperty('sharedByOwnerKey') &&
      sharedRecordProp.sharedByOwnerKey === sharedByOwnerKey
    ) {
      const deleteKey = await DB.getSnapshotKey(`${DB.tables.sharedChildInfo}/${currentUser.key}`, sharedRecordProp, 'id')

      if (Manager.IsValid(deleteKey)) {
        await remove(child(dbRef, `${DB.tables.sharedChildInfo}/${currentUser.key}/${deleteKey}`))
      }
    }
  },

  // MISC.
  recursiveObjectUpdate: (obj, currentValue, updatedValue, propNameToUpdate) => {
    let updatedObject
    for (const key in obj) {
      // NOTIFICATION SUBSCRIBERS
      if (key === 'updateSubscribers' && propNameToUpdate === 'phone') {
        let updatedPushAlertSubs = {}
        for (let prop in obj[key]) {
          if (prop === currentValue) {
            prop = updatedValue
            updatedPushAlertSubs[prop] = obj[key][currentValue]
          } else {
            updatedPushAlertSubs[prop] = obj[key][currentValue]
          }
        }
        obj['updateSubscribers'] = updatedPushAlertSubs
      }

      // USERS
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

      if (Object.prototype.hasOwnProperty.call(obj, key)) {
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