
class Medical
  constructor: (options = {}) ->
    @doctorName = options?.doctorName ? ''
    @shareWith = options?.shareWith ? []
    @medications = options?.medications ? []
    @allergies = options?.allergies ? []
    @immunizations =  options?.immunizations ? []
    @conditions = options?.conditions ? []

export default Medical