// Path: src\components\screens\childInfo\behavior.jsx
import Accordion from "@mui/material/Accordion"
import AccordionDetails from "@mui/material/AccordionDetails"
import AccordionSummary from "@mui/material/AccordionSummary"
import React, {useContext, useEffect, useState} from "react"
import {CgClose} from "react-icons/cg"
import {FaBrain, FaMinus, FaPlus} from "react-icons/fa6"

import InputTypes from "../../../constants/inputTypes"
import globalState from "../../../context"
import DB from "../../../database/DB"
import DB_UserScoped from "../../../database/db_userScoped"
import useCurrentUser from "../../../hooks/useCurrentUser"
import useSharedChildInfo from "../../../hooks/useSharedChildInfo"
import AlertManager from "../../../managers/alertManager"
import Manager from "../../../managers/manager"
import StringManager from "../../../managers/stringManager"
import InputField from "../../shared/inputField"
import Spacer from "../../shared/spacer"

export default function Behavior({activeChild}) {
      const {state, setState} = useContext(globalState)
      const {theme, refreshKey} = state
      const [behaviorValues, setBehaviorValues] = useState([])
      const [showInputs, setShowInputs] = useState(false)
      const {currentUser, currentUserIsLoading} = useCurrentUser()
      const {sharedChildInfo} = useSharedChildInfo()

      const DeleteProp = async (prop) => {
            const existingPropCount = Object.keys(activeChild?.behavior).length

            if (existingPropCount <= 1) {
                  const accordion = document.querySelector(".behavior.info-section")
                  if (accordion) {
                        accordion.querySelector(".MuiCollapse-root").remove()
                  }
                  setShowInputs(false)
            }

            // Delete Shared
            const sharedProps = sharedChildInfo?.map((x) => x?.prop)
            if (Manager.IsValid(sharedProps) && sharedProps.includes(prop.toLowerCase())) {
                  const scopedSharingObject = await DB.find(sharedChildInfo, ["prop", prop.toLowerCase()], false)
                  await DB_UserScoped.deleteSharedChildInfoProp(
                        currentUser,
                        sharedChildInfo,
                        prop.toLowerCase(),
                        scopedSharingObject?.sharedByOwnerKey
                  )
                  await SetSelectedChild()
            }

            // Delete NOT shared
            else {
                  const childIndex = DB.GetChildIndex(currentUser?.children, activeChild?.id)

                  if (Manager.IsValid(childIndex)) {
                        await DB_UserScoped.DeleteChildInfoProp(currentUser?.key, childIndex, "behavior", StringManager.formatDbProp(prop))
                        await SetSelectedChild()
                  }
            }
      }

      const Update = async (prop, value) => {
            await DB_UserScoped.UpdateChildInfo(currentUser, activeChild, "behavior", StringManager.formatDbProp(prop), value)
            AlertManager.successAlert("Updated!")
      }

      const SetSelectedChild = async () => {
            let sharedValues = []
            for (let obj of sharedChildInfo) {
                  sharedValues.push([obj.prop, obj.value, obj.sharedByName])
            }
            if (Manager.IsValid(activeChild.behavior)) {
                  // Set info
                  let values = Object.entries(activeChild.behavior)

                  if (Manager.IsValid(sharedValues)) {
                        values = [...values, ...sharedValues]
                  }
                  const valuesArr = values.filter((x) => x[1].length === 0).map((x) => x[1])
                  if (values.length === valuesArr.length) {
                        setBehaviorValues([])
                  } else {
                        setBehaviorValues(values)
                  }
            } else {
                  if (sharedValues.length > 0) {
                        setBehaviorValues(sharedValues)
                  } else {
                        setBehaviorValues([])
                  }
            }
      }

      useEffect(() => {
            SetSelectedChild().then((r) => r)
      }, [activeChild, sharedChildInfo])

      return (
            <div className="info-section section behavior" key={refreshKey}>
                  <Accordion className={`${theme} child-info`} disabled={!Manager.IsValid(behaviorValues)}>
                        <AccordionSummary
                              onClick={() => setShowInputs(!showInputs)}
                              className={!Manager.IsValid(activeChild.behavior) ? "disabled header behavior" : "header behavior"}>
                              <FaBrain className={"svg behavior"} />
                              <p id="toggle-button" className={showInputs ? "active" : ""}>
                                    Behavior {!Manager.IsValid(behaviorValues) ? "- no info" : ""}
                                    {Manager.IsValid(behaviorValues) && (
                                          <>{showInputs ? <FaMinus className="plus-minus" /> : <FaPlus className="plus-minus" />}</>
                                    )}
                              </p>
                        </AccordionSummary>
                        <AccordionDetails>
                              <div className="padding">
                                    {behaviorValues &&
                                          behaviorValues.map((prop, index) => {
                                                let infoLabel = StringManager.SpaceBetweenWords(prop[0])
                                                infoLabel = StringManager.UppercaseFirstLetterOfAllWords(infoLabel).replaceAll("OF", " of ")
                                                const value = prop[1]
                                                return (
                                                      <div key={index}>
                                                            <div className="data-row">
                                                                  {infoLabel.toLowerCase().includes("phone") && (
                                                                        <>
                                                                              <div className="flex input">
                                                                                    <a href={`tel:${StringManager.FormatPhone(value).toString()}`}>
                                                                                          {infoLabel}: {value}
                                                                                    </a>
                                                                              </div>
                                                                              <Spacer height={5} />
                                                                              <CgClose
                                                                                    className={"close-x children"}
                                                                                    onClick={() => DeleteProp(infoLabel)}
                                                                              />
                                                                        </>
                                                                  )}
                                                                  {!infoLabel.toLowerCase().includes("phone") && (
                                                                        <>
                                                                              <InputField
                                                                                    wrapperClasses={`${index === behaviorValues.length - 2 ? "last" : ""}`}
                                                                                    hasBottomSpacer={false}
                                                                                    customDebounceDelay={1200}
                                                                                    inputType={InputTypes.text}
                                                                                    defaultValue={value}
                                                                                    placeholder={`${infoLabel} ${Manager.IsValid(prop[2]) ? `(shared by ${StringManager.GetFirstNameOnly(prop[2])})` : ""}`}
                                                                                    onChange={async (e) => {
                                                                                          const inputValue = e.target.value
                                                                                          await Update(infoLabel, `${inputValue}`)
                                                                                    }}
                                                                              />
                                                                              <CgClose
                                                                                    className={"close-x children"}
                                                                                    onClick={() => DeleteProp(infoLabel)}
                                                                              />
                                                                        </>
                                                                  )}
                                                            </div>
                                                            <Spacer height={3} />
                                                      </div>
                                                )
                                          })}
                              </div>
                        </AccordionDetails>
                  </Accordion>
            </div>
      )
}