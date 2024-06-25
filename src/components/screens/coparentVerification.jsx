import React, { useState, useEffect, useContext, Fragment } from "react";
import db from "../../db.js";
import util from "../../util.js";
import globalState from "../../context.js";
import Error from "../shared/error.jsx";
import screenNames from "../../constants/screenNames.js";

export default function CoparentVerification() {
  const { state, setState } = useContext(globalState);
  const { currentUser } = state;
  const [code, setCode] = useState(null);
  const [error, setError] = useState(null);

  const verifyUser = () => {
    console.log(currentUser.verificationCode, code);
    if (!code || util.validation([code.toString()]).length > 0) {
      setError("Code is required");
      setState({ ...state, showError: true });
    } else {
      if (currentUser.verificationCode === Number(code)) {
        db.updateRecord(db.tables.users, currentUser, "isVerified", true);
      }
      setError(null);
      setState({ ...state, showError: false, currentScreen: screenNames.expenseTracker, userIsLoggedIn: true, currentUser: currentUser });
    }
  };

  useEffect(() => {
    setState({ ...state, currentScreenTitle: "Verification" });
  }, []);

  return (
    <div id="coparent-verification-container" className="page-container">
      <Error errorMessage={error} />
      <p>Please enter your verification code send to you via text message to use the app.</p>
      <div className="form">
        <input type="number" placeholder="Enter code..." onChange={(e) => setCode(e.target.value)} />
        <button className="button" onClick={verifyUser}>
          Verify
        </button>
      </div>
    </div>
  );
}
