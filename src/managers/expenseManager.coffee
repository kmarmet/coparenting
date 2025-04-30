import DB from "../database/DB"
import { getDatabase, ref, update } from 'firebase/database'
import LogManager from "./logManager"
import SecurityManager from "./securityManager"

export default ExpenseManager = {
  markAsPaid:  (currentUser, updatedExpense, id) ->
    dbRef = getDatabase()
    key = null

    try
      expenses = await SecurityManager.getExpenses(currentUser)
      expense = await DB.find(expenses, ["id", id], false)
      ownerKey = expense.ownerKey
      console.log("#{DB.tables.expenses}/#{ownerKey}")
      key = await DB.getSnapshotKey("#{DB.tables.expenses}/#{ownerKey}", expense, "id")
      update(ref(dbRef, "#{DB.tables.expenses}/#{ownerKey}/#{key}"), updatedExpense)
    catch error
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)

  UpdateExpense:  (currentUserKey, updateIndex,updatedExpense) ->
    dbRef = getDatabase()

    try
      if updateIndex
       await update(ref(dbRef, "#{DB.tables.expenses}/#{currentUserKey}/#{updateIndex}"), updatedExpense)
    catch error
      LogManager.log(error.message, LogManager.logTypes.error, error.stack)
  }