// Path: src\components\screens\profile\resetPassword.jsx
import {initializeApp} from "firebase/app"
import {getAuth, sendPasswordResetEmail} from "firebase/auth"
import React, {useContext, useRef} from "react"
import validator from "validator"
import InputTypes from "../../../constants/inputTypes"
import ScreenNames from "../../../constants/screenNames"
import globalState from "../../../context"
import firebaseConfig from "../../../firebaseConfig"
import AlertManager from "../../../managers/alertManager"
import Form from "../../shared/form"
import InputField from "../../shared/inputField"
import Spacer from "../../shared/spacer"

export default function ResetPassword({showCard = false, onClose = () => {}}) {
      const {state, setState} = useContext(globalState)
      const {theme, firebaseUser} = state
      const app = initializeApp(firebaseConfig)
      const auth = getAuth(app)
      const email = useRef("")

      const SendResetLink = async () => {
            if (!validator?.isEmail(email.current)) {
                  AlertManager.throwError("Email is not valid")
                  return false
            }
            await sendPasswordResetEmail(auth, email.current)
                  .then(async () => {
                        AlertManager.successAlert("A reset link has been sent to your email")
                        setState({
                              ...state,
                              currentScreen: ScreenNames.login,
                              userIsLoggedIn: true,
                        })
                  })
                  .catch(() => {
                        AlertManager.throwError("Profile not Found", "We could not find an profile with the email provided")
                        return false
                  })
      }

      return (
            <Form
                  onClose={() => {
                        setState({...state, currentScreen: ScreenNames.login})
                        onClose()
                  }}
                  title={"Reset Password"}
                  submitText={"Send Reset Link"}
                  showCard={showCard}
                  onSubmit={SendResetLink}
                  wrapperClass="reset-password">
                  <Spacer height={10} />
                  <div className="screen-content">
                        <InputField
                              placeholder={"Email Address"}
                              required={true}
                              inputType={InputTypes.email}
                              onChange={(e) => (email.current = e.target.value)}
                        />
                  </div>
            </Form>
      )
}