import React, {useContext, useEffect} from "react"
import {IoCheckmarkCircleSharp} from "react-icons/io5"
import {RiErrorWarningFill} from "react-icons/ri"
import globalState from "../../context"
import Manager from "../../managers/manager"

const Banner = () => {
    const {state, setState} = useContext(globalState)
    const {bannerMessage, authUser, bannerType} = state

    useEffect(() => {
        if (!Manager.IsValid(bannerMessage, true)) return

        if (Manager.IsValid(bannerMessage, true)) {
            setTimeout(() => {
                setState({...state, bannerMessage: "", bannerType: ""})
            }, 2000)
        }
    }, [bannerMessage])

    return (
        <div
            id="banner-wrapper"
            className={`banner${Manager.IsValid(bannerMessage, true) ? " active" : ""}${bannerType === "error" ? " error" : ""}`}>
            <p className="banner-text">{bannerMessage}</p>
            {bannerType === "error" ? <RiErrorWarningFill className="banner-icon" /> : <IoCheckmarkCircleSharp className="banner-icon" />}
        </div>
    )
}

export default Banner