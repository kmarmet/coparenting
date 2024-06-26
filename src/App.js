import React, { useEffect, useState } from "react";
import Dashboard from "./components/dashboard.jsx";
import { initializeApp } from "firebase/app";
import firebaseConfig from "./firebaseConfig.js";
import globalState from "./context.js";
import Registration from "./components/screens/registration.jsx";
import db from "./db";
import Login from "./components/screens/login.jsx";
import screenNames from "./constants/screenNames.js";
import ExpenseTracker from "./components/screens/expenseTracker.jsx";
import SwapRequests from "./components/screens/swapRequests.jsx";
import Menu from "./components/menu.jsx";
import { Divide as Hamburger } from "hamburger-react";
import SmsUtil from "./smsUtil.js";
import EventCalendar from "./components/screens/calendar.jsx";
import Modal from "./components/shared/modal.jsx";
import CoparentVerification from "./components/screens/coparentVerification.jsx";
import Error from "./components/shared/error.jsx";
import ConsentInfo from "./components/screens/consentInfo.jsx";
import ForgotPassword from "./components/screens/forgotPassword.jsx";
import Agreement from "./components/screens/agreement.jsx";
import UploadAgreement from "./components/screens/uploadAgreement.jsx";
import Profile from "./components/screens/profile.jsx";
import ReactPullToRefresh from "react-pull-to-refresh";
import moment from "moment";
const stateObj = {
  currentScreen: screenNames.login,
  setCurrentScreen: (screen) => {},
  menuIsOpen: false,
  setMenuIsOpen: (isOpen) => {},
  viewExpenseForm: false,
  setViewExpenseForm: (show) => {},
  currentScreenTitle: "Shared Calendar",
  viewSwapRequestForm: false,
  setViewSwapRequestForm: (show) => {},
  users: [],
  setUsers: (users) => {},
  userIsLoggedIn: false,
  setUserIsLoggedIn: (isLoggedIn) => {},
  showError: false,
  setShowError: (bool) => {},
  currentUser: {},
  setCurrentUser: (user) => {},
};

export default function App() {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const [state, setState] = useState(stateObj);
  const [showPwaSteps, setShowPwaSteps] = useState(false);
  const stateToUpdate = { state, setState };
  const { userIsLoggedIn, currentScreen, menuIsOpen, currentScreenTitle } = state;
  const [error, setError] = useState(null);

  const disablePwaSteps = () => {
    // console.log('ran')
    // db.updateRecord(db.tables.users, currentUser, "showPwaSteps", false);
  };

  const hideInstallAppArray = [screenNames.registration, screenNames.login, screenNames.consentInfo, screenNames.swapRequests, screenNames.forgotPassword, screenNames.profile];

  const checkScreenSize = () => {
    const screenWidth = window.innerWidth;
    if (screenWidth > 768) {
      setError(`This application is designed for mobile. Please launch the app on your mobile device (tablet/phone).`);
      setState({
        ...state,
        currentScreen: "error",
        userIsLoggedIn: false,
        showError: true,
      });
      return false;
    }
  };

  const onRefresh = () => {
    console.log("true");
    window.location.reload();
  };

  // Remember Me
  useEffect(() => {
    const rememberKey = localStorage.getItem("rememberKey");

    if (rememberKey !== null && rememberKey !== undefined && rememberKey.length > 0) {
      db.getTable(db.tables.users).then((people) => {
        if (people) {
          const user = people.filter((x) => x.id === rememberKey)[0];
          if (user && user.showPwaSteps) {
            setShowPwaSteps(user.showPwaSteps);
          }
          setState({
            ...state,
            currentScreen: screenNames.calendar,
            currentUser: user,
            userIsLoggedIn: true,
          });
        }
      });
    }
    checkScreenSize();
  }, []);

  return (
    <div className="App" id="app-container">
      <div className="loading">
        <span className="loading-ptr-1"></span>
        <span className="loading-ptr-2"></span>
        <span className="loading-ptr-3"></span>
      </div>
      <span className="genericon genericon-next"></span>
      <globalState.Provider value={stateToUpdate}>
        <ReactPullToRefresh onRefresh={onRefresh}>
          {error !== null && window.innerWidth > 768 && <Error className={error && error.length > 0 ? "desktop" : ""} errorMessage={error} canClose={false} />}
          <Error errorMessage={error} />
          {currentScreenTitle && currentScreenTitle.length > 0 && currentScreenTitle !== "error" && currentScreen !== screenNames.consentInfo && <p className="screen-title">{currentScreenTitle}</p>}
          <p id="pwa-steps" onClick={() => setShowPwaSteps(true)}>
            Install App
          </p>
          <Modal elClass={`pwa-modal ${showPwaSteps ? "show" : ""}`} onClose={() => setShowPwaSteps(false)}>
            <div className="os-container">
              <h1>
                iOS <ion-icon name="logo-apple"></ion-icon>
              </h1>
              <p>While viewing the website...</p>
              <ul>
                <li>
                  Tap the Share button (<ion-icon name="share-outline"></ion-icon>) in the menu bar
                </li>
                <li>
                  Scroll down the list of options, then tap <i>Add to Home Screen</i>
                </li>
                <li>If you don’t see Add to Home Screen, you can add it. Scroll down to the bottom of the list, tap Edit Actions, then tap Add to Home Screen.</li>
                <li>Click on the newly added icon on your Home Screen</li>
              </ul>
            </div>
            <div className="os-container">
              <h1>
                Android <ion-icon name="logo-android"></ion-icon>
              </h1>
              <p>While viewing the website...</p>
              <ul>
                <li>
                  Tap the menu icon (<ion-icon name="ellipsis-vertical"></ion-icon>)
                </li>
                <li>Tap Add to home screen</li>
                <li>Choose a name for the website shortcut</li>
                <li>Click on the newly added icon on your Home Screen</li>
              </ul>
            </div>
            {/* <button className="button" onClick={disablePwaSteps}>
              Do not show again <ion-icon name="checkmark-circle"></ion-icon>
            </button> */}
          </Modal>
          {currentScreen === screenNames.consentInfo && <ConsentInfo />}
          {currentScreen === screenNames.dashboard && <Dashboard />}
          {currentScreen === screenNames.login && <Login />}
          {currentScreen === screenNames.registration && <Registration />}
          {currentScreen === screenNames.expenseTracker && <ExpenseTracker />}
          {currentScreen === screenNames.swapRequests && <SwapRequests />}
          {currentScreen === screenNames.forgotPassword && <ForgotPassword />}
          {currentScreen === screenNames.uploadAgreement && <UploadAgreement />}
          {currentScreen === screenNames.calendar && <EventCalendar />}
          {currentScreen === screenNames.agreement && <Agreement />}
          {currentScreen === screenNames.profile && <Profile />}
          {currentScreen === screenNames.coparentVerification && <CoparentVerification />}
          {userIsLoggedIn && currentScreen !== screenNames.coparentVerification && (
            <div>
              <Menu />
              <div className="menu-icon-container">
                <Hamburger toggled={menuIsOpen} hideOutline={true} toggle={() => setState({ ...state, menuIsOpen: !menuIsOpen })} />
              </div>
            </div>
          )}
        </ReactPullToRefresh>
      </globalState.Provider>
    </div>
  );
}
