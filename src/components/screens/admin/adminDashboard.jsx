import FormControl from "@mui/material/FormControl"
import MenuItem from "@mui/material/MenuItem"
import Select from "@mui/material/Select"
import moment from "moment"
import React, {useContext, useEffect, useState} from "react"
import JSONPretty from "react-json-pretty"
import JSONPrettyMon from "react-json-pretty/dist/monikai"
import {useLongPress} from "use-long-press"
import ButtonThemes from "../../../constants/buttonThemes"
import DatetimeFormats from "../../../constants/datetimeFormats"
import InputTypes from "../../../constants/inputTypes"
import ScreenNames from "../../../constants/screenNames"
import globalState from "../../../context"
import DB from "../../../database/DB"
import useAppUpdates from "../../../hooks/useAppUpdates"
import useCalendarEvents from "../../../hooks/useCalendarEvents"
import useCurrentUser from "../../../hooks/useCurrentUser"
import useUsers from "../../../hooks/useUsers"
import AppManager from "../../../managers/appManager"
import DateManager from "../../../managers/dateManager"
import Manager from "../../../managers/manager"
import SmsManager from "../../../managers/smsManager"
import StringManager from "../../../managers/stringManager"
import AppUpdate from "../../../models/appUpdate"
import Changelog from "../../../models/changelog"
import NavBar from "../../navBar"
import Button from "../../shared/button"
import InputField from "../../shared/inputField"
import Screen from "../../shared/screen"
import ScreenHeader from "../../shared/screenHeader"
import Spacer from "../../shared/spacer"

