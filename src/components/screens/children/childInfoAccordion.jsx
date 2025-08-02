import Accordion from "@mui/material/Accordion"
import AccordionDetails from "@mui/material/AccordionDetails"
import AccordionSummary from "@mui/material/AccordionSummary"
import React, {useContext, useEffect, useState} from "react"
import {FaMinus, FaPlus, FaTrash} from "react-icons/fa6"
import ButtonThemes from "../../../constants/buttonThemes"
import InputTypes from "../../../constants/inputTypes"
import globalState from "../../../context"
import DB from "../../../database/DB"
import DB_UserScoped from "../../../database/db_userScoped"
import useCurrentUser from "../../../hooks/useCurrentUser"
import useSharedChildInfo from "../../../hooks/useSharedChildInfo"
import Manager from "../../../managers/manager"
import StringManager from "../../../managers/stringManager"
import Button from "../../shared/button"
import InputField from "../../shared/inputField"
import Spacer from "../../shared/spacer"

const ChildInfoAccordion = ({infoParentTitle, wrapperClass = "", icon, activeChild}) => {
    const {state, setState} = useContext(globalState)
    const {theme, showScreenActions} = state

    // STATE
    const [showInputs, setShowInputs] = useState(false)
    const [data, setData] = useState([])
    const [noInfo, setNoInfo] = useState(false)

    // HOOKS
    const {currentUser} = useCurrentUser()
    const [updatedActiveChild, setUpdatedActiveChild] = useState(activeChild)
    const {sharedChildInfo} = useSharedChildInfo()

    const DeleteProp = async (prop) => {
        const sharing = await DB.GetTableData(`${DB.tables.sharedChildInfo}/${currentUser?.key}`)

        const existingPropCount = Object.keys(activeChild[infoParentTitle]).length

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
            await SetChildData()
        } else {
            const childIndex = DB.GetChildIndex(currentUser?.children, activeChild?.id)
            await DB_UserScoped.DeleteChildInfoProp(currentUser?.key, childIndex, infoParentTitle, StringManager.formatDbProp(prop))
            await SetChildData()
        }
    }

    const UpdateLocalActiveChild = async (prop, value) => {
        setUpdatedActiveChild({...activeChild, [infoParentTitle]: {...activeChild[infoParentTitle], [StringManager.formatDbProp(prop)]: value}})
    }
    const UpdateInDatabase = async () => {
        const childIndex = DB.GetIndexById(currentUser?.children, activeChild?.id)

        if (childIndex === -1) return

        await DB.ReplaceEntireRecord(`${DB.tables.users}/${currentUser?.key}/children/${childIndex}`, updatedActiveChild)
        setState({...state, bannerMessage: "Saved!"})
    }

    const SetChildData = async () => {
        if (!Manager.IsValid(activeChild) || !Manager.IsValid(activeChild) || !Manager.IsValid(activeChild[infoParentTitle])) return
        const sharedValues = Manager.IsValid(sharedChildInfo) ? sharedChildInfo.map((obj) => [obj.prop, obj.value, obj.sharedByName]) : []
        const dataEntries = Manager.IsValid(activeChild[infoParentTitle]) ? Object.entries(activeChild[infoParentTitle]) : []
        const allValues = dataEntries?.length > 0 ? [...dataEntries, ...sharedValues] : sharedValues
        let formattedValues = []
        for (let value of allValues) {
            formattedValues.push({
                prop: StringManager.SpaceBetweenWords(value[0]),
                value: value[1],
            })
        }
        const isAllEmpty = allValues?.length > 0 && allValues.every(([, value]) => value?.length === 0)
        setNoInfo(isAllEmpty)
        setData(isAllEmpty ? [] : formattedValues)
    }

    useEffect(() => {
        if (Manager.IsValid(activeChild)) {
            setUpdatedActiveChild(activeChild)
            void SetChildData()
        }
    }, [activeChild])

    return (
        <div className={`info-section section${wrapperClass}`}>
            <Accordion className={`${theme} children`} disabled={!Manager.IsValid(data)}>
                <AccordionSummary onClick={() => setShowInputs(!showInputs)} className={!Manager.IsValid(data) ? "disabled header" : "header"}>
                    {icon}
                    <p id="toggle-button" className={`${showInputs ? "active " : ""}`}>
                        {StringManager.UppercaseFirstLetterOfAllWords(infoParentTitle)}
                        {noInfo ? "- no info" : ""}
                        {Manager.IsValid(data) && <>{showInputs ? <FaMinus className="plus-minus" /> : <FaPlus className="plus-minus" />}</>}
                    </p>
                </AccordionSummary>
                <AccordionDetails>
                    <div className={`${Manager.IsValid(data) ? "section-wrapper" : "hidden"}`}>
                        {Manager.IsValid(data) &&
                            data.map((infoParent, index) => {
                                const isLast = index === data.length - 1
                                const isPhone = infoParent?.prop?.includes("phone")
                                const rowClass = `data-row ${isPhone ? "phone" : ""} ${isLast ? "last" : ""}`
                                return (
                                    <div key={index} className={rowClass}>
                                        <InputField
                                            labelClasses={"white-bg"}
                                            wrapperClasses={`${index === data.length - 2 ? "last white-bg" : "white-bg"}`}
                                            hasBottomSpacer={false}
                                            customDebounceDelay={1200}
                                            inputType={InputTypes.text}
                                            defaultValue={infoParent?.value}
                                            placeholder={`${infoParent?.prop}`}
                                            onChange={async (e) => {
                                                const inputValue = e.target.value
                                                await UpdateLocalActiveChild(infoParent?.prop, inputValue)
                                            }}>
                                            <FaTrash className={"close-x children"} onClick={() => DeleteProp(infoParent?.prop)} />
                                        </InputField>
                                        {index !== data.length - 1 && <Spacer height={5} />}
                                    </div>
                                )
                            })}
                        <Spacer height={10} />
                        <Button text={"Update"} onClick={UpdateInDatabase} theme={ButtonThemes.green} />
                    </div>
                </AccordionDetails>
            </Accordion>
        </div>
    )
}

export default ChildInfoAccordion