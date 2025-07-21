import DB from "../database/DB"
import {getDatabase} from 'firebase/database'
import LogManager from "./logManager"

export default ExpenseManager = {
  UpdateExpense:  (path,updatedExpense) ->
    dbRef = getDatabase()

    try
      if path and updatedExpense
       await DB.ReplaceEntireRecord(path,  updatedExpense)
    catch error
      LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)
  }