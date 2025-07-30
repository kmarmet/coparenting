// Path: src\database\DB.js
import {child, get, getDatabase, ref, remove, set, update} from "firebase/database"
import _ from "lodash"
import DatasetManager from "../managers/datasetManager"
import LogManager from "../managers/logManager.js"
import Manager from "../managers/manager"

const DB = {
    tables: {
        appUpdates: "appUpdates",
        calendarEvents: "calendarEvents",
        changelogs: "changelogs",
        chatBookmarks: "chatBookmarks",
        chatMessages: "chatMessages",
        chats: "chats",
        documentHeaders: "documentHeaders",
        documents: "documents",
        expenses: "expenses",
        feedbackEmotionsTracker: "feedbackEmotionsTracker",
        handoffChangeRequests: "handoffChangeRequests",
        holidayEvents: "holidayEvents",
        invitations: "invitations",
        memories: "memories",
        sharedChildInfo: "sharedChildInfo",
        updateSubscribers: "updateSubscribers",
        updates: "updates",
        users: "users",
        visitationChangeRequests: "visitationChangeRequests",
    },
    find: async (arrayOrTable, matchArray, isFromDb = true, filterFunction = null) => {
        if (filterFunction) {
            if (isFromDb) {
                const records = await DB.GetTableData(arrayOrTable)
                return _.find(records, filterFunction)
            } else {
                return _.find(arrayOrTable, filterFunction)
            }
        }
        if (isFromDb) {
            const records = await DB.GetTableData(arrayOrTable)
            return _.find(records, matchArray)
        } else {
            return _.find(arrayOrTable, matchArray)
        }
    },
    GetTableIndexByUserKey: (arr, userKey) => {
        if (Manager.IsValid(arr)) {
            return Object.entries(arr)
                ?.filter((x) => x[1]?.userKey === userKey)
                .flat()[0]
        }
    },
    GetIndexById: (arr, id) => {
        if (Manager.IsValid(arr)) {
            return arr.findIndex((x) => x?.id === id)
        }
        return -1
    },
    GetChildIndex: (children, childId) => {
        if (Manager.IsValid(children)) {
            return Object.entries(children)
                ?.filter((x) => x[1]?.id === childId)
                .flat()[0]
        }
    },
    getSnapshotKey: async (path, objectToCheck, propertyToCompare = "id") =>
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
                LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
            }
        }),
    getNestedSnapshotKey: async (recordPath, objectToCheck, propertyToCompare) =>
        await new Promise(async (resolve) => {
            const dbRef = ref(getDatabase())
            // await get(child(dbRef, recordPath)).then((snapshot) => {
            //   snapshot.val().forEach((obj) => {
            //     if (obj[propertyToCompare] === '4199615795') {
            //       console.Log(snapshot.key)
            //       resolve(data.key)
            //     }
            //   })
            // })
            await DB.GetTableData(recordPath).then((data) => {
                if (Array.isArray(data)) {
                    for (let prop in data) {
                        if (data[prop][propertyToCompare] === objectToCheck[propertyToCompare]) {
                            // console.Log(prop)
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
    Add: async (path, existingData = [], newData) => {
        const dbRef = ref(getDatabase())
        try {
            let tableData = []
            if (Manager.IsValid(existingData)) {
                tableData = DatasetManager.AddToArray(existingData, newData)
            } else {
                tableData = [newData]
            }

            await set(child(dbRef, path), DatasetManager.GetValidArray(tableData))
        } catch (error) {
            LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
        }
    },
    AddToObject: async (path, object, property, value) => {
        const dbRef = ref(getDatabase())
        try {
            await update(child(dbRef, path), {[property]: value})
        } catch (error) {
            LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
        }
    },
    Delete: async (recordPath) => {
        const dbRef = ref(getDatabase())
        try {
            await remove(child(dbRef, recordPath))
        } catch (error) {
            LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
        }
    },
    deleteMultipleRows: async function (path, rows, currentUser) {
        rows = DatasetManager.GetValidArray(rows)
        let dbRef = ref(getDatabase())
        let idToDelete
        if (Manager.IsValid(rows)) {
            for (let row of rows) {
                idToDelete = await DB.getSnapshotKey(path, row, "id")
                console.log(`${path} | ID to delete: ${idToDelete}`)
                if (Manager.IsValid(idToDelete)) {
                    try {
                        await remove(child(dbRef, `${path}/${idToDelete}/`))
                        console.log(`${path} record deleted`)
                    } catch (error) {
                        LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
                    }
                }
            }
        }
    },
    DeleteByPath: async (path) => {
        const dbRef = ref(getDatabase())
        try {
            await remove(child(dbRef, path))
        } catch (error) {
            LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
        }
    },
    deleteById: async (path, id) => {
        const dbRef = ref(getDatabase())
        let key = null
        const tableRecords = await DB.GetTableData(path)

        for (const record of tableRecords) {
            if (record?.id === id) {
                key = await DB.getSnapshotKey(path, record, "id")
            }
        }

        try {
            remove(child(dbRef, `${path}/${key}`))
        } catch (error) {
            LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
        }
    },
    deleteMemory: async (userKey, memory) => {
        const dbRef = ref(getDatabase())
        const key = await DB.getSnapshotKey(`${DB.tables.memories}/${userKey}`, memory, "id")
        try {
            remove(child(dbRef, `${DB.tables.memories}/${userKey}/${key}`))
        } catch (error) {
            LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
        }
    },
    GetTableData: async (path, returnObject = false) => {
        const dbRef = ref(getDatabase())
        let tableData = []
        await get(child(dbRef, path)).then((snapshot) => {
            tableData = snapshot.val()
        })
        let tableAsArray = DatasetManager.GetValidArray(tableData)
        tableAsArray = tableAsArray.filter((x) => x)
        return returnObject ? tableData : tableAsArray
    },
    UpdateByPath: async (path, newValue) => {
        const dbRef = ref(getDatabase())
        try {
            await set(child(dbRef, path), newValue)
        } catch (error) {
            LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
        }
    },
    updateRecord: async (tableName, currentUser, recordToUpdate, prop, value, propUid) => {
        const dbRef = ref(getDatabase())
        const tableRecords = DatasetManager.GetValidArray(await DB.GetTableData(tableName))
        let toUpdate
        if (propUid) {
            toUpdate = tableRecords.filter((x) => x[propUid] === recordToUpdate[propUid])[0]
        } else {
            toUpdate = tableRecords.filter((x) => x.id === recordToUpdate.id)[0]
        }
        toUpdate[prop] = value
        try {
            // set(child(dbRef, tableName), tableRecords)
        } catch (error) {
            LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
        }
    },
    ReplaceEntireRecord: async (path, updatedRow) => {
        try {
            const dbRef = getDatabase()
            // console.log('updatedRow', updatedRow)
            //updatedRow = ObjectManager.GetValidObject(updatedRow)
            console.log("DB -> ReplaceEntireRecord", updatedRow)
            await set(ref(dbRef, path), updatedRow)
                .then()
                .catch((error) => {
                    LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
                })
        } catch (error) {
            console.log(error)
            LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
        }
    },
    updateEntireRecord: async (path, updatedRow, id) => {
        try {
            const dbRef = getDatabase()
            let key = null
            const tableRecords = await DB.GetTableData(path)
            for (const record of tableRecords) {
                if (record?.id === id) {
                    key = await DB.getSnapshotKey(path, record, "id")
                }
            }
            await update(ref(dbRef, `${path}/${key}`), updatedRow)
                .then()
                .catch((error) => {
                    console.log(error)
                })
            return await DB.GetTableData(`${path}/${key}`, true)
        } catch (error) {
            LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
        }
    },
}

export default DB