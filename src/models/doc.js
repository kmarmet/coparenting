// Generated by CoffeeScript 2.7.0
var Doc;

import Manager from "../managers/manager";

export default Doc = class Doc {
  constructor(name = '', type = '', shareWith = [], url = '', id = Manager.getUid(), ownerPhone) {
    this.name = name;
    this.type = type;
    this.shareWith = shareWith;
    this.url = url;
    this.id = id;
    this.ownerPhone = ownerPhone;
  }

};
