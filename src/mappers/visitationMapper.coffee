import ScheduleTypes from '../constants/scheduleTypes'
import Manager from "../managers/manager"

VisitationMapper =
  formattedScheduleTypes: (type) ->
    console.log(type)
    switch true
      when Manager.Contains(type, '50')
        return ScheduleTypes.fiftyFifty
      when Manager.Contains(type, 'Custom Weekends')
        return ScheduleTypes.customWeekends
      when Manager.Contains(type, 'Every Weekend')
        return ScheduleTypes.everyWeekend
      when Manager.Contains(type, 'Every other Weekend')
        return ScheduleTypes.everyOtherWeekend
    null


export default VisitationMapper