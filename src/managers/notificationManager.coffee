import { child, get, getDatabase, ref } from 'firebase/database'
import DB from '@db'
import PushAlertApi from '@api/pushAlert'

export default NotificationManager =
  getUserSubId:(userPhone) =>
    dbRef = ref(getDatabase())
    subId = ''

    await get(child(dbRef, "#{DB.tables.pushAlertSubscribers}")).then (snapshot) ->
      _subId = snapshot.val()
      subId = _subId[userPhone]

    return subId
  sendToShareWith: (coparentPhones, title, message) =>
    for phone in coparentPhones
      subId = await NotificationManager.getUserSubId(phone)
      await PushAlertApi.sendMessage(title, message, subId )