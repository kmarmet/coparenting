// Path: src\components\screens\visitation.jsx
import moment from "moment"
import React, {useContext, useEffect, useState} from "react"
import {BsHousesFill} from "react-icons/bs"
import ButtonThemes from "../../constants/buttonThemes"
import DatetimeFormats from "../../constants/datetimeFormats"
import ScheduleTypes from "../../constants/scheduleTypes"
import ScreenNames from "../../constants/screenNames"
import globalState from "../../context"
import DB from "../../database/DB"
import DB_UserScoped from "../../database/db_userScoped"
import useCalendarEvents from "../../hooks/useCalendarEvents"
import useChildren from "../../hooks/useChildren"
import useCoParents from "../../hooks/useCoParents"
import useCurrentUser from "../../hooks/useCurrentUser"
import useHolidays from "../../hooks/useHolidays"
import useUsers from "../../hooks/useUsers"
import AlertManager from "../../managers/alertManager"
import DatasetManager from "../../managers/datasetManager"
import DomManager from "../../managers/domManager"
import Manager from "../../managers/manager"
import ObjectManager from "../../managers/objectManager"
import StringManager from "../../managers/stringManager"
import VisitationManager from "../../managers/visitationManager"
import CalendarMapper from "../../mappers/calMapper"
import CalendarEvent from "../../models/new/calendarEvent"
import NavBar from "../navBar"
import CustomWeekends from "../screens/visitation/customWeekends"
import EveryOtherWeekend from "../screens/visitation/everyOtherWeekend"
import FiftyFifty from "../screens/visitation/fiftyFifty"
import AddressInput from "../shared/addressInput"
import Button from "../shared/button"
import Label from "../shared/label"
import MyConfetti from "../shared/myConfetti"
import Screen from "../shared/screen"
import ScreenHeader from "../shared/screenHeader"
import SelectDropdown from "../shared/selectDropdown"
import Spacer from "../shared/spacer"
import VisitationRequests from "./visitationRequests"

