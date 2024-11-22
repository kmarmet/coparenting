// Generated by CoffeeScript 2.7.0
var NotificationManager;

import {
  child,
  get,
  getDatabase,
  ref
} from 'firebase/database';

import DB from '@db';

import PushAlertApi from '@api/pushAlert';

export default NotificationManager = {
  getUserSubId: async(userPhone) => {
    var dbRef, subId;
    dbRef = ref(getDatabase());
    subId = '';
    await get(child(dbRef, `${DB.tables.pushAlertSubscribers}`)).then(function(snapshot) {
      var _subId;
      _subId = snapshot.val();
      return subId = _subId[userPhone];
    });
    return subId;
  },
  sendToShareWith: async(coparentPhones, title, message) => {
    var i, len, phone, results, subId;
    results = [];
    for (i = 0, len = coparentPhones.length; i < len; i++) {
      phone = coparentPhones[i];
      subId = NotificationManager.getUserSubId(phone);
      results.push((await PushAlertApi.sendMessage(title, message, subId)));
    }
    return results;
  }
};

//# sourceMappingURL=notificationManager.js.map
