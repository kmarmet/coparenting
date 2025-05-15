import Manager from "/src/managers/manager"

Contact = null
export default class Contact
  constructor: (@id = Manager.GetUid(), @name = '',  @email = '', @phone = '', @address = '', @accountType = '', @parentType = '', @relationshipToMe = '', @profilePic = '', @userKey = '') ->