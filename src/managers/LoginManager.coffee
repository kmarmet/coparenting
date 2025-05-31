import {getAuth, signOut} from "firebase/auth"
import {initializeApp} from "firebase/app"
import firebaseConfig from "../firebaseConfig"
import LogManager from "./logManager"

app = initializeApp(firebaseConfig)
auth = getAuth(app)

LoginManager =
  GetAuth: () ->
    return getAuth(app)

  SignOut: () ->
    signOut(auth)
      .then ->
        #Sign-out successful.
        console.log('User signed out manually')
        window.location.reload()

      .catch (error) ->
        #An error happened.
        LogManager.Log("Error: #{error} | Code File: LoginManager | Function: SignOut")
        console.log(error)

export default LoginManager