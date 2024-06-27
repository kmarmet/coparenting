import React, { useState, useEffect, useContext } from "react";
import db from "../../db";
import globalState from "../../context";
import Error from "../shared/error";
import util from "../../util";
import SmsUtil from "../../smsUtil";
import screenNames from "../../constants/screenNames";

export default function ForgotPassword() {
  const { state, setState } = useContext(globalState);
  const { currentUser } = state;
  const [error, setError] = useState(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [codeFromInput, setCodeFromInput] = useState(null);
  const [codeSentToUser, setCodeSendToUser] = useState(null);
  const [showSendCodeButton, setShowSendCodeButton] = useState(true);

  const reset = async () => {
    validateInputs();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setState({ ...state, showError: true });
      return false;
    }
    await db.getTable(db.tables.users).then((people) => {
      if (people) {
        const foundUser = people.filter((x) => x.email === email && x.phone === phone)[0];
        // Verify security code
        if (foundUser !== null && foundUser !== undefined && Number(codeFromInput) === codeSentToUser) {
          // Update password
          db.updateRecord(db.tables.users, foundUser, "password", password).finally(() => {
            // Log user in
            setState({
              ...state,
              currentScreen: screenNames.calendar,
              currentUser: foundUser,
              userIsLoggedIn: true,
            });
          });
        }
      }
    });
  };

  const validateInputs = () => {
    if (util.validation([email, phone, confirmPassword, password]) > 0) {
      setError("Please fill out all fields");
      setState({ ...state, showError: true });
      return false;
    }
  };

  const sendSecurityCode = async () => {
    validateInputs();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setState({ ...state, showError: true });
      return false;
    }
    await db.getTable(db.tables.users).then((people) => {
      if (people) {
        const foundUser = people.filter((x) => x.email === email && x.phone === phone)[0];
        if (foundUser) {
          const code = util.createVerificationCode();
          setCodeSendToUser(code);
          setCodeFromInput(code);
          setShowSendCodeButton(false);
          SmsUtil.send(foundUser.phone, `Forgot password security code: ${code}${SmsUtil.signature}`);
        }
      }
    });
  };

  useEffect(() => {
    util.scrollToTopOfPage();
    setState({ ...state, currentScreenTitle: "Forgot Password" });
  }, []);

  return (
    <div id="forgot-password-container" className="page-container">
      <Error errorMessage={error} />
      <div className="form" autoComplete="off">
        <input value={phone} type="number" pattern="[0-9]*" inputMode="numeric" placeholder="Phone - required" onChange={(e) => setPhone(e.target.value)} />
        <input value={email} type="email" placeholder="Email - required" onChange={(e) => setEmail(e.target.value)} />
        <input value={password} type="password" autoComplete="off" placeholder="New Password - required" onChange={(e) => setPassword(e.target.value)} />
        <input value={confirmPassword} type="password" autoComplete="off" placeholder="Confirm New Password - required" onChange={(e) => setConfirmPassword(e.target.value)} />
        <input type="number" pattern="[0-9]*" inputMode="numeric" placeholder="Security Code Sent to Your Device - required" onChange={(e) => setCodeFromInput(e.target.value)} />
        {showSendCodeButton && (
          <>
            <button className="button send-security-code" onClick={sendSecurityCode}>
              Send Code to Me
            </button>
            <button className="button red" onClick={() => setState({ ...state, currentScreen: screenNames.login })}>
              Cancel
            </button>
          </>
        )}
        {!showSendCodeButton && (
          <button className="button green" onClick={reset}>
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
