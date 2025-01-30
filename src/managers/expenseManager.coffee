import DB from "../database/DB"
import { child, getDatabase, ref, remove, set, update } from 'firebase/database'
import Manager from "./manager"
import LogManager from "./logManager"
import SecurityManager from "./securityManager"
import DB_UserScoped from "../database/db_userScoped"

export default ExpenseManager = {
  markAsPaid:  (currentUser, updatedExpense, id) ->
    dbRef = getDatabase()
    key = null

    try
      expenses = await SecurityManager.getExpenses(currentUser)
      expense = await DB.find(expenses, ["id", id], false)
      ownerPhone = expense.ownerPhone
      console.log("#{DB.tables.expenses}/#{ownerPhone}")
      key = await DB.getSnapshotKey("#{DB.tables.expenses}/#{ownerPhone}", expense, "id")
      update(ref(dbRef, "#{DB.tables.expenses}/#{ownerPhone}/#{key}"), updatedExpense)
    catch error
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)

  updateExpense:  (currentUser, updatedExpense, id) ->
    dbRef = getDatabase()
    key = null

    try
      console.log(id)
      expenses = await SecurityManager.getExpenses(currentUser)
      expense = await DB.find(expenses, ["id", id], false)
      ownerPhone = expense.ownerPhone
      console.log(ownerPhone)
      key = await DB.getSnapshotKey("#{DB.tables.expenses}/#{ownerPhone}", expense, "id")
      if key
        update(ref(dbRef, "#{DB.tables.expenses}/#{ownerPhone}/#{key}"), updatedExpense)
    catch error
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)
  }