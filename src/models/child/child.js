// Generated by CoffeeScript 2.7.0
var Child

import moment from "moment"

import DatetimeFormats from "../../constants/datetimeFormats"
import Manager from "../../managers/manager"

Child = class Child {
    constructor(options = {}) {
        var ref, ref1, ref2
        this.id = Manager.GetUid()
        this.creationDate = moment().format(DatetimeFormats.dateForDb)
        this.userKey = (ref = options != null ? options.userKey : void 0) != null ? ref : ""
        this.profilePic = (ref1 = options != null ? options.profilePic : void 0) != null ? ref1 : ""
        this.details = (ref2 = options != null ? options.details : void 0) != null ? ref2 : []
    }
}

export default Child

//# sourceMappingURL=child.js.map