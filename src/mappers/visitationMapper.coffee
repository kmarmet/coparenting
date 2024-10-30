import ReminderTimes from 'constants/reminderTimes'
import DateManager from 'managers/dateManager'
import ScheduleTypes from 'constants/scheduleTypes'

VisitationMapper =
  formattedScheduleTypes: (type) ->
    switch true
      when type.contains '50'
        return ScheduleTypes.fiftyFifty
      when type.contains 'Custom Weekends'
        return ScheduleTypes.customWeekends
      when type.contains 'Every Weekend'
        return ScheduleTypes.everyWeekend
      when type.contains 'Every other Weekend'
        return ScheduleTypes.everyOtherWeekend
    null


export default VisitationMapper

