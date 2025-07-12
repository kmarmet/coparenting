import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import React, {useContext, useEffect, useState} from 'react'
import {CgClose} from 'react-icons/cg'
import {FaMinus, FaPlus} from 'react-icons/fa6'
import {IoCheckmarkCircleSharp} from 'react-icons/io5'
import {PiListChecksFill} from 'react-icons/pi'
import globalState from '../../../context'
import DB from '../../../database/DB'
import useActiveChild from '../../../hooks/useActiveChild'
import useChildren from '../../../hooks/useChildren'
import useCurrentUser from '../../../hooks/useCurrentUser'
import DomManager from '../../../managers/domManager'
import Manager from '../../../managers/manager'
import StringManager from '../../../managers/stringManager'

export default function Checklist({fromOrTo, activeChildId}) {
    const {state, setState} = useContext(globalState)
    const {theme, refreshKey} = state
    const {currentUser} = useCurrentUser()
    const [checklist, setChecklist] = useState([])
    const [activeItems, setActiveItems] = useState([])
    const {children, childrenAreLoading} = useChildren()
    const [showChecklist, setShowChecklist] = useState(false)
    const [accordionIsExpanded, setAccordionIsExpanded] = useState(false)
    const {activeChild, activeChildIsLoading} = useActiveChild(activeChildId)

    const ToggleActive = (el) => {
        const filtered = activeItems.filter((x) => x !== el.target.textContent.toLowerCase())
        if (el.target.classList.contains('active')) {
            setActiveItems(filtered)
        } else {
            setActiveItems([...activeItems, el.target.textContent.toLowerCase()])
        }
        DomManager.ToggleActive(el.target)
    }

    const DeleteItem = async (el) => {
        const element = el.currentTarget
        const checklistItemWrapper = element.closest('.checklist-item-row')
        const text = checklistItemWrapper.getAttribute('data-checklist-text')

        if (!Manager.IsValid(text)) {
            return false
        }

        const childIndex = DB.GetChildIndex(children, activeChild?.id)

        if (!Manager.IsValid(childIndex)) {
            return false
        }
        let activeChecklist = activeChild?.checklists?.find((x) => x?.fromOrTo === fromOrTo)

        if (!Manager.IsValid(activeChecklist)) {
            return false
        }

        const activeChecklistIndex = DB.GetTableIndexById(activeChild?.checklists, activeChecklist?.id)

        if (!Manager.IsValid(activeChecklistIndex)) {
            return false
        }

        const path = `${DB.tables.users}/${currentUser?.key}/children/${childIndex}/checklists/${activeChecklistIndex}`

        // Update items
        activeChecklist.items = activeChecklist.items?.filter((x) => x.trim().toLowerCase() !== text.trim().toLowerCase())

        if (activeChecklist.items?.length === 0) {
            await DB.Delete(path)
        } else {
            await DB.updateByPath(path, activeChecklist)
        }
    }

    const SetSelectedChild = async () => {
        const activeChecklists = activeChild?.checklists
        let activeChecklist
        if (Manager.IsValid(activeChecklists)) {
            // console.log(activeChecklists)
            activeChecklist = activeChecklists.find((x) => x?.fromOrTo === fromOrTo)
        }
        // console.log(activeChecklist)
        if (Manager.IsValid(activeChecklist)) {
            setShowChecklist(true)
            setChecklist(activeChecklist)
            setActiveItems(activeChecklist?.items)
        } else {
            setShowChecklist(false)
        }
    }

    useEffect(() => {
        if (Manager.IsValid(activeChild)) {
            SetSelectedChild().then((r) => r)
        }
    }, [activeChild])

    return (
        <div className={`info-section section checklist ${fromOrTo}`}>
            {showChecklist && (
                <Accordion className={`${theme} child-info`} expanded={accordionIsExpanded}>
                    <AccordionSummary onClick={() => setAccordionIsExpanded(!accordionIsExpanded)} className={'header checklist'}>
                        <PiListChecksFill className={`${fromOrTo} svg`} />
                        <p id="toggle-button" className={accordionIsExpanded ? 'active' : ''}>
                            Transfer Checklist<span className="smaller-text">({fromOrTo})</span>
                            {accordionIsExpanded ? <FaMinus className={`plus-minus ${fromOrTo}`} /> : <FaPlus className={`plus-minus ${fromOrTo}`} />}
                        </p>
                    </AccordionSummary>
                    <AccordionDetails className={'checklist-wrapper'}>
                        {Manager.IsValid(checklist) &&
                            Manager.IsValid(checklist?.items) &&
                            checklist?.items?.map((item, index) => {
                                return (
                                    <div data-checklist-text={item} key={index} className="data-row" className="checklist-item-row">
                                        <p onClick={ToggleActive} className="checklist-item">
                                            {activeItems.includes(item.toLowerCase()) && <IoCheckmarkCircleSharp className={'checkmark'} />}
                                            {StringManager.UppercaseFirstLetterOfAllWords(item)}
                                        </p>
                                        <CgClose className={'close-x children'} onClick={DeleteItem} />
                                    </div>
                                )
                            })}
                    </AccordionDetails>
                </Accordion>
            )}
        </div>
    )
}