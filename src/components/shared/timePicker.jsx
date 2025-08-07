import React, {useContext, useEffect} from "react"
import {GiClick} from "react-icons/gi"
import {PiMouseScrollFill} from "react-icons/pi"
import globalState from "../../context"
import DomManager from "../../managers/domManager"
import Label from "./label"
import Spacer from "./spacer"

const TimePicker = ({defaultValue, callback = (time) => {}, show, buttonText = "Set Time"}) => {
    const {state, setState} = useContext(globalState)
    const {theme, showScreenActions} = state

    // STATE
    const [meridian, setMeridian] = React.useState("am")
    const [hour, setHour] = React.useState("1")
    const [minute, setMinute] = React.useState("00")
    const [method, setMethod] = React.useState("tap")

    const OnScroll = (parent, childClass) => {
        const scrollable = parent?.target

        const boxRect = scrollable.getBoundingClientRect()
        const centerY = boxRect.top + boxRect.height / 3

        const elements = scrollable.querySelectorAll(`.${childClass}`)

        for (const el of elements) {
            const rect = el.getBoundingClientRect()
            if (rect.top <= centerY && rect.bottom >= centerY) {
                if (childClass === "hour:not(.placeholder)") {
                    el.classList.add("active")
                    setHour(el.textContent)
                } else if (childClass === "minute") {
                    el.classList.add("active")
                    setMinute(el.textContent)
                }
                break
            }
        }
    }

    const ComposeTime = () => callback(`${hour}:${minute}${meridian}`)

    useEffect(() => {
        if (method === "scroll") {
            const allHours = document.querySelectorAll(".on-scroll .hour:not(.placeholder)")
            allHours.forEach((el) => {
                if (el.textContent === hour) {
                    el.scrollIntoView({behavior: "smooth", block: "center"})
                }
            })
            const allMinutes = document.querySelectorAll(".on-scroll .minute:not(.placeholder)")
            allMinutes.forEach((el) => {
                if (el.textContent === minute) {
                    el.scrollIntoView({behavior: "smooth", block: "center"})
                }
            })
        }
    }, [method])

    useEffect(() => {
        ComposeTime()
    }, [hour, minute, meridian, method])

    return (
        <div className={`timepicker${show ? " active" : ""} view`}>
            <div className="timepicker-content">
                {/* ON TAP */}
                <div className={`timepicker-method on-tap${method === "tap" ? " active" : ""}`}>
                    {/* HOURS AND MINUTES */}
                    <Label text={"Hours"} classes={"always-show"} />
                    <div className="hours">
                        <span
                            onClick={(hour) => setHour(hour.currentTarget.textContent)}
                            className={`timepicker-selector-button hour${hour === "1" ? " active" : ""}`}>
                            1
                        </span>
                        <span
                            onClick={(hour) => setHour(hour.currentTarget.textContent)}
                            className={`timepicker-selector-button hour${hour === "2" ? " active" : ""}`}>
                            2
                        </span>
                        <span
                            onClick={(hour) => setHour(hour.currentTarget.textContent)}
                            className={`timepicker-selector-button hour${hour === "3" ? " active" : ""}`}>
                            3
                        </span>
                        <span
                            onClick={(hour) => setHour(hour.currentTarget.textContent)}
                            className={`timepicker-selector-button hour${hour === "4" ? " active" : ""}`}>
                            4
                        </span>
                        <span
                            onClick={(hour) => setHour(hour.currentTarget.textContent)}
                            className={`timepicker-selector-button hour${hour === "5" ? " active" : ""}`}>
                            5
                        </span>
                        <span
                            onClick={(hour) => setHour(hour.currentTarget.textContent)}
                            className={`timepicker-selector-button hour${hour === "6" ? " active" : ""}`}>
                            6
                        </span>
                        <span
                            onClick={(hour) => setHour(hour.currentTarget.textContent)}
                            className={`timepicker-selector-button hour${hour === "7" ? " active" : ""}`}>
                            7
                        </span>
                        <span
                            onClick={(hour) => setHour(hour.currentTarget.textContent)}
                            className={`timepicker-selector-button hour${hour === "8" ? " active" : ""}`}>
                            8
                        </span>
                        <span
                            onClick={(hour) => setHour(hour.currentTarget.textContent)}
                            className={`timepicker-selector-button hour${hour === "9" ? " active" : ""}`}>
                            9
                        </span>
                        <span
                            onClick={(hour) => setHour(hour.currentTarget.textContent)}
                            className={`timepicker-selector-button hour${hour === "10" ? " active" : ""}`}>
                            10
                        </span>
                        <span
                            onClick={(hour) => setHour(hour.currentTarget.textContent)}
                            className={`timepicker-selector-button hour${hour === "11" ? " active" : ""}`}>
                            11
                        </span>
                        <span
                            onClick={(hour) => setHour(hour.currentTarget.textContent)}
                            className={`timepicker-selector-button hour${hour === "12" ? " active" : ""}`}>
                            12
                        </span>
                    </div>

                    <Spacer height={10} />
                    <Label text={"Minutes"} classes={"always-show"} />
                    <div className="minutes">
                        <span onClick={() => setMinute("00")} className={`timepicker-selector-button minute${minute === "00" ? " active" : ""}`}>
                            00
                        </span>
                        <span onClick={() => setMinute("5")} className={`timepicker-selector-button minute${minute === "5" ? " active" : ""}`}>
                            5
                        </span>
                        <span onClick={() => setMinute("10")} className={`timepicker-selector-button minute${minute === "10" ? " active" : ""}`}>
                            10
                        </span>
                        <span onClick={() => setMinute("15")} className={`timepicker-selector-button minute${minute === "15" ? " active" : ""}`}>
                            15
                        </span>
                        <span onClick={() => setMinute("20")} className={`timepicker-selector-button minute${minute === "20" ? " active" : ""}`}>
                            20
                        </span>
                        <span onClick={() => setMinute("25")} className={`timepicker-selector-button minute${minute === "25" ? " active" : ""}`}>
                            25
                        </span>
                        <span onClick={() => setMinute("30")} className={`timepicker-selector-button minute${minute === "30" ? " active" : ""}`}>
                            30
                        </span>
                        <span onClick={() => setMinute("35")} className={`timepicker-selector-button minute${minute === "35" ? " active" : ""}`}>
                            35
                        </span>
                        <span onClick={() => setMinute("40")} className={`timepicker-selector-button minute${minute === "40" ? " active" : ""}`}>
                            40
                        </span>
                        <span onClick={() => setMinute("45")} className={`timepicker-selector-button minute${minute === "45" ? " active" : ""}`}>
                            45
                        </span>
                        <span onClick={() => setMinute("50")} className={`timepicker-selector-button minute${minute === "50" ? " active" : ""}`}>
                            50
                        </span>
                        <span onClick={() => setMinute("55")} className={`timepicker-selector-button minute${minute === "55" ? " active" : ""}`}>
                            55
                        </span>
                    </div>
                </div>

                {/* SCROLL PICKER */}
                <div className={`timepicker-method on-scroll${method === "scroll" ? " active" : ""}`}>
                    <div onScroll={(e) => OnScroll(e, "hour:not(.placeholder)")} className="hours">
                        <span className="hour placeholder"></span>
                        <span className={`hour${hour === "1" ? " active" : ""}`}>1</span>
                        <span className={`hour${hour === "2" ? " active" : ""}`}>2</span>
                        <span className={`hour${hour === "3" ? " active" : ""}`}>3</span>
                        <span className={`hour${hour === "4" ? " active" : ""}`}>4</span>
                        <span className={`hour${hour === "5" ? " active" : ""}`}>5</span>
                        <span className={`hour${hour === "6" ? " active" : ""}`}>6</span>
                        <span className={`hour${hour === "7" ? " active" : ""}`}>7</span>
                        <span className={`hour${hour === "8" ? " active" : ""}`}>8</span>
                        <span className={`hour${hour === "9" ? " active" : ""}`}>9</span>
                        <span className={`hour${hour === "10" ? " active" : ""}`}>10</span>
                        <span className={`hour${hour === "11" ? " active" : ""}`}>11</span>
                        <span className={`hour${hour === "12" ? " active" : ""}`}>12</span>
                        <span className="hour placeholder"></span>
                    </div>
                    <span className="colon">:</span>
                    <div onScroll={(e) => OnScroll(e, "minute")} className="minutes">
                        <span className="minute placeholder"></span>
                        <span className={`minute${minute === "00" ? " active" : ""}`}>00</span>
                        <span className={`minute${minute === "5" ? " active" : ""}`}>5</span>
                        <span className={`minute${minute === "10" ? " active" : ""}`}>10</span>
                        <span className={`minute${minute === "15" ? " active" : ""}`}>15</span>
                        <span className={`minute${minute === "20" ? " active" : ""}`}>20</span>
                        <span className={`minute${minute === "25" ? " active" : ""}`}>25</span>
                        <span className={`minute${minute === "30" ? " active" : ""}`}>30</span>
                        <span className={`minute${minute === "35" ? " active" : ""}`}>35</span>
                        <span className={`minute${minute === "40" ? " active" : ""}`}>40</span>
                        <span className={`minute${minute === "45" ? " active" : ""}`}>45</span>
                        <span className={`minute${minute === "50" ? " active" : ""}`}>50</span>
                        <span className={`minute${minute === "55" ? " active" : ""}`}>55</span>
                        <span className="minute placeholder"></span>
                    </div>
                    <div className={`meridian ${meridian}`}>
                        <span className={`am-pm`}></span>
                        <span className={`am am-pm${meridian === "am" ? " active" : ""}`} onClick={() => setMeridian("am")}>
                            AM
                        </span>
                        <span className={`pm am-pm${meridian === "pm" ? " active" : ""}`} onClick={() => setMeridian("pm")}>
                            PM
                        </span>
                    </div>
                </div>
            </div>
            <Spacer height={5} />
            <div className="bottom-bar">
                {/* SELECTOR */}
                <div className="timepicker-selector">
                    {/* ON TAP */}
                    <button className={`timepicker-method-button${method === "tap" ? " active" : ""}`} onClick={() => setMethod("tap")}>
                        <GiClick />
                        {DomManager.tapOrClick(true)}
                    </button>

                    {/* ON SCROLL */}
                    <button className={`timepicker-method-button${method === "scroll" ? " active" : ""}`} onClick={(el) => setMethod("scroll")}>
                        <PiMouseScrollFill />
                        Scroll
                    </button>
                </div>
                {method === "tap" && (
                    <div className="meridians">
                        <span onClick={() => setMeridian("am")} className={`meridian${meridian === "am" ? " active" : ""}`}>
                            am
                        </span>
                        <span onClick={() => setMeridian("pm")} className={`meridian${meridian === "pm" ? " active" : ""}`}>
                            pm
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default TimePicker