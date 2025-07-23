// Path: src\components\screens\childInfo\medical.jsx
import Accordion from "@mui/material/Accordion"
import AccordionDetails from "@mui/material/AccordionDetails"
import AccordionSummary from "@mui/material/AccordionSummary"
import React, {useContext, useEffect, useState} from "react"
import {CgClose} from "react-icons/cg"
import {FaBriefcaseMedical} from "react-icons/fa"
import {FaMinus, FaPlus} from "react-icons/fa6"
import InputTypes from "../../../constants/inputTypes"
import globalState from "../../../context"
import DB from "../../../database/DB"
import DB_UserScoped from "../../../database/db_userScoped"
import useChildren from "../../../hooks/useChildren"
import useCurrentUser from "../../../hooks/useCurrentUser"
import Manager from "../../../managers/manager"
import StringManager from "../../../managers/stringManager"
import InputField from "../../shared/inputField"
import Spacer from "../../shared/spacer"

export default function Medical({activeChild}) {
      const {state, setState} = useContext(globalState)
      const {theme} = state
      const [medicalValues, setMedicalValues] = useState([])
      const [showInputs, setShowInputs] = useState(false)
      const {currentUser, currentUserIsLoading} = useCurrentUser()
      const {children} = useChildren()

      const DeleteProp = async (prop) => {
            const sharedInfoRecords = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser?.key}`)
            const existingPropCount = Object.keys(activeChild?.medical).length

            if (existingPropCount <= 1) {
                  const accordion = document.querySelector(".medical.info-section")
                  if (accordion) {
                        accordion.querySelector(".MuiCollapse-root").remove()
                  }
                  setShowInputs(false)
            }

            // Delete Shared
            const sharedProps = sharedInfoRecords?.map((x) => x?.prop)
            let formattedProp = StringManager.toCamelCase(prop.toLowerCase())

            if (Manager.IsValid(sharedProps) && sharedProps.includes(formattedProp)) {
                  const scopedSharingObject = await DB.find(sharedInfoRecords, ["prop", formattedProp], false)
                  await DB_UserScoped.deleteSharedChildInfoProp(
                        currentUser,
                        scopedSharingObject,
                        formattedProp,
                        scopedSharingObject?.sharedByOwnerKey
                  )
                  await SetChildData()
            }

            // Delete NOT shared
            else {
                  const childIndex = DB.GetChildIndex(children, activeChild?.id)
                  await DB_UserScoped.DeleteChildInfoProp(currentUser?.key, childIndex, "medical", StringManager.formatDbProp(prop))
                  await SetChildData()
            }
      }

      const Update = async (prop, value) => {
            await DB_UserScoped.UpdateChildInfo(currentUser, activeChild, "medical", StringManager.formatDbProp(prop), value)
      }

      const SetChildData = async () => {
            const sharing = await DB.getTable(`${DB.tables.sharedChildInfo}/${currentUser?.key}`)
            let sharedValues = []
            for (let obj of sharing) {
                  sharedValues.push([obj.prop, obj.value, obj.sharedByName])
            }
            if (Manager.IsValid(activeChild?.medical)) {
                  // Set info
                  let values = Object.entries(activeChild?.medical)

                  if (Manager.IsValid(sharedValues)) {
                        values = [...values, ...sharedValues]
                  }

                  const valuesArr = values.filter((x) => x[1].length === 0).map((x) => x[1])
                  if (values.length === valuesArr.length) {
                        setMedicalValues([])
                  } else {
                        setMedicalValues(values)
                  }
            } else {
                  if (sharedValues.length > 0) {
                        setMedicalValues(sharedValues)
                  } else {
                        setMedicalValues([])
                  }
            }
      }

      useEffect(() => {
            if (showInputs) {
                  SetChildData().then((r) => r)
            }
      }, [showInputs])

      useEffect(() => {
            SetChildData().then((r) => r)
      }, [activeChild])

      return (
            <div className="info-section section medical">
                  <Accordion className={`${theme} child-info`} disabled={!Manager.IsValid(medicalValues)}>
                        <AccordionSummary
                              onClick={() => setShowInputs(!showInputs)}
                              className={!Manager.IsValid(medicalValues) ? "disabled header medical" : "header medical"}>
                              <FaBriefcaseMedical className={"svg medical"} />
                              <p id="toggle-button" className={showInputs ? "active" : ""}>
                                    Medical
                                    {!Manager.IsValid(medicalValues) ? "- no info" : ""}
                                    {Manager.IsValid(medicalValues) && (
                                          <>{showInputs ? <FaMinus className="plus-minus" /> : <FaPlus className="plus-minus" />}</>
                                    )}
                              </p>
                        </AccordionSummary>
                        <AccordionDetails>
                              <div className="padding">
                                    {Manager.IsValid(medicalValues) &&
                                          medicalValues.map((prop, index) => {
                                                const rawLabel = prop[0]
                                                const infoLabel = StringManager.SpaceBetweenWords(rawLabel)
                                                const lowerLabel = infoLabel.toLowerCase()
                                                const isLast = index === medicalValues.length - 1
                                                const isPhone = lowerLabel.includes("phone")
                                                const sharedBy = Manager.IsValid(prop[2])
                                                      ? ` (shared by ${StringManager.GetFirstNameOnly(prop[2])})`
                                                      : ""
                                                const rowClass = `data-row ${isPhone ? "phone" : ""} ${isLast ? "last" : ""}`
                                                const value = prop[1]

                                                return (
                                                      <div key={index} className={rowClass}>
                                                            <InputField
                                                                  wrapperClasses={`${index === medicalValues.length - 2 ? "last" : ""}`}
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
                                                            {index !== medicalValues.length - 1 && <Spacer height={5} />}
                                                      </div>
                                                )
                                          })}
                              </div>
                        </AccordionDetails>
                  </Accordion>
            </div>
      )
}