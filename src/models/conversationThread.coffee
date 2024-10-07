export default class ConversationThread
  constructor: (@id, @members = [], @timestamp = '', @messages = [], @firstMessageFrom = '') ->
