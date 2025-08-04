import moment from "moment"
import React, {useContext, useEffect} from "react"
import {FaStar} from "react-icons/fa"
import {HiHome} from "react-icons/hi"
import ButtonThemes from "../../../constants/buttonThemes"
import ScreenNames from "../../../constants/screenNames"
import globalState from "../../../context"
import useChangelogs from "../../../hooks/useChangelogs"
import DomManager from "../../../managers/domManager"
import Manager from "../../../managers/manager"
import Button from "../../shared/button"
import Spacer from "../../shared/spacer"

const Changelogs = () => {
    const {state, setState} = useContext(globalState)
    const {currentAppVersion} = state

    // HOOKS
    const {changelogs} = useChangelogs()

    useEffect(() => {
        if (Manager.IsValid(changelogs)) {
            DomManager.ToggleAnimation("add", "card", DomManager.AnimateClasses.names.fadeInUp, 120)
        }
    }, [changelogs])

    return (
        <div id={"changelogs-wrapper"}>
            <div className={"content"}>
                <div className="screen-description">
                    <h1>Latest Updates</h1>

                    <p>
                        Authenticity and transparency are our core values. Because we are committed to keeping you informed about our progress, we
                        have created this page to share updates.
                    </p>

                    <Spacer height={5} />
                    <p>We will continuously highlight updates, whether we are adding a new feature or ✨ or fiercely squashing bugs 🪲.</p>
                </div>
                <div className={"cards"}>
                    {Manager.IsValid(changelogs) &&
                        changelogs?.map((changelog, index) => {
                            const changelogMonth = moment(changelog?.releaseDate).format("MMMM")
                            const changelogDay = moment(changelog?.releaseDate).format("Do")
                            const htmlWithIcons = changelog?.html
                                ?.replaceAll("New", "✨ New")
                                ?.replaceAll("Squashed", "🪲 Squashed")
                                ?.replaceAll("Improvements", "🪄 Improvements")

                            return (
                                <div className={"card"} key={index}>
                                    <div id="release-date-wrapper">
                                        <p className="day">{changelogDay}</p>
                                        <p className={"month-year"}>
                                            {changelogMonth} {moment().year()}
                                        </p>
                                    </div>
                                    <p className="version">
                                        v{changelog?.updatedVersion}
                                        <FaStar />
                                    </p>
                                    <div id="html-wrapper">
                                        <div dangerouslySetInnerHTML={{__html: htmlWithIcons}}></div>
                                    </div>
                                </div>
                            )
                        })}
                </div>
                <Button
                    theme={ButtonThemes.blend}
                    text={"Home"}
                    classes={"home-button"}
                    onClick={() => setState({...state, currentScreen: ScreenNames.calendar})}
                    icon={<HiHome />}
                />
            </div>
            <div id="changelogs-blur"></div>
        </div>
    )
}

export default Changelogs