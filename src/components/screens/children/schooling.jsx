// Path: src\components\screens\childInfo\schooling.jsx
import Accordion from "@mui/material/Accordion"
import AccordionDetails from "@mui/material/AccordionDetails"
import AccordionSummary from "@mui/material/AccordionSummary"
import React, {useContext, useEffect, useState} from "react"
import {CgClose} from "react-icons/cg"
import {FaMinus, FaPlus} from "react-icons/fa6"
import {IoSchool} from "react-icons/io5"
import InputTypes from "../../../constants/inputTypes"
import globalState from "../../../context"
import DB from "../../../database/DB"
import DB_UserScoped from "../../../database/db_userScoped"
import useCurrentUser from "../../../hooks/useCurrentUser"
import AlertManager from "../../../managers/alertManager"
import Manager from "../../../managers/manager"
import StringManager from "../../../managers/stringManager"
import InputField from "../../shared/inputField"
import Spacer from "../../shared/spacer"

export default function Schooling({activeChild}) {
      const {state, setState} = useContext(globalState)
      const {theme} = state
      const [schoolingValues, setSchoolingValues] = useState([])
      const [showInputs, setShowInputs] = useState(false)
      const {currentUser} = useCurrentUser()

      const DeleteProp = async (prop) => {
            const sharing = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser?.key}`)

            const existingPropCount = Object.keys(activeChild?.schooling).length

            if (existingPropCount <= 1) {
                  const accordion = document.querySelector(".schooling.info-section")
                  if (accordion) {
                        accordion.querySelector(".MuiCollapse-root").remove()
                  }
                  setShowInputs(false)
            }

            // Delete Shared
            const sharedProps = sharing?.map((x) => x?.prop)
            if (Manager.IsValid(sharedProps) && sharedProps.includes(prop.toLowerCase())) {
                  const scopedSharingObject = await DB.find(sharing, ["prop", prop.toLowerCase()], false)
                  await DB_UserScoped.deleteSharedChildInfoProp(currentUser, sharing, prop.toLowerCase(), scopedSharingObject?.sharedByOwnerKey)
                  await SetSelectedChild()
            } else {
                  const childIndex = DB.GetChildIndex(currentUser?.children, activeChild?.id)
                  await DB_UserScoped.DeleteChildInfoProp(currentUser?.key, childIndex, "schooling", StringManager.formatDbProp(prop))
                  await SetSelectedChild()
            }
      }

      const Update = async (prop, value) => {
            await DB_UserScoped.UpdateChildInfo(currentUser, activeChild, "schooling", StringManager.formatDbProp(prop), value)
            AlertManager.successAlert("Updated!")
      }

      const SetSelectedChild = async () => {
            const sharing = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser?.key}`)
            let sharedValues = []
            if (Manager.IsValid(sharing)) {
                  for (let obj of sharing) {
                        sharedValues.push([obj.prop, obj.value, obj.sharedByName])
                  }
            }

            if (Manager.IsValid(activeChild?.schooling)) {
                  // Set info
                  let values = Object.entries(activeChild?.schooling)

                  if (Manager.IsValid(sharedValues)) {
                        values = [...values, ...sharedValues]
                  }

                  const valuesArr = values.filter((x) => x[1].length === 0).map((x) => x[1])
                  if (values.length === valuesArr.length) {
                        setSchoolingValues([])
                  } else {
                        setSchoolingValues(values)
                  }
            } else {
                  if (Manager.IsValid(sharedValues)) {
                        setSchoolingValues(sharedValues)
                  } else {
                        setSchoolingValues([])
                  }
            }
      }

      useEffect(() => {
            SetSelectedChild().then((x) => x)
      }, [activeChild])

      return (
            <div className="info-section section schooling">
                  <Accordion className={`${theme} child-info`} disabled={!Manager.IsValid(schoolingValues)}>
                        <AccordionSummary
                              onClick={() => setShowInputs(!showInputs)}
                              className={!Manager.IsValid(schoolingValues) ? "disabled header schooling" : "header schooling"}>
                              <IoSchool className={"svg schooling"} />
                              <p id="toggle-button" className={`${showInputs ? "active " : ""}`}>
                                    Schooling
                                    {!Manager.IsValid(schoolingValues) ? "- no info" : ""}
                                    {Manager.IsValid(schoolingValues) && (
                                          <>{showInputs ? <FaMinus className="plus-minus" /> : <FaPlus className="plus-minus" />}</>
                                    )}
                              </p>
                        </AccordionSummary>
                        <AccordionDetails>
                              <div className={`${Manager.IsValid(schoolingValues) ? "padding" : "hidden"}`}>
                                    {Manager.IsValid(schoolingValues) &&
                                          schoolingValues.map((prop, index) => {
                                                const rawLabel = prop[0]
                                                const infoLabel = StringManager.SpaceBetweenWords(rawLabel)
                                                const lowerLabel = infoLabel.toLowerCase()
                                                const isLast = index === schoolingValues.length - 1
                                                const isPhone = lowerLabel.includes("phone")
                                                const sharedBy = Manager.IsValid(prop[2])
                                                      ? ` (shared by ${StringManager.GetFirstNameOnly(prop[2])})`
                                                      : ""
                                                const rowClass = `data-row ${isPhone ? "phone" : ""} ${isLast ? "last" : ""}`
                                                const value = prop[1]
                                                return (
                                                      <div key={index} className={rowClass}>
                                                            <InputField
                                                                  wrapperClasses={`${index === schoolingValues.length - 2 ? "last" : ""}`}
                                                                  hasBottomSpacer={false}
                                                                  customDebounceDelay={1200}
                                                                  inputType={InputTypes.text}
                                                                  defaultValue={value}
                                                                  placeholder={`${infoLabel} ${Manager.IsValid(prop[2]) ? sharedBy : ""}`}
                                                                  onChange={async (e) => {
                                                                        const inputValue = e.target.value
                                                                        await Update(infoLabel, `${inputValue}`)
                                                                  }}>
                                                                  {" "}
                                                                  <CgClose className={"close-x children"} onClick={() => DeleteProp(infoLabel)} />
                                                            </InputField>
                                                            {index !== schoolingValues.length - 1 && <Spacer height={5} />}
                                                      </div>
                                                )
                                          })}
                              </div>
                        </AccordionDetails>
                  </Accordion>
            </div>
      )
}