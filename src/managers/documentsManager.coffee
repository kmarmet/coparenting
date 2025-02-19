import Manager from "./manager"
import DB from "../database/DB"
import { child, getDatabase, ref, set } from 'firebase/database'
import FirebaseStorage from "../database/firebaseStorage"
import DatasetManager from "./datasetManager"

export default DocumentsManager =
  deleteDocsWithIds: (idsToDelete, currentUser, callback = () => {}) ->
    for docId in idsToDelete
      docs = DatasetManager.getValidArray(await DB.getTable("#{DB.tables.documents}/#{currentUser?.key}"))
      if Manager.isValid(docs)
        for thisDoc in docs
          if thisDoc.id == docId
            await DB.deleteById("#{DB.tables.documents}/#{currentUser?.key}", docId)
            await FirebaseStorage.deleteFile("#{FirebaseStorage.directories.documents}/#{currentUser.id}/#{thisDoc.name}")
            if callback then callback(docId)

  addToDocumentsTable: (currentUser, data) ->
    dbRef = ref getDatabase()
    tableData = await DB.getTable ("#{DB.tables.documents}/#{currentUser?.key}")

    if Manager.isValid (tableData)
      if tableData.length > 0
        tableData = [tableData..., data].filter (item) -> item
      else
        tableData = [data]
    else
      tableData = [data]

    await set child(dbRef, "#{DB.tables.documents}/#{currentUser?.key}"), tableData

  fixTypos: (jackedUpText) ->
    jackedUpText
      .replaceAll "Xriday", "Friday"
      .replaceAll "Asagreed", "As agreed"
      .replaceAll "Barent", "Parent"
      .replaceAll "Xf", "If"
      .replaceAll "Furst", "First"
      .replaceAll ":\n", ""
      .replaceAll ":", " "
      .replaceAll "u »", "up"
      .replaceAll "+». lransporling", "transporting"
      .replaceAll "trans Horting", "transporting"
      .replaceAll "th ++", "the"
      .replaceAll "b ,", "by"
      .replaceAll "witha", "with a"
      .replaceAll "ane\n", "anyone"
      .replaceAll "|", ""
      .replaceAll "| -", ""
      .replaceAll "|\n-", ""
      .replaceAll "|\n", ""
      .replaceAll "Racha .-.", ""
      .replaceAll "Racha", ""
      .replaceAll "théir", "their"
      .replaceAll "their-own", "their own"
      .replaceAll ".-.", "."
      .replaceAll "Transprtatin", "Transportation"
      .replaceAll "(Hyeniyedts)", ""
      .replaceAll "weelend", "weekend"
      .replaceAll " e ", ""
      .replaceAll "6G", "6."
      .replaceAll "andi", "and"
      .replaceAll "th\n", "the"
      .replaceAll "++", ""
      .replaceAll "withelegal", "with legal"
      .replaceAll "oo o i a", ""
      .replaceAll "o\n", ""
      .replaceAll "\no", ""
      .replaceAll "\ne", ""
      .replaceAll ": : ", ""
      .replaceAll "PriorityIn", "Priority In"
      .replaceAll "thfollowing", "the following"
      .replaceAll ":o", ""
      .replaceAll ": o", ""
      .replaceAll "at:the", "at the"
      .replaceAll "44 ; pild(ren)’s", "child(ren)'s"
      .replaceAll "birt c 4 Ad Pater y d(ren)’s", ""
      .replaceAll "even-\nbered", "even-numbered"
      .replaceAll "Lar ent 2", "Parent 2"
      .replaceAll "otherwi di pum gE 5 Vols. nless", ""
      .replaceAll "Schoo *", "School"
      .replaceAll "birt IIE", ""
      .replaceAll "tparticipate", "to participate"
      .replaceAll "orSunday", "or Sunday"
      .replaceAll "Jiven", "Given"
      .replaceAll "Bven", "Even"
      .replaceAll "gE ", ""
      .replaceAll "Vols. ", ""
      .replaceAll "chil oa 2y.13 £0 DY SPOIL", ""
      .replaceAll "Wot mt week", ""
      .replaceAll "birt ", ""
      .replaceAll "Pater ", ""
      .replaceAll "Birthda ", ""
      .replaceAll " d(ren)’s", "child(ren)'s"
      .replaceAll "c 4", ""
      .replaceAll "pild(ren)’s", "children's"
      .replaceAll "ychild(ren)'s", "children's"
      .replaceAll "44 ;", ""
      .replaceAll " c ", ""
      .replaceAll "even-\n\nbered", "even-numbered"
      .replaceAll " di ", ""
      .replaceAll "5unless", "unless"
      .replaceAll "otherwi ", "otherwise"
      .replaceAll "otherwisedi", "otherwise"
      .replaceAll "pum", ""
      .replaceAll "4 Ad", ""
      .replaceAll "child(ren)’s   children's", "children's"
#      .replaceAll "\n", "X"
      .replaceAll "patent", "parent"
      .replaceAll "IIE", "on his/her"
      .replaceAll " 1n", " in"
      .replaceAll "\nild(ren)", " children"
#      .replaceAll " 5 ", ""
      .replaceAll "otherwise\n", ""
      .replaceAll " nless", ""
      .replaceAll "otherwise\n otherwise", ""
      .replaceAll "entitled\nto", "entitled to"
      .replaceAll(" , ", ", ")
      .replaceAll("10 2.10.   H n. i   ", "10a.m. to 8p.m. for ")
      .replaceAll(" i 3 i her birthday", " ")
      .replaceAll("pam...", "p.m.")
      .replaceAll("Fr\nFinding", "Ending")
      .replaceAll("Le ven a", "")
      .replaceAll("io a 4", "")
      .replaceAll("- pe\n", "")
      .replaceAll("6 00 ", "6:00")
      .replaceAll("Given years", "Even years")
      .replaceAll("5 otherwise", " otherwise")
      .replaceAll(" © ", " ")