import DB from "../database/DB"
import LogManager from "./logManager"
import Manager from "./manager"
import DatasetManager from "./datasetManager"
import { child, getDatabase, ref, set } from 'firebase/database'

export default InvitationManager =
  AddInvitation: (invitation, currentUserKey) ->
    try
      dbRef = ref(getDatabase())
      tableData = []
      existingInvitations = await DB.getTable("#{DB.tables.invitations}/#{currentUserKey}")
      if Manager.IsValid(existingInvitations)
        if (Manager.IsValid(existingInvitations))
          tableData = DatasetManager.AddToArray(existingInvitations, invitation)
        else
          tableData = [invitation]

      else
        tableData = [invitation]

      await set(child(dbRef, "#{DB.tables.invitations}/#{currentUserKey}"), tableData)
    catch error
      LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)

  RemoveInvitation: (id) ->
    try
      if Manager.IsValid(id)
        await DB.Delete("#{DB.tables.invitations}/#{id}")
    catch error
      LogManager.Log(error.message, LogManager.LogTypes.error, error.stack)