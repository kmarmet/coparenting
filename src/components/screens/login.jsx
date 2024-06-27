import React, { useState, useEffect, useContext, Fragment } from "react";
import db from "../../db.js";
import util from "../../util.js";
import globalState from "../../context.js";
import Error from "../shared/error.jsx";
import screenNames from "../../constants/screenNames.js";
import CheckboxGroup from "../shared/checkboxGroup.jsx";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, browserSessionPersistence, setPersistence } from "firebase/auth";

export default function Login() {
  const { state, setState } = useContext(globalState);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const login = async () => {
    console.log(true);
    setError("");

    if (util.validation([phone, password]) > 0) {
      setError("Please fill out all fields");
      setState({ ...state, showError: true });
      // return false;
    }

    await db.getTable(db.tables.users).then((data) => {
      data = Object.entries(data);
      let foundUser = null;

      data.filter((x) => {
        x.forEach((user) => {
          if (user && user.phone && user.password) {
            if (user.phone === phone && user.password === password) {
              foundUser = user;
              console.log(foundUser);
              if (rememberMe) {
                localStorage.removeItem("rememberKey");
              } else {
                localStorage.setItem("rememberKey", user.id);
              }
            }
          }
        });
      })[0];

      if (foundUser) {
        setState({
          ...state,
          userIsLoggedIn: true,
          currentScreen: foundUser.isVerified ? screenNames.expenseTracker : screenNames.coparentVerification,
          currentUser: foundUser,
        });
      } else {
        setError("Incorrect email and/or password");
        setState({ ...state, showError: true });
      }
    });
  };

  const showConsentInfoScreen = () => {
    setState({ ...state, currentScreen: screenNames.consentInfo });
  };

  const toggleRememberMe = (e) => {
    const clickedEl = e.currentTarget;
    const checkbox = clickedEl.querySelector(".box");
    if (checkbox.classList.contains("active")) {
      setRememberMe(false);
      checkbox.classList.remove("active");
    } else {
      checkbox.classList.add("active");
      setRememberMe(true);
    }
  };

  useEffect(() => {
    util.scrollToTopOfPage();
    setState({ ...state, currentScreen: "login", currentScreenTitle: "Login" });
  }, []);

  return (
    <div id="login-container" className="page-container">
      {/* <Error errorMessage={error} /> */}
      <div id="quote-container">
        <span>
          <code>❝</code>
        </span>
        <p id="quote">
          Co-parenting. It's not a competition between two homes. It's <b>a collaboration of parents doing what is best for the kids</b>
        </p>
        <p id="author">~ Heather Hetchler</p>
      </div>
      <div className="flex form-container">
        <div className="form">
          <input type="number" pattern="[0-9]*" inputMode="numeric" placeholder="Phone number" onChange={(e) => setPhone(e.target.value)} />
          <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
          <div className="flex button-group">
            <button className="button green" onClick={login}>
              Login <span className="material-icons-round">lock_open</span>
            </button>
            <button className="button register" onClick={showConsentInfoScreen}>
              Register <span className="material-icons-round">person_add</span>
            </button>
          </div>
          <CheckboxGroup onCheck={toggleRememberMe} labels={["Remember Me"]} />
        </div>

        <p id="forgot-password-link" onClick={() => setState({ ...state, currentScreen: screenNames.forgotPassword })}>
          Forgot Password
        </p>
      </div>
    </div>
  );
}