export default function Visitation() {
    const {state, setState} = useContext(globalState)
    const {theme} = state

    // State
    const [showEveryOtherWeekendCard, setShowEveryOtherWeekendCard] = useState(false)
    const [showFiftyFiftyCard, setShowFiftyFiftyCard] = useState(false)
    const [shareWith, setShareWith] = useState([])
    const [showCustomWeekendsCard, setShowCustomWeekendsCard] = useState(false)
    const [scheduleType, setScheduleType] = useState("")
    const [existingScheduleEvents, setExistingScheduleEvents] = useState([])
    const [showUpdateHolidaysButton, setShowUpdateHolidaysButton] = useState(true)
    const [showDeleteButton, setShowDeleteButton] = useState(false)
    const [showVisitationSection, setShowVisitationSection] = useState(false)
    const [showHolidaysSection, setShowHolidaysSection] = useState(false)
    const [contentIsReady, setContentIsReady] = useState(false)

    // HOOKS
    const {currentUser} = useCurrentUser()
    const {calendarEvents} = useCalendarEvents()
    const {children, childrenDropdownOptions} = useChildren()
    const {coParents, coParentsDropdownOptions} = useCoParents()
    const {users} = useUsers()
    const {holidays} = useHolidays(currentUser, "all")

    // DROPDOWN STATE
    const [selectedVisitationHolidayOptions, setSelectedVisitationHolidayOptions] = useState([])
    const [defaultHolidayOptions, setDefaultHolidayOptions] = useState([])
    const [selectedHolidayOptions, setSelectedHolidayOptions] = useState([])

    // Holiday
    const [userHolidays, setUserHolidays] = useState([])
    const [selectedHolidayDates, setSelectedHolidayDates] = useState([])

    const UpdateDefaultTransferLocation = async (location, link) => {
        await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUser?.key}/visitation/transferNavLink`, link)
        await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUser?.key}/visitation/transferAddress`, location)
    }

    const DeleteSchedule = async () => {
        await VisitationManager.deleteSchedule(currentUser, existingScheduleEvents)
        setExistingScheduleEvents([])
        setShowDeleteButton(false)
        setState({...state, bannerMessage: "Visitation Schedule Removed", isLoading: false})
    }

    // Every Weekend
    const AddEveryWeekendToCalendar = async () => {
        // Set end date to the end of the year
        let weekends = VisitationManager.getEveryWeekend()
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
            dateObject.visitationSchedule = ScheduleTypes.everyWeekend
            dateObject.shareWith = DatasetManager.getUniqueArray(shareWith).flat()

            events.push(dateObject)
        })

        // Upload to DB
        VisitationManager.AddVisitationSchedule(currentUser, events).then((r) => r)
        MyConfetti.fire()
    }

    // SET HOLIDAYS IN DATABASE
    const SetHolidaysInDatabase = async () => {
        // Holidays
        if (Manager.IsValid(selectedVisitationHolidayOptions)) {
            // setShowUpdateHolidaysButton(false)
            let events = []
            selectedVisitationHolidayOptions.forEach((holiday) => {
                const dateObject = new CalendarEvent()
                // Required
                dateObject.title = `${StringManager.GetFirstNameOnly(currentUser?.name)}'s Holiday Visitation`
                dateObject.startDate = moment(holiday?.value).format(DatetimeFormats.dateForDb)
                dateObject.holidayName = holiday?.label
                dateObject.owner = {
                    key: currentUser?.key,
                    name: currentUser?.name,
                }
                // Not Required
                dateObject.createdBy = currentUser?.name
                dateObject.fromVisitationSchedule = true
                dateObject.isHoliday = true
                dateObject.shareWith = DatasetManager.GetValidArray(shareWith, true)
                const cleanedObject = ObjectManager.CleanObject(dateObject)
                events.push(cleanedObject)
            })
            // Upload to DB
            await VisitationManager.setVisitationHolidays(currentUser, events)
        } else {
            await VisitationManager.DeleteAllHolidaysForUser(currentUser)
        }
        setState({...state, bannerMessage: "Visitation Holidays Updated!"})
    }

    const GetVisitationHolidays = async (currentUser) => {
        const _holidays = await VisitationManager.getVisitationHolidays()
        let userHolidays = []
        if (Manager.IsValid(calendarEvents)) {
            userHolidays = calendarEvents.filter((x) => x.ownerKey === currentUser?.key && x.fromVisitationSchedule === true && x.isHoliday === true)
        }
        return {
            holidays: _holidays.flat(),
            userHolidays: userHolidays,
        }
    }

    const SetAllStates = async () => {
        await GetCurrentVisitationSchedule().then((r) => r)
        await GetVisitationHolidays(currentUser).then((holidaysObject) => {
            const {holidays, userHolidays} = holidaysObject
            const userHolidaysList = DatasetManager.GetValidArray(CalendarMapper.eventsToHolidays(userHolidays))
            const userHolidaysDates = userHolidaysList.map((x) => x.date)
            setSelectedHolidayDates(DatasetManager.getUniqueArray(userHolidaysDates, true))
            setUserHolidays(userHolidaysList.map((x) => x.name))
        })

        setContentIsReady(true)
    }

    const GetCurrentVisitationSchedule = async () => {
        let scheduleEvents = await VisitationManager.getSchedule(currentUser)
        scheduleEvents = scheduleEvents.filter((x) => x.isHoliday === false)
        if (scheduleEvents.length > 0) {
            setExistingScheduleEvents(scheduleEvents)
            setShowDeleteButton(true)
        } else {
            setExistingScheduleEvents([])
        }
    }

    const SetDefaultDropdownOptions = async () => {
        const defaultHolidays = holidays.map((x) => ({label: x.holidayName, value: moment(x.startDate).format(DatetimeFormats.dateForDb)}))
        setDefaultHolidayOptions(defaultHolidays)
        const existingVisitationHolidays = await VisitationManager.getVisitationHolidays(currentUser)

        if (Manager.IsValid(existingVisitationHolidays)) {
            const mappedExistingHolidays = existingVisitationHolidays.map((x) => ({
                label: x.holidayName,
                value: moment(x.startDate).format(DatetimeFormats.dateForDb),
            }))
            setSelectedVisitationHolidayOptions(mappedExistingHolidays)
        }
    }

    const ResetCardState = () => {
        setShowFiftyFiftyCard(false)
        setShowEveryOtherWeekendCard(false)
        setShowCustomWeekendsCard(false)
    }

    useEffect(() => {
        if ((Manager.IsValid(children) || Manager.IsValid(users)) && Manager.IsValid(holidays)) {
            void SetDefaultDropdownOptions()
        }
    }, [children, coParents, users, holidays])

    // On Schedule Type Change
    useEffect(() => {
        switch (scheduleType?.value) {
            case ScheduleTypes.fiftyFifty:
                ResetCardState()
                setShowFiftyFiftyCard(true)
                break
            case ScheduleTypes.everyOtherWeekend:
                ResetCardState()
                setShowEveryOtherWeekendCard(true)
                break
            case ScheduleTypes.customWeekends:
                ResetCardState()
                setShowCustomWeekendsCard(true)
                break
            case ScheduleTypes.everyWeekend:
                ResetCardState()
                AlertManager.confirmAlert("Are you sure you would like to Add an Every Weekend visitation schedule?", "I'm Sure", true, async () => {
                    await AddEveryWeekendToCalendar()
                })
                break
            default:
                ResetCardState()
                break
        }
    }, [scheduleType])

    useEffect(() => {
        if (Manager.IsValid(currentUser) && Manager.IsValid(calendarEvents)) {
            SetAllStates().then((r) => r)
        }
    }, [currentUser, calendarEvents])

    return (
        <Screen activeScreen={ScreenNames.visitation} loadingByDefault={true} stopLoadingBool={contentIsReady}>
            {/* SCHEDULE CARDS */}
            <>
                <FiftyFifty
                    showCard={showFiftyFiftyCard}
                    hide={() => {
                        setShowFiftyFiftyCard(false)
                        setScheduleType("")
                    }}
                />
                <EveryOtherWeekend
                    showCard={showEveryOtherWeekendCard}
                    hide={() => {
                        setShowEveryOtherWeekendCard(false)
                        setScheduleType("")
                    }}
                />
                <CustomWeekends
                    showCard={showCustomWeekendsCard}
                    hide={() => {
                        setShowCustomWeekendsCard(false)
                        setScheduleType("")
                    }}
                />
            </>

            {/* PAGE CONTAINER */}
            <div id="visitation-container" className={`${theme} page-container`}>
                <ScreenHeader
                    title={"Visitation"}
                    titleIcon={<BsHousesFill />}
                    screenName={ScreenNames.visitation}
                    screenDescription="Oversee all aspects of visitation, including scheduling, holiday visits, schedule change requests and additional matters"
                />
                <Spacer height={10} />
                <div className="screen-content">
                    {/* ALREADY HAS EXISTING SCHEDULE */}
                    {existingScheduleEvents.length > 0 && (
                        <>
                            <p>
                                You currently have a 50/50 visitation schedule added to your calendar. If you would like to modify the current
                                schedule or switch to another schedule, please delete the current schedule first.
                            </p>

                            {showDeleteButton && (
                                <>
                                    <Spacer height={10} />
                                    <button
                                        className="button red default center"
                                        onClick={() => {
                                            AlertManager.confirmAlert(
                                                "Are you sure you would like to permanently Delete your current visitation schedule?",
                                                "I'm Sure",
                                                true,
                                                async () => {
                                                    await DeleteSchedule()
                                                },
                                                setScheduleType("")
                                            )
                                        }}>
                                        Delete Current Schedule
                                    </button>
                                </>
                            )}
                        </>
                    )}

                    {/* NO EXISTING SCHEDULE */}
                    {existingScheduleEvents.length === 0 && (
                        <div className="sections">
                            <Label classes={"always-show dark"} text={"Schedule"} />

                            <div
                                style={DomManager.AnimateDelayStyle(1, 0.2)}
                                className={`visitation-section ${DomManager.Animate.FadeInUp("d", ".visitation-section")}`}>
                                {/* VISITATION SCHEDULE */}
                                <p>
                                    When you establish a visitation schedule, it will be displayed on the calendar for you and anyone you permit to
                                    view it.
                                </p>
                                <Spacer height={5} />
                                <p>Choose a visitation schedule and agreed upon handoff location.</p>
                                <Spacer height={5} />

                                {/* SCHEDULE SELECTION */}
                                <div className="section visitation-schedule">
                                    <SelectDropdown
                                        wrapperClasses={"white-bg"}
                                        placeholder={"Select a Visitation Schedule"}
                                        options={[
                                            {label: "50/50", value: "fiftyFifty"},
                                            {label: "Custom Weekends", value: "customWeekends"},
                                            {label: "Every Other Weekend", value: "everyOtherWeekend"},
                                            {label: "Every Weekend", value: "everyWeekend"},
                                            {label: "Every other Weekend", value: "everyOtherWeekend"},
                                        ]}
                                        onSelect={(e) => setScheduleType(e)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <Spacer height={5} />
                    {/* DEFAULT TRANSFER LOCATION */}
                    <AddressInput
                        labelClasses={"always-show white-bg"}
                        defaultValue={currentUser?.visitation?.transferAddress}
                        wrapperClasses="address-input white-bg"
                        labelText="Preferred Handoff Location"
                        onChange={(address) => {
                            UpdateDefaultTransferLocation(address, Manager.GetDirectionsLink(address)).then(() =>
                                setTimeout(() => {
                                    setState({...state, bannerMessage: "Preferred Handoffs Location Set"})
                                }, 300)
                            )
                        }}
                    />

                    <hr className={"white-bg"} />

                    {/* VISITATION PROPOSALS */}
                    <VisitationRequests />

                    <hr className={"white-bg"} />

                    {/* HOLIDAY SELECTION */}
                    <SelectDropdown
                        wrapperClasses={"white-bg"}
                        options={defaultHolidayOptions}
                        value={selectedVisitationHolidayOptions}
                        onSelect={setSelectedVisitationHolidayOptions}
                        placeholder={"Select Your Visitation Holidays"}
                        selectMultiple={true}
                    />

                    <Spacer height={5} />

                    {showUpdateHolidaysButton && (
                        <Button classes={"center"} theme={ButtonThemes.green} text={"Update Holidays"} onClick={SetHolidaysInDatabase} />
                    )}
                </div>
            </div>
            {!showEveryOtherWeekendCard && !showCustomWeekendsCard && !showFiftyFiftyCard && <NavBar navbarClass={"visitation no-Add-new-button"} />}
        </Screen>
    )
}