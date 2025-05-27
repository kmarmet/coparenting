class General
  constructor: (options = {}) ->
    @dateOfBirth = options?.dateOfBirth ? ''
    @address = options?.address ? ''
    @phone = options?.phone ? ''
    @name = options?.name ? ''
    @email =  options?.email ? ''

export default General