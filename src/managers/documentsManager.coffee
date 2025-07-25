import Manager from "./manager"
import DB from "../database/DB"
import {child, getDatabase, ref, set} from 'firebase/database'
import DatasetManager from "./datasetManager"
import StringManager from "./stringManager"
import LogManager from "./logManager"

export default DocumentsManager =
  DeleteDocsWithIds: (idsToDelete, currentUser, callback = () => {}) ->
    for docId in idsToDelete
      docs = DatasetManager.GetValidArray(await DB.GetTableData("#{DB.tables.documents}/#{currentUser?.key}"))
      if Manager.IsValid(docs)
        for thisDoc in docs
          if thisDoc.id == docId
            await DB.deleteById("#{DB.tables.documents}/#{currentUser?.key}", docId)
            thisDoc.name = StringManager.FormatTitle(thisDoc.name, true)
#            await FirebaseStorage.deleteFile("#{FirebaseStorage.directories.documents}/#{currentUser.key}/#{thisDoc.name}")
            if callback then callback(docId)

  AddToDocumentsTable: (currentUser, existingDocuments, data) ->
    try
      dbRef = ref getDatabase()
      console.log("db")
      if Manager.IsValid (existingDocuments)
        existingDocuments = [existingDocuments..., data].filter (item) -> item
      else
        existingDocuments = [data].filter (item) -> item

      await set child(dbRef, "#{DB.tables.documents}/#{currentUser?.key}"), existingDocuments
    catch error
      LogManager.Log(error.message, LogManager.LogTypes.error, error.stack, error)

  IsDocumentOrImage: (file) ->
    extension = StringManager.GetFileExtension(file?.name)
    if extension == 'image/png' || extension == 'image/jpeg' || extension == 'image/jpg' || extension == 'image/gif'
      return 'image'
    else if extension == 'application/pdf' || extension == 'application/msword' || extension == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      return 'document'