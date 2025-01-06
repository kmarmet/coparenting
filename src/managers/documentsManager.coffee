import Manager from "./manager"
import DB from "../database/DB"
import { child, getDatabase, ref, set } from 'firebase/database'
import FirebaseStorage from "../database/firebaseStorage"
import DatasetManager from "./datasetManager"

export default DocumentsManager =
  deleteDocsWithIds: (idsToDelete, currentUser, callback = () => {}) ->
    for docId in idsToDelete
      docs = DatasetManager.getValidArray(await DB.getTable("#{DB.tables.documents}/#{currentUser?.phone}"))
      if Manager.isValid(docs)
        for thisDoc in docs
          if thisDoc.id == docId
            await DB.deleteById("#{DB.tables.documents}/#{currentUser?.phone}", docId)
            await FirebaseStorage.delete(FirebaseStorage.directories.documents, currentUser.id, thisDoc.name)
            if callback then callback(docId)

  addDocumentToDocumentsTable: (currentUser, data) ->
    dbRef = ref getDatabase()
    tableData = await DB.getTable ("#{DB.tables.documents}/#{currentUser?.phone}")

    if Manager.isValid (tableData)
      if tableData.length > 0
        tableData = [tableData..., data].filter (item) -> item
      else
        tableData = [data]
    else
      tableData = [data]
    console.log(tableData)

    await set child(dbRef, "#{DB.tables.documents}/#{currentUser.phone}"), tableData