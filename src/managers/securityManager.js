// Generated by CoffeeScript 2.7.0
var SecurityManager;

import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  uniqueArray,
  getFileExtension
} from "../globalFunctions";

import Manager from '@manager';

import DB from "../database/DB";

SecurityManager = {
  getCalendarEvents: async function(currentUser) {
    var allEvents, event, i, len, returnRecords, shareWith;
    returnRecords = [];
    allEvents = Manager.convertToArray((await DB.getTable(DB.tables.calendarEvents))).flat();
    for (i = 0, len = allEvents.length; i < len; i++) {
      event = allEvents[i];
      shareWith = event.shareWith;
      if (Manager.isValid(event.fromDate) && event.fromDate.length > 0) {
        if (Manager.isValid(shareWith, true)) {
          if (shareWith.includes(currentUser.phone) || event.phone === currentUser.phone) {
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
    for (i = 0, len = allExpenses.length; i < len; i++) {
      expense = allExpenses[i];
      shareWith = expense.shareWith;
      if (Manager.isValid(shareWith, true)) {
        if (shareWith.includes(currentUser.phone) || expense.phone === currentUser.phone) {
          returnRecords.push(expense);
        }
      }
    }
    return returnRecords;
  },
  getSwapRequests: async function(currentUser) {
    var allRequests, i, len, request, returnRecords, shareWith;
    returnRecords = [];
    allRequests = Manager.convertToArray((await DB.getTable(DB.tables.swapRequests))).flat();
    for (i = 0, len = allRequests.length; i < len; i++) {
      request = allRequests[i];
      shareWith = request.shareWith;
      if (Manager.isValid(shareWith, true)) {
        if (shareWith.includes(currentUser.phone) || request.phone === currentUser.phone) {
          returnRecords.push(request);
        }
      }
    }
    return returnRecords;
  },
  getTransferChangeRequests: async function(currentUser) {
    var allRequests, i, len, request, returnRecords, shareWith;
    returnRecords = [];
    allRequests = Manager.convertToArray((await DB.getTable(DB.tables.transferChangeRequests))).flat();
    for (i = 0, len = allRequests.length; i < len; i++) {
      request = allRequests[i];
      shareWith = request.shareWith;
      if (Manager.isValid(shareWith, true)) {
        if (shareWith.includes(currentUser.phone) || request.phone === currentUser.phone) {
          returnRecords.push(request);
        }
      }
    }
    return returnRecords.flat();
  },
  getDocuments: async function(currentUser) {
    var allDocs, doc, i, len, returnRecords, shareWith;
    returnRecords = [];
    allDocs = Manager.convertToArray((await DB.getTable(DB.tables.documents))).flat();
    for (i = 0, len = allDocs.length; i < len; i++) {
      doc = allDocs[i];
      shareWith = doc.shareWith;
      if (Manager.isValid(shareWith, true)) {
        if (shareWith.includes(currentUser.phone) || doc.uploadedBy === currentUser.phone) {
          returnRecords.push(doc);
        }
      }
    }
    return returnRecords.flat();
  },
  getMemories: async function(currentUser) {
    var allMemories, i, len, memory, returnRecords, shareWith;
    returnRecords = [];
    allMemories = Manager.convertToArray((await DB.getTable(DB.tables.memories))).flat();
    for (i = 0, len = allMemories.length; i < len; i++) {
      memory = allMemories[i];
      shareWith = memory.shareWith;
      if (Manager.isValid(shareWith, true)) {
        if (shareWith.includes(currentUser.phone) || memory.createdBy === currentUser.phone) {
          returnRecords.push(memory);
        }
      }
    }
    return returnRecords.flat();
  }
};

export default SecurityManager;

//# sourceMappingURL=securityManager.js.map