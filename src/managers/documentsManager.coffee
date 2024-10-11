import Manager from "./manager"
import DB from "../database/DB"
import DateManager from "./dateManager"
import moment from "moment"
import { child, get, getDatabase, push, ref, remove, set, update } from 'firebase/database'
import FirebaseStorage from "../database/firebaseStorage"
import DB_UserScoped from "../database/db_userScoped"
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
  uniqueArray,
  getFileExtension,
  getWordFromString
} from "../globalFunctions"

export default DocumentsManager =

  deleteDocsWithIds: (toDelete, currentUser, callback) ->
    for docId in toDelete
      docs = await DB.getTable(DB.tables.documents)
      docs = Manager.convertToArray(docs).flat()
      dbDocs = Manager.convertToArray(docs)
      if Manager.isValid(dbDocs, true)
        for thisDoc in dbDocs when thisDoc.id is docId
          await DB.delete(DB.tables.documents, docId)
          await FirebaseStorage.delete(FirebaseStorage.directories.documents, currentUser.id, thisDoc.name)
          if callback then callback(docId)
  getAllDocs: (currentUser)->
    allDocs = await DB.getAllFilteredRecords(DB.tables.documents, currentUser, 'documents', 'root')
    allDocs = Manager.convertToArray (allDocs)
    allDocs
  getCoparentDocs: (currentUser) ->
    allDocs = await DB.getAllFilteredRecords(DB.tables.documents, currentUser, 'documents', 'root')
    coparents = currentUser.coparents
    returnObject = []
    for thisDoc in allDocs
      for coparent in coparents
        currentCoparentFromDb = await DB_UserScoped.getUser(DB.tables.users, coparent.phone)
        if thisDoc.uploadedBy == currentCoparentFromDb.phone
          if thisDoc.shareWith.includes(currentUser.phone)
            returnObject.push {docs: thisDoc, coparent: currentCoparentFromDb}
    return returnObject
  addDocumentToDocumentsTable: ( data) ->
    dbRef = ref getDatabase()
    tableData = await DB.getTable (DB.tables.documents)
    tableData = Manager.convertToArray (tableData)

    if Manager.isValid (tableData)
      if tableData.length > 0
        tableData = [tableData..., data].filter (item) -> item
      else
        tableData = [data]
    else
      tableData = [data]

    await set child(dbRef, DB.tables.documents), tableData



