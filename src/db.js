import { getDatabase, ref, set, get, child, onValue } from "firebase/database";
import { getStorage, ref as storageRef, deleteObject } from "firebase/storage";
import util from "./util";

const db = {
  tables: {
    expenseTracker: "expenseTracker",
    swapRequests: "swapRequests",
    users: "users",
    calendarEvents: "calendarEvents",
  },
  getFilteredRecords: async (records, currentUser) => {
    let returnRecords = [];
    if (records && records !== undefined && records.length > 0) {
      const coparentPhones = currentUser.coparents.map((x) => x.phone);
      const coparentNames = currentUser.coparents.map((x) => util.getName(x.name));
      records.forEach((event, index) => {
        // Filter by phone
        if (coparentPhones.includes(event.phone) || event.phone === currentUser.phone) {
          // Filter by name (createdBy)
          if (coparentNames.includes(util.getName(event.createdBy)) || util.getName(event.createdBy).includes(util.getName(currentUser.name))) {
            // Filter by name (forCoparent)
            if (coparentNames.includes(util.getName(event.forCoparent)) || util.getName(event.forCoparent).includes(util.getName(currentUser.name))) {
              returnRecords.push(event);
            }
          }
        }
      });
    }

    // console.log(returnRecords);
    return returnRecords;
  },
  getCoparent: async (name) => {
    const dbRef = ref(getDatabase());
    let returnUser = null;

    await get(child(dbRef, `users`)).then((snapshot) => {
      if (snapshot.exists()) {
        const tableData = snapshot.val();
        const user = tableData.filter((x) => util.getWordBeforeSpace(x.name).toLowerCase() === util.getWordBeforeSpace(name).toLowerCase());
        returnUser = user[0];
      }
    });

    return returnUser;
  },
  add: async (tableName, data) => {
    const dbRef = ref(getDatabase());
    let tableData = [];
    tableData = await db.getTable(tableName);

    if (tableData === null) {
      tableData = [data];
    } else {
      if (Array.isArray(tableData)) {
        if (tableData.length > 0) {
          tableData = [...tableData, data].filter((item) => item);
        } else {
          tableData = [data];
        }
      } else {
        tableData = Object.entries(tableData);
        if (tableData === null || tableData.length === 0) {
          tableData = [data];
        } else {
          tableData = [...tableData, data];
        }
      }
    }
    set(child(dbRef, tableName), tableData);
  },
  delete: async (tableName, id) => {
    const dbRef = ref(getDatabase());
    await db.getTable(tableName).then((data) => {
      let tableData = [];
      if (data && data.length > 0) {
        tableData = data.filter((x) => {
          return x.id !== id;
        });
      }
      set(child(dbRef, tableName), tableData);
    });
  },
  getTable: async (tableName) => {
    const dbRef = ref(getDatabase());
    let tableData = [];
    await get(child(dbRef, tableName)).then((snapshot) => {
      tableData = snapshot.val();
    });
    return tableData;
  },
  getCoparentRecords: async (tableName, currentUser) => {
    await db.getTable(db.tables[tableName]).then((data) => {
      return data;
    });
  },
  updateRecord: async (tableName, recordToUpdate, prop, value) => {
    const dbRef = ref(getDatabase());
    console.log(tableName, recordToUpdate, prop, value);
    const tableRecords = await db.getTable(tableName);
    const toUpdate = tableRecords.filter((x) => x.id === recordToUpdate.id)[0];
    toUpdate[prop] = value;
    set(child(dbRef, tableName), tableRecords);
  },
  onTableChange: (tableName, callback) => {
    const dbRef = ref(getDatabase());

    onValue(child(dbRef, tableName), (snapshot) => {
      const tableData = snapshot.val();
      if (callback) callback(tableData);
    });
  },
};

export default db;
