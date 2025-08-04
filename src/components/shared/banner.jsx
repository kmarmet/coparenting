import React, {useContext, useEffect} from "react"
import {IoCheckmarkCircleSharp} from "react-icons/io5"
import {RiErrorWarningFill} from "react-icons/ri"
import globalState from "../../context"
import Manager from "../../managers/manager"

const Banner = () => {
    const {state, setState} = useContext(globalState)
    const {bannerMessage, bannerTitle, bannerType} = state

    useEffect(() => {
        if (!Manager.IsValid(bannerMessage, true) && !Manager.IsValid(bannerTitle, true)) return

        if (Manager.IsValid(bannerMessage, true) || Manager.IsValid(bannerTitle, true)) {
            setTimeout(() => {
                setState({...state, bannerMessage: "", bannerType: "", bannerTitle: ""})
            }, 2000)
        }
    }, [bannerMessage, bannerTitle])

    return (
        <div
            id="banner-wrapper"
            className={`banner${Manager.IsValid(bannerMessage, true) || Manager.IsValid(bannerTitle, true) ? " active" : ""}${bannerType === "error" ? " error" : ""}`}>
            <div className="banner-text">
                <p className="banner-title">
                    {Manager.IsValid(bannerTitle, true) ? bannerTitle : bannerType === "error" ? "Uh Oh" : "Success"}
                    {bannerType === "error" ? <RiErrorWarningFill className="banner-icon" /> : <IoCheckmarkCircleSharp className="banner-icon" />}
                </p>
                <p className="banner-message">{bannerMessage}</p>
            </div>
        </div>
    )
}

export default Banner