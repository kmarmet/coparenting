// Path: src\components\screens\visitation\customWeekends.jsx
import moment from "moment"
import React, {useContext, useEffect, useRef, useState} from "react"
import DatetimeFormats from "../../../constants/datetimeFormats"
import ScheduleTypes from "../../../constants/scheduleTypes"
import globalState from "../../../context"
import useChildren from "../../../hooks/useChildren"
import useCoParents from "../../../hooks/useCoParents"
import useCurrentUser from "../../../hooks/useCurrentUser"
import useUsers from "../../../hooks/useUsers"
import AlertManager from "../../../managers/alertManager"
import DatasetManager from "../../../managers/datasetManager"
import DomManager from "../../../managers/domManager"
import DropdownManager from "../../../managers/dropdownManager"
import Manager from "../../../managers/manager"
import StringManager from "../../../managers/stringManager"
import VisitationManager from "../../../managers/visitationManager"
import CalendarEvent from "../../../models/new/calendarEvent"
import Form from "../../shared/form"
import FormDivider from "../../shared/formDivider"
import MyConfetti from "../../shared/myConfetti"
import SelectDropdown from "../../shared/selectDropdown"
import Spacer from "../../shared/spacer"

export default function CustomWeekends({hide, showCard}) {
      const {state, setState} = useContext(globalState)
      const {theme} = state

      // STATE
      const [fifthWeekendSelection, setFifthWeekendSelection] = useState("")
      const [defaultSelectedWeekends, setDefaultSelectedWeekends] = useState([])

      // HOOKS
      const {currentUser} = useCurrentUser()
      const {children, childrenAreLoading} = useChildren()
      const {coParents, coParentsAreLoading} = useCoParents()
      const {users} = useUsers()

      // DROPDOWN STATE
      const [selectedShareWithOptions, setSelectedShareWithOptions] = useState([])
      const [defaultShareWithOptions, setDefaultShareWithOptions] = useState([])
      const [selectedSpecificWeekends, setSelectedSpecificWeekends] = useState("")
      const [selectedFifthWeekend, setSelectedFifthWeekend] = useState("")
      // REF
      const formRef = useRef(null)

      const ResetForm = () => {
            Manager.ResetForm("custom-weekends-schedule")
            setState({...state, refreshKey: Manager.GetUid(), isLoading: false})
            hide()
      }

      const HandleFifthWeekendSelection = (e) => {
            DomManager.HandleCheckboxSelection(
                  e,
                  (e) => {
                        setFifthWeekendSelection(e)
                  },
                  () => {},
                  false
            )
      }

      const HandleSpecificWeekendSelection = (e) => {
            DomManager.HandleCheckboxSelection(
                  e,
                  (e) => {
                        if (defaultSelectedWeekends.length > 0) {
                              setDefaultSelectedWeekends((defaultSelectedWeekends) => [...defaultSelectedWeekends, e])
                        } else {
                              setDefaultSelectedWeekends([e])
                        }
                  },
                  () => {},
                  true
            )
      }

      const AddSpecificWeekendsToCalendar = async () => {
            if (!Manager.IsValid(defaultSelectedWeekends) || !Manager.IsValid(fifthWeekendSelection)) {
                  AlertManager.throwError("Please choose default weekends and a five-month weekend")
                  return false
            }

            // Set end date to the end of the year
            const endDate = moment([moment().year()]).endOf("year").format("MM-DD-YYYY")
            let weekends = VisitationManager.getSpecificWeekends(
                  ScheduleTypes.variableWeekends,
                  endDate,
                  defaultSelectedWeekends,
                  fifthWeekendSelection
            )

            // Standard Dates
            let events = []
            weekends.flat().forEach((date) => {
                  const dateObject = new CalendarEvent()
                  // Required
                  dateObject.title = `${StringManager.GetFirstNameOnly(currentUser?.name)}'s Scheduled Visitation`
                  dateObject.startDate = moment(date).format(DatetimeFormats.dateForDb)
                  // Not Required
                  dateObject.ownerKey = currentUser?.key
                  dateObject.createdBy = currentUser?.name
                  dateObject.fromVisitationSchedule = true
                  dateObject.id = Manager.GetUid()
                  dateObject.visitationSchedule = ScheduleTypes.customWeekends
                  dateObject.shareWith = DatasetManager.getUniqueArray(formRef.current.shareWith, "phone").flat()

                  if (events.length === 0) {
                        events = [dateObject]
                  } else {
                        events = [...events, dateObject]
                  }
            })

            MyConfetti.fire()
            await ResetForm()
            events = DatasetManager.getUniqueArray(events, "startDate")

            // Upload to DB
            VisitationManager.AddVisitationSchedule(currentUser, events).then((r) => r)
      }

      useEffect(() => {
            if (Manager.IsValid(children) && Manager.IsValid(coParents) && Manager.IsValid(users)) {
                  setSelectedShareWithOptions(DropdownManager.GetSelected.ShareWithFromKeys([], users))
                  setDefaultShareWithOptions(DropdownManager.GetDefault.ShareWith(children, coParents))
            }
      }, [children, coParents, users])

      return (
            <Form
                  submitText={"Create Schedule"}
                  className={"long-title form"}
                  onSubmit={AddSpecificWeekendsToCalendar}
                  wrapperClass="custom-weekends-schedule"
                  title={"Custom Weekends Schedule"}
                  showCard={showCard}
                  onClose={() => ResetForm()}>
                  <FormDivider text={"All Fields are Required"} />

                  <SelectDropdown
                        selectMultiple={true}
                        placeholder={"Weekend YOU will have the child(ren)"}
                        options={[
                              {label: "1st Weekend", value: "1st Weekend"},
                              {label: "2nd Weekend", value: "2nd Weekend"},
                              {label: "3rd Weekend", value: "3rd Weekend"},
                              {label: "4th Weekend", value: "4th Weekend"},
                        ]}
                        onChange={setSelectedSpecificWeekends}
                  />

                  <Spacer height={5} />

                  <SelectDropdown
                        placeholder={"Month with 5 weekends (extra weekend)"}
                        options={[
                              {label: "1st Weekend", value: "1st Weekend"},
                              {label: "2nd Weekend", value: "2nd Weekend"},
                              {label: "3rd Weekend", value: "3rd Weekend"},
                              {label: "4th Weekend", value: "4th Weekend"},
                              {label: "5th Weekend", value: "5th Weekend"},
                        ]}
                        onChange={setFifthWeekendSelection}
                  />

                  <Spacer height={5} />

                  <SelectDropdown
                        selectMultiple={true}
                        options={defaultShareWithOptions}
                        onSelect={setSelectedShareWithOptions}
                        placeholder={"Select Contacts to Share With"}
                  />
                  <hr className="mt-5 mb-10" />
            </Form>
      )
}