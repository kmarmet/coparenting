// Generated by CoffeeScript 2.7.0
var ExpenseManager;

import DB from "../database/DB";

import {
  child,
  getDatabase,
  ref,
  remove,
  set,
  update
} from 'firebase/database';

import Manager from "./manager";

import LogManager from "./logManager";

import SecurityManager from "./securityManager";

import DB_UserScoped from "../database/db_userScoped";

export default ExpenseManager = {
  markAsPaid: async function(currentUser, updatedExpense, id) {
    var dbRef, error, expense, expenses, key, ownerKey;
    dbRef = getDatabase();
    key = null;
    try {
      expenses = (await SecurityManager.getExpenses(currentUser));
      expense = (await DB.find(expenses, ["id", id], false));
      ownerKey = expense.ownerKey;
      console.log(`${DB.tables.expenses}/${ownerKey}`);
      key = (await DB.getSnapshotKey(`${DB.tables.expenses}/${ownerKey}`, expense, "id"));
      return update(ref(dbRef, `${DB.tables.expenses}/${ownerKey}/${key}`), updatedExpense);
    } catch (error1) {
      error = error1;
      return LogManager.log(error.message, LogManager.logTypes.error, error.stack);
    }
  },
  updateExpense: async function(currentUser, updatedExpense, id) {
    var dbRef, error, expense, expenses, key, ownerKey;
    dbRef = getDatabase();
    key = null;
    try {
      console.log(id);
      expenses = (await SecurityManager.getExpenses(currentUser));
      expense = (await DB.find(expenses, ["id", id], false));
      ownerKey = expense.ownerKey;
      console.log(ownerKey);
      key = (await DB.getSnapshotKey(`${DB.tables.expenses}/${ownerKey}`, expense, "id"));
      if (key) {
        return update(ref(dbRef, `${DB.tables.expenses}/${ownerKey}/${key}`), updatedExpense);
      }
    } catch (error1) {
      error = error1;
      return LogManager.log(error.message, LogManager.logTypes.error, error.stack);
    }
  }
};

//# sourceMappingURL=expenseManager.js.map
