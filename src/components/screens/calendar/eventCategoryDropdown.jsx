import Accordion from "@mui/material/Accordion"
import AccordionDetails from "@mui/material/AccordionDetails"
import AccordionSummary from "@mui/material/AccordionSummary"
import React, {useContext, useEffect, useState} from "react"
import {FaMinus, FaPlus} from "react-icons/fa6"
import EventCategories from "../../../constants/eventCategories"
import globalState from "../../../context"
import CalendarManager from "../../../managers/calendarManager"
import Manager from "../../../managers/manager"
import StringManager from "../../../managers/stringManager"
import AccordionTitle from "../../shared/accordionTitle"
import Label from "../../shared/label"

const EventCategoryDropdown = ({updateCategories = (category) => {}, selectedCategories = []}) => {
    // APP STATE
    const {state, setState} = useContext(globalState)
    const {theme, creationFormToShow, selectedCalendarDate} = state

    // COMPONENT STATE
    const [showCategories, setShowCategories] = useState(Manager.IsValid(selectedCategories))
    const [selectedParents, setSelectedParents] = useState([])
    const [expandedCategories, setExpandedCategories] = useState({})

    useEffect(() => {
        if (Manager.IsValid(selectedCategories)) {
            const parentCategories = selectedCategories.map((x) => StringManager.GetFirstWord(CalendarManager.MapCategoryToParent(x)))
            setSelectedParents(parentCategories)
        }
    }, [selectedCategories])

    return (
        <>
            {selectedCategories?.length > 0 ? <Label text={"Selected Categories"} /> : ""}
            <Accordion className={`${theme} event-categories`} expanded={showCategories}>
                <AccordionSummary onClick={() => setShowCategories(!showCategories)}>
                    <AccordionTitle
                        className={`${theme} event-categories`}
                        titleText={`${Manager.IsValid(selectedCategories) ? `Open to View Categories (${selectedCategories.length})` : "Select Categories"}`}
                        toggleState={showCategories}
                        onClick={() => setShowCategories(!showCategories)}
                    />
                </AccordionSummary>
                <AccordionDetails>
                    {EventCategories?.map((catObj, index) => {
                        return (
                            <div key={index} className={"parent-category-wrapper"}>
                                <p
                                    className={"parent-category"}
                                    onClick={() =>
                                        setExpandedCategories((prev) => ({
                                            ...prev,
                                            [catObj.parentCategory]: !prev[catObj.parentCategory],
                                        }))
                                    }>
                                    {catObj.parentCategory}
                                    {expandedCategories[catObj.parentCategory] ? <FaMinus /> : <FaPlus />}
                                </p>
                                <div className={`categories${expandedCategories[catObj.parentCategory] ? " active" : ""}`}>
                                    {catObj.categories.map((type, catIndex) => {
                                        return (
                                            <p
                                                className={`child-category${selectedCategories?.includes(type) ? " active" : ""}`}
                                                key={catIndex}
                                                onClick={(el) => {
                                                    const thisChip = el.currentTarget
                                                    thisChip.classList.toggle("active")
                                                    updateCategories(type)
                                                }}>
                                                {type}
                                            </p>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </AccordionDetails>
            </Accordion>
        </>
    )
}

export default EventCategoryDropdown