import React, {useContext, useEffect, useState} from "react"
import {GrInstallOption} from "react-icons/gr"
import {MdEmail} from "react-icons/md"
import {PiVideoFill} from "react-icons/pi"
import InputTypes from "../../constants/inputTypes"
import ScreenNames from "../../constants/screenNames"
import globalState from "../../context"
import useCurrentUser from "../../hooks/useCurrentUser"
import AlertManager from "../../managers/alertManager"
import DomManager from "../../managers/domManager"
import EmailManager from "../../managers/emailManager"
import Manager from "../../managers/manager"
import NavBar from "../navBar"
import Form from "../shared/form"
import InputField from "../shared/inputField"
import Screen from "../shared/screen"
import ScreenHeader from "../shared/screenHeader"
import Spacer from "../shared/spacer"

export default function Help() {
    const {state, setState} = useContext(globalState)
    const {theme} = state

    const [supportNotes, setSupportNotes] = useState("")
    const [showSupportCard, setShowSupportCard] = useState(false)
    const {currentUser} = useCurrentUser()

    const ResetSupportForm = () => {
        Manager.ResetForm("support-wrapper")
    }

    const SubmitSupportRequest = () => {
        if (supportNotes.length === 0) {
            AlertManager.throwError("Please a description of the problem you are facing")
            return false
        }

        setState({...state, bannerMessage: "We will be in touch soon!"})
        EmailManager.SendSupportEmail(currentUser?.email, supportNotes)
        setShowSupportCard(false)
        ResetSupportForm()
    }

    useEffect(() => {
        DomManager.ToggleAnimation("add", "section", DomManager.AnimateClasses.names.fadeInUp)
    }, [])

    return (
        <Screen activeScreen={ScreenNames.help}>
            {/* CONTACT SUPPORT */}
            <Form
                submitText={"Get Support"}
                onSubmit={SubmitSupportRequest}
                wrapperClass="support-wrapper"
                className="support-wrapper"
                title={"How We Can Help?"}
                subtitle="We are here to help! If you have any questions or concerns, please let us know and we will get back to you as soon as possible"
                showCard={showSupportCard}
                onClose={() => setShowSupportCard(false)}>
                <Spacer height={8} />
                <div className="support-wrapper">
                    <div id="support-container" className={`${theme} `}>
                        <InputField
                            inputType={InputTypes.textarea}
                            placeholder={"Concerns/Questions Here..."}
                            required={true}
                            onChange={(e) => setSupportNotes(e.target.value)}
                        />
                    </div>
                </div>
            </Form>

            {/* CONTACT US */}
            <div id="help-container" className={`${theme} page-container`}>
                <ScreenHeader
                    title={"How can we Help?"}
                    wrapperClass="no-Add-new-button"
                    screenDescription={
                        "We genuinely care about your experience with our app. Because of that, we are here to help in any way we can!"
                    }
                />
                <div className="screen-content">
                    {/* SECTIONS */}
                    <div className="sections">
                        <p className="section" onClick={() => setShowSupportCard(true)}>
                            <PiVideoFill />
                            Tutorial
                        </p>
                        <p className="section" onClick={() => setState({...state, currentScreen: ScreenNames.installApp})}>
                            <GrInstallOption />
                            Install
                        </p>

                        <p className="section" onClick={() => setShowSupportCard(true)}>
                            <MdEmail />
                            Contact Support
                        </p>
                    </div>
                </div>
            </div>
            {!showSupportCard && <NavBar navbarClass={"no-Add-new-button"}></NavBar>}
        </Screen>
    )
}