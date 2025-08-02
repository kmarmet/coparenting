import Accordion from "@mui/material/Accordion"
import AccordionDetails from "@mui/material/AccordionDetails"
import AccordionSummary from "@mui/material/AccordionSummary"
import React, {useContext, useEffect, useState} from "react"
import {FaMinus, FaPlus, FaTrash} from "react-icons/fa6"
import ButtonThemes from "../../../constants/buttonThemes"
import InputTypes from "../../../constants/inputTypes"
import globalState from "../../../context"
import DB from "../../../database/DB"
import useChildren from "../../../hooks/useChildren"
import useCurrentUser from "../../../hooks/useCurrentUser"
import useSharedChildInfo from "../../../hooks/useSharedChildInfo"
import DatasetManager from "../../../managers/datasetManager"
import Manager from "../../../managers/manager"
import StringManager from "../../../managers/stringManager"
import AddressInput from "../../shared/addressInput"
import Button from "../../shared/button"
import InputField from "../../shared/inputField"
import Spacer from "../../shared/spacer"

const ChildInfoAccordion = ({infoParentTitle, wrapperClass = "", icon, activeChild, setActiveChild = (child) => {}}) => {
    const {state, setState} = useContext(globalState)
    const {theme, showScreenActions} = state

    // STATE
    const [showInputs, setShowInputs] = useState(false)
    const [data, setData] = useState([])
    const [noInfo, setNoInfo] = useState(false)
    const [entryIdsToUpdate, setEntryIdsToUpdate] = useState([])

    // HOOKS
    const {currentUser} = useCurrentUser()
    const {sharedChildInfo} = useSharedChildInfo()
    const {children} = useChildren()

    const DeleteProp = async (entryId) => {
        const childIndex = DB.GetChildIndex(currentUser?.children, activeChild?.id)
        if (childIndex === -1) return

        const deleteIndex = activeChild?.details?.findIndex((x) => x?.id === entryId)
        if (deleteIndex === -1) return

        await DB.DeleteByPath(`${DB.tables.users}/${currentUser?.key}/children/${childIndex}/details/${deleteIndex}`)

        // Delete Shared
        const sharedProps = sharedChildInfo?.map((x) => x?.prop)
        // TODO : Fix this
        // if (Manager.IsValid(sharedProps) && sharedProps.includes(prop.toLowerCase())) {
        //     const scopedSharingObject = await DB.find(sharedChildInfo, ["prop", prop.toLowerCase()], false)
        //     // await DB_UserScoped.deleteSharedChildInfoProp(currentUser, sharedChildInfo, prop.toLowerCase(), scopedSharingObject?.sharedByOwnerKey)
        // }
    }

    const UpdateInDatabase = async () => {
        const childIndex = DB.GetIndexById(currentUser?.children, activeChild?.id)
        const details = activeChild?.details

        const childEntryInputs = document.querySelectorAll(".entry-input")

        let updatedActiveChild = {...activeChild}

        for (let entry of childEntryInputs) {
            const childInput = entry?.querySelector("input")
            const inputValue = childInput?.value
            const entryId = entry?.getAttribute("data-entry-id")
            updatedActiveChild["details"]["value"] = inputValue

            const entryIndex = details?.findIndex((x) => x?.id === entryId)
            if (entryIndex === -1) continue
            await DB.UpdateByPath(`${DB.tables.users}/${currentUser?.key}/children/${childIndex}/details/${entryIndex}/value`, inputValue)
        }

        setState({...state, bannerMessage: "Updated"})
    }

    const SetChildData = async () => {
        console.log(activeChild?.details)

        if (Manager.IsValid(DatasetManager.GetValidArray(activeChild?.details, true))) {
            let _data = DatasetManager.GetValidArray(activeChild?.details, true)?.filter((x) => x?.category === infoParentTitle)
            if (Manager.IsValid(_data)) {
                _data.forEach((x) => (x.label = StringManager.SpaceBetweenWords(x?.label)))
            }

            setData(_data || [])
        }
    }

    useEffect(() => {
        if (Manager.IsValid(activeChild)) {
            void SetChildData()
        }
    }, [activeChild, children])

    return (
        <div className={`info-category category${wrapperClass}`}>
            <Accordion expanded={showInputs && Manager.IsValid(data)} className={`${theme} children`} disabled={!Manager.IsValid(data)}>
                <AccordionSummary onClick={() => setShowInputs(!showInputs)} className={!Manager.IsValid(data) ? "disabled header" : "header"}>
                    {icon}
                    <p id="toggle-button" className={`${showInputs ? "active " : ""}`}>
                        {StringManager.UppercaseFirstLetterOfAllWords(infoParentTitle)}
                        {noInfo ? "- no info" : ""}
                        {Manager.IsValid(data) && <>{showInputs ? <FaMinus className="plus-minus" /> : <FaPlus className="plus-minus" />}</>}
                    </p>
                </AccordionSummary>
                <AccordionDetails>
                    <div className={`${Manager.IsValid(data) ? "category-wrapper" : "hidden"}`}>
                        {Manager.IsValid(data) &&
                            data.map((entry, index) => {
                                const isLast = index === data.length - 1
                                const isPhone = entry?.dataType?.toLowerCase() === "phone"
                                const rowClass = `data-row ${isPhone ? "phone" : ""} ${isLast ? "last" : ""}`
                                const isAddress = entry?.dataType?.toLowerCase() === "address"
                                return (
                                    <div key={index} className={rowClass}>
                                        {isAddress && (
                                            <AddressInput
                                                labelText={entry.label}
                                                value={entry.value}
                                                labelClasses={"white-bg"}
                                                defaultValue={entry.value}
                                                wrapperClasses={"white-bg"}
                                                onChange={(value) => {}}
                                            />
                                        )}
                                        {!isAddress && (
                                            <div className={"entry-input"} data-entry-id={entry?.id} data-entry-label={entry?.dbFormattedLabel}>
                                                <InputField
                                                    labelClasses={"white-bg"}
                                                    wrapperClasses={`${index === data.length - 2 ? "last white-bg" : "white-bg"}`}
                                                    hasBottomSpacer={false}
                                                    inputType={InputTypes.text}
                                                    defaultValue={entry?.value}
                                                    placeholder={`${entry?.label}`}
                                                    onChange={async (e) => {
                                                        const inputValue = e.target.value
                                                        if (!entryIdsToUpdate.includes(entry?.id)) {
                                                            setEntryIdsToUpdate((prev) => [...prev, entry?.id])
                                                        }
                                                    }}>
                                                    <FaTrash className={"close-x children"} onClick={() => DeleteProp(entry?.id)} />
                                                </InputField>
                                            </div>
                                        )}
                                        {index !== data.length - 1 && <Spacer height={5} />}
                                    </div>
                                )
                            })}
                        <Spacer height={10} />
                        {Manager.IsValid(entryIdsToUpdate) && <Button text={"Update"} onClick={UpdateInDatabase} theme={ButtonThemes.green} />}
                    </div>
                </AccordionDetails>
            </Accordion>
        </div>
    )
}

export default ChildInfoAccordion