// Generated by CoffeeScript 2.7.0
var AppManager;

import Manager from "./manager";

import DB from "../database/DB";

import DateManager from "./dateManager";

import moment from "moment";

import {
  child,
  get,
  getDatabase,
  push,
  ref,
  remove,
  set,
  update
} from 'firebase/database';

export default AppManager = {
  setAppBadge: (count) => {
    if (window.navigator.setAppBadge) {
      return window.navigator.setAppBadge(count);
    }
  },
  clearAppBadge: () => {},
  //    window.navigator.clearAppBadge()
  isDevMode: () => {
    return location.hostname === 'localhost';
  },
  getAccountType: (currentUser) => {
    if (Manager.isValid(currentUser)) {
      if (Manager.isValid(currentUser.accountType)) {
        if (currentUser.accountType === 'parent') {
          return 'parent';
        } else {
          return 'child';
        }
      }
      return 'parent';
    }
  },
  hidePopupCard: () => {
    var cardContainer;
    cardContainer = document.getElementById("popup-card-container");
    if (cardContainer) {
      return cardContainer.classList.remove("active");
    }
  },
  applyVersionNumberToUrl: () => {
    var formattedUpdateUrl, formattedUpdateUrlWithOneVersion, versionNumber;
    versionNumber = Manager.getUid().substring(0, 4);
    formattedUpdateUrl = window.location.href.replaceAll(versionNumber, '');
    formattedUpdateUrlWithOneVersion = formattedUpdateUrl.substring(0, formattedUpdateUrl.indexOf("/") + versionNumber);
    return history.replaceState(versionNumber, '', formattedUpdateUrlWithOneVersion);
  },
  setHolidays: async() => {
    var cal, holidays;
    cal = (await DB.getTable(DB.tables.calendarEvents));
    holidays = cal.filter((x) => {
      return x.isHoliday === true;
    });
    if (holidays.length === 0) {
      return (await DateManager.setHolidays());
    }
  },
  deleteExpiredCalendarEvents: async function() {
    var daysPassed, event, events, i, len;
    events = (await DB.getTable(DB.tables.calendarEvents));
    if (!Array.isArray(events)) {
      events = DB.convertKeyObjectToArray(events);
    }
    if (Manager.isValid(events, true)) {
      events = events.filter(function(x) {
        return x != null;
      });
      for (i = 0, len = events.length; i < len; i++) {
        event = events[i];
        if (!(Manager.isValid(event))) {
          continue;
        }
        daysPassed = DateManager.getDuration('days', moment(), event.fromDate);
        if (daysPassed <= -30 && !event.isHoliday) {
          await DB.delete(DB.tables.calendarEvents, event.id);
          return;
        }
      }
    }
  },
  deleteExpiredMemories: async function() {
    var i, key, len, memories, memory, results, user, users;
    users = (await DB.getTable(DB.tables.users));
    if (!Array.isArray(users)) {
      users = DB.convertKeyObjectToArray(users);
    }
    results = [];
    for (i = 0, len = users.length; i < len; i++) {
      user = users[i];
      if (Manager.isValid(user.memories, true)) {
        if (!Array.isArray(user.memories)) {
          memories = DB.convertKeyObjectToArray(user.memories);
        }
        results.push((await (async function() {
          var j, len1, results1;
          results1 = [];
          for (j = 0, len1 = memories.length; j < len1; j++) {
            memory = memories[j];
            if (DateManager.getDuration("days", moment(memory != null ? memory.creationDate : void 0), moment()) > 28) {
              key = (await DB.getNestedSnapshotKey(`users/${user.phone}/memories`, memory, "id"));
              results1.push((await DB.deleteByPath(`users/${user.phone}/memories/${key}`)));
            } else {
              results1.push(void 0);
            }
          }
          return results1;
        })()));
      } else {
        results.push(void 0);
      }
    }
    return results;
  }
};

//# sourceMappingURL=appManager.js.map