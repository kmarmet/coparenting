import ReminderTimes from 'constants/reminderTimes'
import DateManager from 'managers/dateManager'
import scheduleTypes from 'constants/scheduleTypes'

VisitationMapper =
  formattedScheduleTypes: (type) ->
    switch true
      when type.contains '50'
        return scheduleTypes.fiftyFifty
      when type.contains 'Specific Weekends'
        return scheduleTypes.specificWeekends
      when type.contains 'Every Weekend'
        return scheduleTypes.everyOtherWeekend
      when type.contains 'Every other Weekend'
        return scheduleTypes.everyOtherWeekend
    null


export default VisitationMapper

