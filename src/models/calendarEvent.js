import util from "../util";

class CalendarEvent {
  constructor(id = "", directionsLink = "", date = "", time = "", phone = "", children = [], location = "", title = "", createdBy = "", forCoparent = "") {
    this.id = "";
    this.date = "";
    this.phone = "";
    this.children = [];
    this.location = "";
    this.title = "";
    this.directionsLink,
    (this.time = ""), (this.createdBy = ""), (this.forCoparent = "");
  }

  // Id
  set setId(id) {
    this.id = id;
  }
  get getId() {
    return this.id;
  }

  // Date
  set setDate(date) {
    this.date = util.getCurrentDate();
  }
  get getDate() {
    return this.date;
  }

   // Date
   set setDate(directionsLink) {
    this.directionsLink = directionsLink
  }
  get getDate() {
    return this.directionsLink;
  }

  
  // Time
  set setTime(time) {
    this.time = time;
  }
  get getTime() {
    return this.time;
  }

  // CreatedBy
  set setCreatedBy(createdBy) {
    this.createdBy = createdBy;
  }
  get getCreatedBy() {
    return this.createdBy;
  }

  // ForCoparent
  set setForCoparent(forCoparent) {
    this.forCoparent = forCoparent;
  }
  get getForCoparent() {
    return this.forCoparent;
  }

  // Location
  set setLocation(location) {
    this.location = location;
  }
  get getLocation() {
    return this.location;
  }

  // Title
  set setTitle(title) {
    this.title = title;
  }
  get getTitle() {
    return this.title;
  }

  // Phone
  set setPhone(phone) {
    this.phone = phone;
  }
  get getPhone() {
    return this.phone;
  }

  // Children
  set setChildren(children) {
    this.children = children;
  }
  get getChildren() {
    return this.children;
  }
}

export default CalendarEvent;
