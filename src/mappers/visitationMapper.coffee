import ScheduleTypes from '../constants/scheduleTypes'
import Manager from "../managers/manager"

VisitationMapper =
  formattedScheduleTypes: (type) ->
    console.log(type)
    switch true
      when Manager.contains(type, '50')
        return ScheduleTypes.fiftyFifty
      when Manager.contains(type, 'Custom Weekends')
        return ScheduleTypes.customWeekends
      when Manager.contains(type, 'Every Weekend')
        return ScheduleTypes.everyWeekend
      when Manager.contains(type, 'Every other Weekend')
        return ScheduleTypes.everyOtherWeekend
    null


export default VisitationMapper