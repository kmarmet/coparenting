import util from "../util";

class Expense {
  constructor(id = "", name = "", amount = "", createdBy = "", dateAdded = util.getCurrentDate(), paidStatus = "unpaid", children = [], payee = "", dueDate, phone, notes, forCoparent) {
    this.forCoparent = forCoparent;
    this.name = name;
    this.amount = amount;
    this.paidStatus = paidStatus;
    this.children = children;
    this.payee = payee;
    this.dueDate = dueDate;
    this.notes = notes;
    this.id = id;
    this.phone = phone;
    this.dateAdded = dateAdded;
    this.createdBy = createdBy;
  }

  // Id
  set setId(id) {
    this.id = id;
  }
  get getId() {
    return this.id;
  }

  // ForCoparent
  set setForCoparent(forCoparent) {
    this.forCoparent = forCoparent;
  }
  get getForCoparent() {
    return this.forCoparent;
  }

  // CreatedBy
  set setCreatedBy(createdBy) {
    this.createdBy = createdBy;
  }
  get getCreatedBy() {
    return this.createdBy;
  }

  // DateAdded
  set setDateAdded(dateAdded) {
    this.dateAdded = util.getCurrentDate();
  }
  get getDateAdded() {
    return this.dateAdded;
  }

  // Name
  set setName(name) {
    this.name = name;
  }
  get getName() {
    return this.name;
  }

  // Phone
  set setPhone(phone) {
    this.phone = phone;
  }
  get getPhone() {
    return this.phone;
  }

  // Amount
  set setAmount(amount) {
    this.amount = amount;
  }
  get getAmount() {
    return this.amount;
  }

  // Paid Status
  set setPaidStatus(paidStatus) {
    this.paidStatus = paidStatus;
  }
  get getPaidStatus() {
    return this.paidStatus;
  }

  // Children
  set setChildren(children) {
    this.children = children;
  }
  get getChildren() {
    return this.children;
  }

  // Payee
  set setPayee(payee) {
    this.payee = payee;
  }
  get getPayee() {
    return this.payee;
  }

  // Due Date
  set setDueDate(dueDate) {
    this.dueDate = dueDate;
  }
  get getDueDate() {
    return this.dueDate;
  }

  // Notes
  set setNotes(notes) {
    this.notes = notes;
  }
  get getNotes() {
    return this.notes;
  }
}

export default Expense;
