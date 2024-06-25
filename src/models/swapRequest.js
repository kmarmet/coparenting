import util from "../util";

class SwapRequest {
  constructor(id = "", fromDate = "", createdBy = "", toDate = "", dateAdded = "", forCoparent = "", reason = "", length = "", phone = "", children = "", fromHour = "", toHour = "") {
    (this.children = []), (this.id = "");
    this.fromDate = "";
    this.toDate = "";
    this.dateAdded = util.getCurrentDate();
    this.forCoparent = "";
    this.reason = "";
    this.length = "";
    this.phone = "";
    (this.createdBy = ""), (this.fromHour = ""), (this.toHour = "");
  }

  // Id
  set setId(id) {
    this.id = id;
  }
  get getId() {
    return this.id;
  }

  // DateAdded
  set setDateAdded(dateAdded) {
    this.dateAdded = util.getCurrentDate();
  }
  get getDateAdded() {
    return this.dateAdded;
  }

  // Phone
  set setPhone(phone) {
    this.phone = phone;
  }
  get getPhone() {
    return this.phone;
  }

  // FromHour
  set setFromHour(fromHour) {
    this.fromHour = fromHour;
  }
  get getFromHour() {
    return this.fromHour;
  }

  // ToHour
  set setToHour(toHour) {
    this.toHour = toHour;
  }
  get getToHour() {
    return this.toHour;
  }

  // Children
  set setChildren(children) {
    this.children = children;
  }
  get getChildren() {
    return this.children;
  }

  // From Date
  set setFromDate(fromDate) {
    this.fromDate = fromDate;
  }
  get getFromDate() {
    return this.fromDate;
  }

  // ToDate
  set setToDate(toDate) {
    this.toDate = toDate;
  }
  get getToDate() {
    return this.toDate;
  }

  // Reason
  set setReason(reason) {
    this.reason = reason;
  }
  get getReason() {
    return this.reason;
  }

  // forCoparent
  set setForCoparent(forCoparent) {
    this.forCoparent = forCoparent;
  }
  get getForCoparent() {
    return this.forCoparent;
  }

  // creatdby
  set setCreatedBy(createdBy) {
    this.createdBy = createdBy;
  }
  get getCreatedBy() {
    return this.createdBy;
  }

  // Length
  set setLength(length) {
    this.length = length;
  }
  get getLength() {
    return this.length;
  }
}

export default SwapRequest;
