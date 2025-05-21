import Manager from "/src/managers/manager"

class Contact
  constructor: (@id = Manager.GetUid(), @name = '',  @email = '', @phone = '', @address = '', @accountType = '', @parentType = '', @relationshipToMe = '', @profilePic = '', @userKey = '') ->

export default Contact