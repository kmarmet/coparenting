// Path: src\components\screens\settings\settings.jsx
import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import ButtonThemes from '../../../constants/buttonThemes'
import DatetimeFormats from '../../../constants/datetimeFormats'
import InputTypes from '../../../constants/inputTypes'
import ScreenNames from '../../../constants/screenNames'
import globalState from '../../../context'
import DB from '../../../database/DB'
import DB_UserScoped from '../../../database/db_userScoped'
import useCurrentUser from '../../../hooks/useCurrentUser'
import DateManager from '../../../managers/dateManager'
import DomManager from '../../../managers/domManager'
import UpdateManager from '../../../managers/updateManager.js'
import NavBar from '../../navBar'
import Button from '../../shared/button'
import InputField from '../../shared/inputField'
import Label from '../../shared/label'
import Screen from '../../shared/screen'
import ScreenHeader from '../../shared/screenHeader'
import SelectDropdown from '../../shared/selectDropdown'
import Spacer from '../../shared/spacer'
import ToggleButton from '../../shared/toggleButton'

export default function Settings() {
    const {state, setState} = useContext(globalState)
    const {theme} = state

    // HOOKS
    const {currentUser, currentUserIsLoading} = useCurrentUser()

    // STATE
    const [morningSummaryHour, setMorningSummaryHour] = useState(currentUser?.dailySummaries?.morningReminderSummaryHour)
    const [eveningSummaryHour, setEveningSummaryHour] = useState(currentUser?.dailySummaries?.eveningReminderSummaryHour)
    const [notificationsToggled, setNotificationsToggled] = useState(false)
    const [showSummaryUpdateButton, setShowSummaryUpdateButton] = useState(false)

    const SubmitCalendarSettings = async () => {
        if (DateManager.DateIsValid(morningSummaryHour)) {
            await DB.updateByPath(
                `${DB.tables.users}/${currentUser?.key}/dailySummaries/morningReminderSummaryHour`,
                moment(morningSummaryHour).format(DatetimeFormats.summaryHour)
            )
        }
        if (DateManager.DateIsValid(eveningSummaryHour)) {
            await DB.updateByPath(
                `${DB.tables.users}/${currentUser?.key}/dailySummaries/eveningReminderSummaryHour`,
                moment(eveningSummaryHour).format(DatetimeFormats.summaryHour)
            )
        }
        setState({...state, successAlertMessage: 'Summary Times Updated'})
    }

    const ToggleNotifications = async () => {
        setNotificationsToggled(!notificationsToggled)
        const subscriber = await DB.find(DB.tables.updateSubscribers, ['key', currentUser.key], true)
        const {subscriptionId} = subscriber
        await DB.updateByPath(`${DB.tables.users}/${currentUser?.key}/settings/notificationsEnabled`, !currentUser?.settings?.notificationsEnabled)
        if (notificationsToggled === true) {
            await UpdateManager.enableNotifications(subscriptionId)
        } else {
            await UpdateManager.disableNotifications(subscriptionId)
        }
    }

    const ChangeTheme = async (theme) => {
        await DB_UserScoped.updateUserRecord(currentUser?.key, `settings/theme`, theme.toLowerCase())
        window.location.reload()
    }

    useEffect(() => {
        DomManager.Animate.RemoveAnimationClasses('.section', 'animate__fadeInUp')
        if (
            morningSummaryHour !== currentUser?.dailySummaries?.morningReminderSummaryHour ||
            eveningSummaryHour !== currentUser?.dailySummaries?.eveningReminderSummaryHour
        ) {
            setShowSummaryUpdateButton(true)
        } else {
            setShowSummaryUpdateButton(false)
        }
    }, [morningSummaryHour, eveningSummaryHour])

    return (
        <Screen activeScreen={ScreenNames.settings} loadingByDefault={true} stopLoadingBool={!currentUserIsLoading}>
            <div id="settings-container" className={`${currentUser?.settings?.theme} page-container `}>
                <ScreenHeader title={'Settings'} />
                <Spacer height={10} />
                <div className="screen-content">
                    {/* CALENDAR SETTINGS */}
                    <Label text={'Calendar'} classes="settings-section-title" />
                    <div
                        style={DomManager.AnimateDelayStyle(1)}
                        className={`section summary ${DomManager.Animate.FadeInUp(currentUser?.dailySummaries, '.section')}`}>
                        <p className="screen-intro-text">
                            The summaries for the current and following day will be provided during the morning and evening summary hours.
                        </p>

                        <Spacer height={8} />

                        <Label text={'Morning Summary Time'} classes={`settings-section-title always-show ${theme}`} />

                        {/* MORNING SUMMARY */}
                        <InputField
                            wrapperClasses={'white'}
                            placeholder={'Morning Hour'}
                            defaultValue={moment(morningSummaryHour, 'h:mma')}
                            timeViews={['hours']}
                            inputType={InputTypes.time}
                            onDateOrTimeSelection={(e) => setMorningSummaryHour(e)}
                        />

                        <Spacer height={3} />

                        {/* EVENING SUMMARY */}
                        <Label text={'Evening Summary Time'} classes={`settings-section-title always-show ${theme}`} />
                        <InputField
                            wrapperClasses={'white'}
                            defaultValue={moment(eveningSummaryHour, 'h:mma')}
                            placeholder={'Evening Hour'}
                            timeViews={['hours']}
                            inputType={InputTypes.time}
                            onDateOrTimeSelection={(e) => setEveningSummaryHour(e)}
                        />
                    </div>

                    <Spacer height={10} />

                    {currentUser && showSummaryUpdateButton && (
                        <Button text={'Update Summary Times'} classes={'center block'} onClick={SubmitCalendarSettings} theme={ButtonThemes.green} />
                    )}

                    <Spacer height={10} />

                    {/*  NOTIFICATIONS */}
                    <Label text={'Notifications'} classes={`settings-section-title always-show ${theme}`} />
                    <div
                        style={DomManager.AnimateDelayStyle(1)}
                        className={`section ${DomManager.Animate.FadeInUp(currentUser?.settings, '.section')}`}>
                        <div className="flex">
                            <Label text={'Enabled'} classes={`settings-section-title always-show ${theme}`} />
                            <ToggleButton
                                isDefaultChecked={currentUser?.settings?.notificationsEnabled}
                                onCheck={ToggleNotifications}
                                onUncheck={ToggleNotifications}
                            />
                        </div>
                    </div>

                    <Spacer height={10} />

                    {/* THEME */}
                    <div
                        style={DomManager.AnimateDelayStyle(1)}
                        className={`section ${DomManager.Animate.FadeInUp(currentUser?.settings?.theme, '.section')}`}>
                        <SelectDropdown
                            placeholder={`Change Theme`}
                            wrapperClasses={'white-bg'}
                            options={[
                                {label: 'Light', value: 'light'},
                                {label: 'Dark', value: 'dark'},
                                {label: 'Gradient', value: 'gradient'},
                            ]}
                            onSelect={async (theme) => {
                                await ChangeTheme(theme.label)
                            }}
                            defaultValue={[{label: currentUser?.settings?.theme, value: currentUser?.settings?.theme}]}
                        />
                    </div>
                </div>
            </div>
            <NavBar navbarClass={'settings no-Add-new-button'}></NavBar>
        </Screen>
    )
}