import util from "../util";

class User {
  constructor(name = "name", isVerified = "isVerified", email = "email", password = "password", coparents = "coparents", children = "children", phone = "phone", parentType = "parentType", verificationCode = "") {
    this.verificationCode = verificationCode;
    this.name = name;
    this.isVerified = isVerified;
    this.email = email;
    this.phone = phone;
    this.password = password;
    this.children = children;
    this.coparents = coparents;
    this.parentType = parentType;
  }

  // Name
  set setName(name) {
    this.name = name;
  }
  get getName() {
    return this.name;
  }

  // IsVerified
  set setIsVerified(isVerified) {
    this.isVerified = isVerified;
  }
  get getIsVerified() {
    return this.isVerified;
  }

  // VerificationCode
  set setVerificationCode(verificationCode) {
    this.verificationCode = verificationCode;
  }
  get getVerificationCode() {
    return this.verificationCode;
  }

  // ParentType
  set setParentType(parentType) {
    this.parentType = parentType;
  }
  get getParentType() {
    return this.parentType;
  }

  // Phone
  set setPhone(phone) {
    this.phone = phone;
  }
  get getPhone() {
    return this.phone;
  }

  // Email
  set setEmail(email) {
    this.email = email;
  }
  get getEmail() {
    return this.email;
  }

  // Password
  set setPassword(password) {
    this.password = password;
  }
  get getPassword() {
    return this.password;
  }

  // Coparents
  set setCoparents(coparents) {
    this.coparents = coparents;
  }
  get getCoparents() {
    return this.coparents;
  }

  // Children
  set setChildren(children) {
    this.children = children;
  }
  get getChildren() {
    return this.children;
  }
}

export default User;
