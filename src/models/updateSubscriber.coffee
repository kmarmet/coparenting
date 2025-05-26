import Manager from "../managers/manager"

class UpdateSubscriber
  constructor: (options) ->
    @id= Manager.GetUid()
    @name = options?.name ? ''
    @phone = options?.phone ? ''
    @key =  options?.key ? ''
    @email =  options?.email ? ''
    @subscriptionId = options?.subscriptionId ? ''

export default UpdateSubscriber