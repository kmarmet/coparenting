class ValidationField
  constructor: (options = {}) ->
    @name = options.name ? ''
    @value = options.value ? ''
    @age = options.age ? ''
    @required = options.required ? false
    @type = options.type ? ''
    @errorTitle = options.errorTitle ? ''
    @errorMessage = options.errorMessage ? ''

export default ValidationField