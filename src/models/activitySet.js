// Generated by CoffeeScript 2.7.0
var ActivitySet;

export default ActivitySet = class ActivitySet {
  constructor(id = '', memoryCount = 0, messageCount = 0, swapRequestCount = 0, transferRequestCount = 0, expenseCount = 0, eventCount = 0, documentCount = 0, chat = {
      unreadMessageCount: 0,
      chatSenders: []
    }) {
    this.id = id;
    this.memoryCount = memoryCount;
    this.messageCount = messageCount;
    this.swapRequestCount = swapRequestCount;
    this.transferRequestCount = transferRequestCount;
    this.expenseCount = expenseCount;
    this.eventCount = eventCount;
    this.documentCount = documentCount;
    this.chat = chat;
  }

};

//# sourceMappingURL=activitySet.js.map