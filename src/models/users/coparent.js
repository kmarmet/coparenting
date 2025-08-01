// Generated by CoffeeScript 2.7.0
var CoParent

import Manager from "../../managers/manager"

CoParent = class CoParent {
    constructor(options = {}) {
        var ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8
        this.id = (ref = options != null ? options.id : void 0) != null ? ref : Manager.GetUid()
        this.name = (ref1 = options != null ? options.name : void 0) != null ? ref1 : ""
        this.parentType = (ref2 = options != null ? options.parentType : void 0) != null ? ref2 : ""
        this.phone = (ref3 = options != null ? options.phone : void 0) != null ? ref3 : ""
        this.userKey = (ref4 = options != null ? options.userKey : void 0) != null ? ref4 : Manager.GetUid()
        this.address = (ref5 = options != null ? options.address : void 0) != null ? ref5 : ""
        this.relationship = (ref6 = options != null ? options.relationship : void 0) != null ? ref6 : ""
        this.email = (ref7 = options != null ? options.email : void 0) != null ? ref7 : ""
        this.notificationsEnabled = (ref8 = options != null ? options.notificationsEnabled : void 0) != null ? ref8 : true
    }
}

export default CoParent

//# sourceMappingURL=coParent.js.map