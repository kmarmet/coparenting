export default class ActivitySet
  constructor: (
    @id = ''
    @memoryCount = 0
    @messageCount = 0
    @swapRequestCount = 0
    @transferRequestCount = 0
    @expenseCount = 0
    @eventCount = 0
    @documentCount = 0
    @chat = {
      unreadMessageCount: 0
      chatSenders: []
    }
  ) ->