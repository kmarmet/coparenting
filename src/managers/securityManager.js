// Generated by CoffeeScript 2.7.0
var SecurityManager,
  indexOf = [].indexOf;

import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount
} from "../globalFunctions";

import Manager from '@manager';

import DB from "../database/DB";

import DateManager from "./dateManager";

import _ from "lodash";

SecurityManager = {
  getCalendarEvents: async function(currentUser) {
    var allEvents, event, i, len, returnRecords, shareWith;
    returnRecords = [];
    allEvents = Manager.convertToArray((await DB.getTable(DB.tables.calendarEvents))).flat();
    if (!_.isEmpty(allEvents)) {
      for (i = 0, len = allEvents.length; i < len; i++) {
        event = allEvents[i];
        if (event.isHoliday && event.visibleToAll) {
          returnRecords.push(event);
        }
        shareWith = event.shareWith;
        if (DateManager.dateIsValid(event.startDate)) {
          if (event.ownerPhone === (currentUser != null ? currentUser.phone : void 0)) {
            returnRecords.push(event);
          }
          if (!_.isEmpty(shareWith) && shareWith.includes(currentUser != null ? currentUser.phone : void 0)) {
            returnRecords.push(event);
          }
        }
      }
    }
    return returnRecords;
  },
  getExpenses: async function(currentUser) {
    var allExpenses, expense, i, len, returnRecords, shareWith;
    returnRecords = [];
    allExpenses = Manager.convertToArray((await DB.getTable(DB.tables.expenseTracker))).flat();
    if (Manager.isValid(allExpenses, true)) {
      for (i = 0, len = allExpenses.length; i < len; i++) {
        expense = allExpenses[i];
        shareWith = expense.shareWith;
        if (expense.ownerPhone === (currentUser != null ? currentUser.phone : void 0)) {
          returnRecords.push(expense);
        }
        if (Manager.isValid(shareWith, true)) {
          if (shareWith.includes(currentUser != null ? currentUser.phone : void 0)) {
            returnRecords.push(expense);
          }
        }
      }
    }
    return returnRecords;
  },
  getSwapRequests: async function(currentUser) {
    var allRequests, i, len, request, returnRecords, shareWith;
    returnRecords = [];
    allRequests = Manager.convertToArray((await DB.getTable(DB.tables.swapRequests))).flat();
    if (Manager.isValid(allRequests, true)) {
      for (i = 0, len = allRequests.length; i < len; i++) {
        request = allRequests[i];
        shareWith = request.shareWith;
        if (request.ownerPhone === (currentUser != null ? currentUser.phone : void 0)) {
          returnRecords.push(request);
        }
        if (Manager.isValid(shareWith, true)) {
          if (shareWith.includes(currentUser != null ? currentUser.phone : void 0)) {
            returnRecords.push(request);
          }
        }
      }
    }
    return returnRecords;
  },
  getTransferChangeRequests: async function(currentUser) {
    var allRequests, i, len, request, returnRecords, shareWith;
    returnRecords = [];
    allRequests = Manager.convertToArray((await DB.getTable(DB.tables.transferChangeRequests))).flat();
    if (Manager.isValid(allRequests, true)) {
      for (i = 0, len = allRequests.length; i < len; i++) {
        request = allRequests[i];
        shareWith = request.shareWith;
        if (request.ownerPhone === (currentUser != null ? currentUser.phone : void 0)) {
          returnRecords.push(request);
        }
        if (Manager.isValid(shareWith, true)) {
          if (shareWith.includes(currentUser != null ? currentUser.phone : void 0)) {
            returnRecords.push(request);
          }
        }
      }
    }
    return returnRecords.flat();
  },
  getDocuments: async function(currentUser) {
    var allDocs, doc, i, len, returnRecords, shareWith;
    returnRecords = [];
    allDocs = Manager.convertToArray((await DB.getTable(DB.tables.documents))).flat();
    if (Manager.isValid(allDocs, true)) {
      for (i = 0, len = allDocs.length; i < len; i++) {
        doc = allDocs[i];
        shareWith = doc.shareWith;
        if (doc.phone === (currentUser != null ? currentUser.phone : void 0)) {
          returnRecords.push(doc);
        }
        if (doc.phone === (currentUser != null ? currentUser.phone : void 0)) {
          returnRecords.push(doc);
        }
        if (Manager.isValid(shareWith, true)) {
          returnRecords.push(doc);
        }
      }
    }
    return returnRecords.flat();
  },
  getMemories: async function(currentUser) {
    var allMemories, i, len, memory, returnRecords, shareWith;
    returnRecords = [];
    allMemories = Manager.convertToArray((await DB.getTable(`${DB.tables.memories}`))).flat();
    if (Manager.isValid(allMemories, true)) {
      for (i = 0, len = allMemories.length; i < len; i++) {
        memory = allMemories[i];
        shareWith = memory.shareWith;
        if (memory.ownerPhone === (currentUser != null ? currentUser.phone : void 0)) {
          returnRecords.push(memory);
        }
        if (Manager.isValid(shareWith, true)) {
          if (shareWith.includes(currentUser != null ? currentUser.phone : void 0)) {
            returnRecords.push(memory);
          }
        }
      }
    }
    return returnRecords.flat();
  },
  getArchivedChats: async function(currentUser) {
    var allArchivedChats, chat, chatArray, i, j, len, len1, returnRecords;
    returnRecords = [];
    allArchivedChats = Manager.convertToArray((await DB.getTable(`${DB.tables.archivedChats}`))).flat();
    if (Manager.isValid(allArchivedChats, true)) {
      for (i = 0, len = allArchivedChats.length; i < len; i++) {
        chatArray = allArchivedChats[i];
        for (j = 0, len1 = chatArray.length; j < len1; j++) {
          chat = chatArray[j];
          if (chat.threadOwner === (currentUser != null ? currentUser.phone : void 0)) {
            returnRecords.push(chat);
          }
        }
      }
    }
    return returnRecords.flat();
  },
  getInputSuggestions: async function(currentUser) {
    var i, len, returnRecords, suggestion, suggestions;
    returnRecords = [];
    suggestions = Manager.convertToArray((await DB.getTable(DB.tables.suggestions))).flat();
    if (Manager.isValid(suggestions, true)) {
      for (i = 0, len = suggestions.length; i < len; i++) {
        suggestion = suggestions[i];
        if (suggestion.ownerPhone === (currentUser != null ? currentUser.phone : void 0)) {
          returnRecords.push(suggestion);
        }
      }
    }
    return returnRecords.flat();
  },
  getChats: async function(currentUser) {
    var chat, chats, i, len, members, ref, ref1, ref2, securedChats;
    chats = Manager.convertToArray((await DB.getTable(`${DB.tables.chats}`))).flat();
    securedChats = [];
    // User does not have a chat with root access by phone
    if (Manager.isValid(chats, true)) {
      ref = chats.flat();
      for (i = 0, len = ref.length; i < len; i++) {
        chat = ref[i];
        if (!Manager.isValid(chat.hideFrom, true) || !chat.hideFrom.includes(currentUser.phone)) {
          members = chat != null ? (ref1 = chat.members) != null ? ref1.map(function(x) {
            return x.phone;
          }) : void 0 : void 0;
          if (ref2 = currentUser != null ? currentUser.phone : void 0, indexOf.call(members, ref2) >= 0) {
            securedChats.push(chat);
          }
        }
      }
    }
    return securedChats.flat();
  },
  getCoparentChats: async function(currentUser) {
    var activeChats, allChats, allChatsFlattened, chat, i, len, members, ref;
    allChats = (await DB.getTable('chats'));
    activeChats = [];
    allChatsFlattened = allChats.flat();
    if (Manager.isValid(allChatsFlattened, true)) {
      for (i = 0, len = allChatsFlattened.length; i < len; i++) {
        chat = allChatsFlattened[i];
        members = chat.members.map(function(x) {
          return x.phone;
        });
        if (ref = currentUser != null ? currentUser.phone : void 0, indexOf.call(members, ref) >= 0) {
          activeChats.push(chat);
        }
      }
    }
    return activeChats;
  }
};

export default SecurityManager;

//# sourceMappingURL=securityManager.js.map
