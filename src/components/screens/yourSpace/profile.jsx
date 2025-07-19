// Path: src\components\screens\profile\profile.jsx
import {initializeApp} from "firebase/app"
import {getAuth} from "firebase/auth"
import React, {useContext, useEffect} from "react"
import {MdContactMail, MdOutlinePassword} from "react-icons/md"
import globalState from "../../../context.js"
import DB from "../../../database/DB"
import DB_UserScoped from "../../../database/db_userScoped"
import firebaseConfig from "../../../firebaseConfig"
import useCurrentUser from "../../../hooks/useCurrentUser"
import DomManager from "../../../managers/domManager"
import Manager from "../../../managers/manager"
import AddressInput from "../../shared/addressInput"
import Label from "../../shared/label"
import Spacer from "../../shared/spacer"

export default function Profile({toggleShowResetPasswordForm = (bool) => {}, toggleUpdateEmailForm = () => {}}) {
      const {state, setState} = useContext(globalState)
      const {theme} = state

      const {currentUser} = useCurrentUser()

      // Init Firebase
      const app = initializeApp(firebaseConfig)
      const auth = getAuth(app)
      const firebaseUser = auth.currentUser

      const SetHomeAddress = async (address) => {
            await DB_UserScoped.updateByPath(`${DB.tables.users}/${currentUser?.key}/location/homeAddress`, address)
            setState({...state, successAlertMessage: "Home address has been updated"})
      }

      useEffect(() => {
            if (Manager.IsValid(currentUser)) {
                  DomManager.ToggleAnimation("add", "section", DomManager.AnimateClasses.names.fadeInUp)
            }
      }, [currentUser])

      return (
            <>
                  {/* PAGE CONTAINER */}
                  <div id={"profile-wrapper"} className={`${theme}`}>
                        <div className="actions">
                              <Label classes={"always-show section-title"} text={"Personal Info"} />
                              <Spacer height={10} />
                              {/* HOME ADDRESS */}
                              {Manager.IsValid(currentUser) && (
                                    <AddressInput
                                          wrapperClasses="on-grey-bg"
                                          onChange={(address) => SetHomeAddress(address).then()}
                                          defaultValue={currentUser?.location?.homeAddress}
                                          placeholder={"Home Address"}
                                          required={true}
                                          value={currentUser?.homeAddress}
                                    />
                              )}
                              <Spacer height={8} />

                              <p className={"reset-password"} onClick={() => toggleShowResetPasswordForm(true)}>
                                    <MdOutlinePassword />
                                    Reset Password
                              </p>
                              <p className="email" onClick={() => toggleUpdateEmailForm(true)}>
                                    <MdContactMail />
                                    Update Email Address
                              </p>
                        </div>
                  </div>
            </>
      )
}