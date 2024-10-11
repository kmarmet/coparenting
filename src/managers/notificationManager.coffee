import { child, get, getDatabase, onValue, push, ref, remove, set, update } from 'firebase/database'
import DB from '@db'
import PushAlertApi from '@api/pushAlert'

export default NotificationManager =
  getUserSubId: (userPhone) =>
    subId = await DB.getTable("#{DB.tables.pushAlertSubscribers}/#{userPhone}")
    return subId
  sendToShareWith: (coparentPhones, title, message) =>
    for phone in coparentPhones
      subId = NotificationManager.getUserSubId(phone)
      await PushAlertApi.sendMessage(title, message, subId )


