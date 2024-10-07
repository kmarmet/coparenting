import { child, get, getDatabase, onValue, push, ref, remove, set, update } from 'firebase/database'
import DB from '@db'
import PushAlertApi from '@api/pushAlert'

export default NotificationManager =
  getUserSubId: (userPhone) =>
    new Promise (resolve) =>
      dbRef = ref(getDatabase())
      subsSnapshot = await get(child(dbRef, DB.tables.pushAlertSubscribers))
      allSubs = Object.entries(await subsSnapshot.val())
      allSubs.forEach (sub)=>
        if sub[0] is userPhone
          resolve sub[1]
  sendToShareWith: (coparentPhones, title, message) =>
    for phone in coparentPhones
      subId = NotificationManager.getUserSubId(phone)
      await PushAlertApi.sendMessage(title, message, subId )