export default function AdminDashboard() {
      const {state, setState} = useContext(globalState)

      // STATE
      const [chatRecoveryRequestEmail, setChatRecoveryRequestEmail] = useState("")
      const [chatRequests, setChatRequests] = useState([])
      const [getUserEmail, setGetUserEmail] = useState("")
      const [userToDisplayPhone, setUserToDisplayPhone] = useState(null)
      const [getRecordsTable, setGetRecordsTable] = useState("")
      const [getRecordsSearchValue, setGetRecordsSearchValue] = useState("")
      const [tableName, setTableName] = useState(DB.tables.calendarEvents)
      const [dbTables, setDbTables] = useState(Object.values(DB.tables).sort())
      const [textBalance, setTextBalance] = useState(0)
      const [recordPropToCheck, setRecordPropToCheck] = useState("User Email")
      const [recordsAsJson, setRecordsAsJson] = useState(false)
      const [applicationVersion, setApplicationVersion] = useState(0)
      const [negativeAppEmotions, setNegativeAppEmotions] = useState({})
      const [finalCmsOutput, setFinalCmsOutput] = useState("")
      const [roughDraftCmsOutput, setRoughDraftCmsOutput] = useState("")

      // HOOKS
      const {currentUser} = useCurrentUser()
      const {users} = useUsers()
      const {calendarEvents} = useCalendarEvents()
      const {appUpdates} = useAppUpdates()

      const bind = useLongPress((element) => {
            navigator.clipboard.writeText(element.currentTarget.textContent)
            setState({...state, successAlertMessage: "Copied to clipboard"})
      })

      const DeletedExpiredCalEvents = async () => void AppManager.DeleteExpiredCalendarEvents()

      const DeleteExpiredMemories = async () => void AppManager.DeleteExpiredMemories()

      const SetHolidays = async () => {
            void DateManager.SetHolidays()
            setState({...state, successAlertMessage: "Holidays set"})
      }

      const AppendGetRecordsCode = async () => {
            if (tableName === "calendarEvents") {
                  const scoped = calendarEvents.filter((x) => x.title.toLowerCase().includes(getRecordsSearchValue.toLowerCase()))
                  setRecordsAsJson(scoped)
            } else {
                  let scoped = users.find((x) => x.email.toLowerCase().includes(getRecordsSearchValue.toLowerCase()))
                  setRecordsAsJson(scoped)
            }
      }

      const GetTextBeltCount = async () => {
            const balance = await SmsManager.GetRemainingBalance()
            console.log(balance)
            setState({...state, successAlertMessage: balance})
      }

      const CopyToClipboard = () => {
            navigator.clipboard.writeText(JSON.stringify(recordsAsJson))
            setState({...state, successAlertMessage: "Copied to clipboard"})
      }

      const GetNegativeAppEmotions = async () => {
            const emotions = await DB.GetTableData(`${DB.tables.feedbackEmotionsTracker}`)
            const unhappy = emotions.filter((x) => x.unhappy > 0)
            const unhappyCount = unhappy.reduce((total, current) => total + current.unhappy, 0)
            const neutralCount = unhappy.reduce((total, current) => total + current.neutral, 0)
            const obj = {
                  unhappy: unhappyCount,
                  neutral: neutralCount,
            }
            setNegativeAppEmotions(obj)
      }

      const UpdateAppVersion = async () => {
            if (Manager.IsValid(appUpdates)) {
                  let latestVersion = appUpdates[appUpdates?.length - 1]?.currentVersion
                  const newVersion = StringManager.IncrementPatchVersion(latestVersion)
                  await DB.Add(
                        `${DB.tables.appUpdates}`,
                        appUpdates,
                        new AppUpdate({currentVersion: newVersion, timestamp: moment().format(DatetimeFormats.dateForDb)})
                  )
                  setState({...state, successAlertMessage: `Updated to Version ${newVersion}`})
            } else {
                  await DB.Add(
                        `${DB.tables.appUpdates}`,
                        appUpdates,
                        new AppUpdate({currentVersion: 1, timestamp: moment().format(DatetimeFormats.dateForDb)})
                  )
            }
      }

      const PreviewChangelog = async () => {
            const changelogInput = document.querySelector(".changelog-input")
            const changelogPreview = document.getElementById("changelog-preview")
            changelogPreview.innerHTML = changelogInput.value
      }

      const PushChangelogUpdate = async () => {
            const changelogInput = document.querySelector(".changelog-input")
            const changelogPreview = document.getElementById("changelog-preview")
            const changelogs = await DB.GetTableData(`${DB.tables.changelogs}`)
            const newVersion = StringManager.IncrementPatchVersion(await AppManager.GetCurrentAppVersion())
            const newChangelog = new Changelog({
                  updatedVersion: newVersion,
                  html: changelogPreview?.innerHTML.trim(),
            })
            changelogInput.value = ""

            await DB.Add(`${DB.tables.changelogs}`, changelogs || [], newChangelog)
            await UpdateAppVersion()
      }

      useEffect(() => {
            if (tableName === "users") {
                  setRecordPropToCheck("User's Email Address")
            }
      }, [recordPropToCheck])

      useEffect(() => {
            GetNegativeAppEmotions().then((r) => r)
            SmsManager.GetRemainingBalance().then((balance) => {
                  setTextBalance(balance)
            })
      }, [])

      useEffect(() => {
            if (Manager.IsValid(appUpdates)) {
                  const latestVersion = appUpdates[appUpdates.length - 1]
                  setApplicationVersion(latestVersion.currentVersion)
            }
      }, [appUpdates])

      return (
            <Screen activeScreen={ScreenNames.adminDashboard} classes={"dashboard"}>
                  <ScreenHeader title={"Admin Dashboard"} />
                  {/* TOOLBOXES */}
                  <div className="screen-content">
                        {/* UPDATE */}
                        <div className="tool-box">
                              <p className="box-title">App Updates</p>
                              <p className="center-text">Current Version: {applicationVersion}</p>
                              <div className="buttons">
                                    <Button theme={ButtonThemes.green} text="Update Version" className="button" onClick={UpdateAppVersion} />
                              </div>
                        </div>

                        {/* CHANGELOG CMS */}
                        <div className="tool-box">
                              <p className="box-title">Changelog CMS</p>
                              <div id={"changelog-preview"}></div>
                              <Spacer height={5} />
                              <Button
                                    text={"Clear Preview"}
                                    className="button centered center block"
                                    theme={ButtonThemes.green}
                                    onClick={() => {
                                          const changelogPreview = document.getElementById("changelog-preview")
                                          changelogPreview.innerHTML = ""
                                          setRoughDraftCmsOutput("")
                                    }}
                              />
                              <hr />
                              <InputField
                                    onChange={(textElement) => setRoughDraftCmsOutput((prev) => prev + textElement.target.value)}
                                    placeholder={"New Features, Improvements, Fixes"}
                                    wrapperClasses={"white-bg with-icon"}
                                    inputType={InputTypes.textarea}
                                    inputClasses={"with-icon changelog-input"}
                              />
                              <Spacer height={5} />
                              <Button
                                    text={"Clear Input"}
                                    className="button"
                                    theme={ButtonThemes.green}
                                    onClick={() => {
                                          const changelogInput = document.querySelector(".changelog-input")
                                          changelogInput.value = ""
                                    }}
                              />

                              <hr />

                              <div className="buttons">
                                    <Button theme={ButtonThemes.green} text="Preview" className="button" onClick={PreviewChangelog} />
                              </div>
                              <div className="buttons">
                                    <Button theme={ButtonThemes.green} text="Push" className="button" onClick={PushChangelogUpdate} />
                              </div>
                        </div>

                        {/* TEST SUCCESS ALERT */}
                        <div className="tool-box">
                              <p className="box-title">Test Success Alert</p>
                              <div className="buttons">
                                    <Button
                                          theme={ButtonThemes.green}
                                          text="Click Me"
                                          className="button"
                                          onClick={() => {
                                                setState({...state, successAlertMessage: "Success Alert"})
                                          }}
                                    />
                              </div>
                        </div>

                        {/* GET EMOTIONS COUNT */}
                        <div className="tool-box">
                              <p className="box-title">Get App Emotions</p>
                              {Manager.IsValid(negativeAppEmotions) && (
                                    <p className={"center-text"}>
                                          Neutral: {negativeAppEmotions?.neutral} Unhappy: {negativeAppEmotions?.unhappy}
                                    </p>
                              )}
                        </div>

                        {/* TEXTBELT */}
                        <div className="tool-box">
                              <p className="box-title">TextBelt</p>
                              <p className="center block  center-text">Balance: {textBalance}</p>
                        </div>

                        {/* DELETE EXPIRED STUFF */}
                        <div className="tool-box">
                              <p className="box-title">Delete Expired</p>
                              <div className="buttons flex gap-10">
                                    <Button theme={ButtonThemes.red} text="Memories" className="button" onClick={DeleteExpiredMemories} />
                                    <Button theme={ButtonThemes.red} text="Events" className="button" onClick={DeletedExpiredCalEvents} />
                              </div>
                        </div>

                        {/* HOLIDAYS */}
                        <div className="tool-box">
                              <p className="box-title">Set Holidays</p>
                              <div className="buttons flex">
                                    <Button theme={ButtonThemes.green} text="Add to Calendar" className="button" onClick={SetHolidays} />
                                    <Button
                                          theme={ButtonThemes.red}
                                          className="button"
                                          text="Delete All"
                                          onClick={() => DateManager.deleteAllHolidays()}
                                    />
                              </div>
                        </div>

                        {/* Get Database Record */}
                        <div className="tool-box get-records">
                              <p className="box-title">Get Records</p>
                              <FormControl fullWidth className={"mt-10 mb-15"}>
                                    <Select
                                          value={tableName}
                                          onChange={(e) => {
                                                setGetRecordsTable(e.target.value)
                                                setTableName(e.target.value)
                                          }}>
                                          {dbTables.map((table, index) => {
                                                return (
                                                      <MenuItem key={index} value={table}>
                                                            {StringManager.UppercaseFirstLetterOfAllWords(table)}
                                                      </MenuItem>
                                                )
                                          })}
                                    </Select>
                              </FormControl>
                              <InputField
                                    placeholder={`Enter ${recordPropToCheck} or Event Name for Calendar Events`}
                                    inputType={InputTypes.text}
                                    onChange={(e) => setGetRecordsSearchValue(e.target.value)}
                              />
                              <p className="mb-10 center-text">-or-</p>
                              <InputField
                                    placeholder={`Enter Record ID`}
                                    inputType={InputTypes.text}
                                    onChange={(e) => setGetRecordsSearchValue(e.target.value)}
                              />
                              <div className="buttons flex">
                                    <Button className="button" onClick={CopyToClipboard} />
                                    Copy
                                    <Button className="button" onClick={AppendGetRecordsCode} />
                                    Execute
                                    <Button
                                          theme={ButtonThemes.red}
                                          text="Clear"
                                          className="button"
                                          onClick={() => {
                                                document.getElementById("code-block").innerHTML = ""
                                                setRecordsAsJson({})
                                          }}
                                    />
                                    Clear
                              </div>
                              {/* CODE BLOCK */}
                              <JSONPretty theme={JSONPrettyMon} id="code-block" {...bind()} data={recordsAsJson}></JSONPretty>
                        </div>
                  </div>
                  <NavBar navbarClass={"visitation no-Add-new-button"} />
            </Screen>
      )
}