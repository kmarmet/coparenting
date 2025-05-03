import Manager from "./manager"
import DB from "../database/DB"
import { child, getDatabase, ref, set } from 'firebase/database'
import DatasetManager from "./datasetManager"
import StringManager from "./stringManager"

export default DocumentsManager =
  DeleteDocsWithIds: (idsToDelete, currentUser, callback = () => {}) ->
    for docId in idsToDelete
      docs = DatasetManager.getValidArray(await DB.getTable("#{DB.tables.documents}/#{currentUser?.key}"))
      if Manager.isValid(docs)
        for thisDoc in docs
          if thisDoc.id == docId
            await DB.deleteById("#{DB.tables.documents}/#{currentUser?.key}", docId)
            thisDoc.name = StringManager.formatFileName(thisDoc.name)
#            await FirebaseStorage.deleteFile("#{FirebaseStorage.directories.documents}/#{currentUser.key}/#{thisDoc.name}")
            if callback then callback(docId)

  AddToDocumentsTable: (currentUser, existingDocuments, data) ->
    dbRef = ref getDatabase()

    if Manager.isValid (existingDocuments)
      existingDocuments = [existingDocuments..., data].filter (item) -> item
    else
      existingDocuments = [data].filter (item) -> item

    try
      await set child(dbRef, "#{DB.tables.documents}/#{currentUser?.key}"), existingDocuments
    catch error
      console.log("Error: #{error} | Path: #{DB.tables.documents}/#{currentUser?.key}")

  IsDocumentOrImage: (file) ->
    extension = StringManager.GetFileExtension(file?.name)
    if extension == 'image/png' || extension == 'image/jpeg' || extension == 'image/jpg' || extension == 'image/gif'
      return 'image'
    else if extension == 'application/pdf' || extension == 'application/msword' || extension == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      return 'document'