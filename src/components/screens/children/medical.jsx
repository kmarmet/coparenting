// Path: src\components\screens\childInfo\medical.jsx
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import React, {useContext, useEffect, useState} from 'react'
import {CgClose} from 'react-icons/cg'
import {FaBriefcaseMedical} from 'react-icons/fa'
import {FaMinus, FaPlus} from 'react-icons/fa6'
import InputTypes from '../../../constants/inputTypes'
import globalState from '../../../context'
import DB from '../../../database/DB'
import DB_UserScoped from '../../../database/db_userScoped'
import useChildren from '../../../hooks/useChildren'
import useCurrentUser from '../../../hooks/useCurrentUser'
import Manager from '../../../managers/manager'
import StringManager from '../../../managers/stringManager'
import InputField from '../../shared/inputField'

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
            const accordion = document.querySelector('.medical.info-section')
            if (accordion) {
                accordion.querySelector('.MuiCollapse-root').remove()
            }
            setShowInputs(false)
        }

        // Delete Shared
        const sharedProps = sharedInfoRecords?.map((x) => x?.prop)
        let formattedProp = StringManager.toCamelCase(prop.toLowerCase())

        if (Manager.IsValid(sharedProps) && sharedProps.includes(formattedProp)) {
            const scopedSharingObject = await DB.find(sharedInfoRecords, ['prop', formattedProp], false)
            await DB_UserScoped.deleteSharedChildInfoProp(currentUser, scopedSharingObject, formattedProp, scopedSharingObject?.sharedByOwnerKey)
            await SetChildData()
        }

        // Delete NOT shared
        else {
            const childIndex = DB.GetChildIndex(children, activeChild?.id)
            await DB_UserScoped.DeleteChildInfoProp(currentUser?.key, childIndex, 'medical', StringManager.formatDbProp(prop))
            await SetChildData()
        }
    }

    const Update = async (prop, value) => {
        await DB_UserScoped.UpdateChildInfo(currentUser, activeChild, 'medical', StringManager.formatDbProp(prop), value)
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
                    className={!Manager.IsValid(medicalValues) ? 'disabled header medical' : 'header medical'}>
                    <FaBriefcaseMedical className={'svg medical'} />
                    <p id="toggle-button" className={showInputs ? 'active' : ''}>
                        Medical
                        {!Manager.IsValid(medicalValues) ? '- no info' : ''}
                        {Manager.IsValid(medicalValues) && <>{showInputs ? <FaMinus className="plus-minus" /> : <FaPlus className="plus-minus" />}</>}
                    </p>
                </AccordionSummary>
                <AccordionDetails>
                    <div className="gradient padding">
                        {Manager.IsValid(medicalValues) &&
                            medicalValues.map((prop, index) => {
                                const infoLabel = StringManager.SpaceBetweenWords(prop[0])
                                const value = prop[1]

                                return (
                                    <div key={index} className="data-row">
                                        {infoLabel.toLowerCase().includes('phone') && (
                                            <>
                                                <a href={`tel:${StringManager.FormatPhone(value).toString()}`}>
                                                    {infoLabel}: {value}
                                                </a>
                                                <CgClose className={'close-x children'} onClick={() => DeleteProp(infoLabel)} />
                                            </>
                                        )}
                                        {!infoLabel.toLowerCase().includes('phone') && (
                                            <>
                                                <InputField
                                                    hasBottomSpacer={false}
                                                    inputType={InputTypes.text}
                                                    placeholder={`${StringManager.UppercaseFirstLetterOfAllWords(infoLabel)} ${
                                                        Manager.IsValid(prop[2]) ? `(shared by ${StringManager.GetFirstNameOnly(prop[2])})` : ''
                                                    }`}
                                                    defaultValue={value}
                                                    debounceTimeout={1000}
                                                    onChange={(e) => {
                                                        const inputValue = e.target.value
                                                        Update(infoLabel, `${inputValue}`).then((r) => r)
                                                    }}
                                                />
                                                <CgClose className={'close-x children'} onClick={() => DeleteProp(infoLabel)} />
                                            </>
                                        )}
                                    </div>
                                )
                            })}
                    </div>
                </AccordionDetails>
            </Accordion>
        </div>
    )
}