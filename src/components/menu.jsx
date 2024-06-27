import React, { useState, useEffect, useContext } from "react";
import globalState from "../context";
import screenNames from "../constants/screenNames";
import util from "../util";
export default function Menu() {
  const { state, setState } = useContext(globalState);
  const { currentScreen, menuIsOpen, currentUser } = state;

  const changeCurrentScreen = (screen) => {
    setState({
      ...state,
      currentScreen: screen,
      menuIsOpen: false,
      viewExpenseForm: false,
      currentScreenTitle: util.uppercaseFirstLetterInWord([screen.replace(/([a-z])([A-Z])/, "$1 $2")]),
    });
  };

  const logout = () => {
    localStorage.removeItem("rememberKey");
    setState({
      ...state,
      currentScreen: screenNames.login,
      currentUser: null,
      userIsLoggedIn: false,
    });
  };

  useEffect(() => {
    if (menuIsOpen) {
      document.getElementById("menu").classList.add("open");
      document.querySelector(".menu-icon-container").classList.add("open");
      setState({ ...state, menuIsOpen: true });
    } else {
      document.getElementById("menu").classList.remove("open");
      document.querySelector(".menu-icon-container").classList.remove("open");
      setState({ ...state, menuIsOpen: false });
    }
  }, [menuIsOpen]);

  return (
    <div id="menu">
      <div id="menu-title">
        <div className="contents">
          <span className="title-icon material-icons-round">family_restroom</span>
          <p> Peaceful </p>
          <p>
            <span>co</span>Parenting
          </p>
        </div>
      </div>
      <div id="actions">
        <div className={`action ${currentScreen === screenNames.calendar ? "active" : ""}`} onClick={() => changeCurrentScreen(screenNames.calendar)}>
          <span className="material-icons-round">calendar_month</span>
          <p>Shared Calendar</p>
        </div>
        <div className={`action ${currentScreen === screenNames.expenseTracker ? "active" : ""}`} onClick={() => changeCurrentScreen(screenNames.expenseTracker)}>
          <span className="material-icons-round">paid</span>
          <p>Expense Tracker</p>
        </div>
        <div className={`action ${currentScreen === screenNames.swapRequests ? "active" : ""}`} onClick={() => changeCurrentScreen(screenNames.swapRequests)}>
          <span className="material-icons-round">swap_horizontal_circle</span>
          <p>Swap Requests</p>
        </div>
        <div className={`action ${currentScreen === screenNames.agreement ? "active" : ""}`} onClick={() => changeCurrentScreen(screenNames.agreement)}>
          <span className="material-icons-round">description</span>
          <p>View Agreement</p>
        </div>
        <div className={`action ${currentScreen === screenNames.profile ? "active" : ""}`} onClick={() => changeCurrentScreen(screenNames.profile)}>
          <span className="material-icons-round">manage_accounts</span>
          <p>Profile</p>
        </div>
        <div className={`action`} onClick={logout}>
          <span className="material-icons-round">logout</span> <p>Logout</p>
        </div>
        <p id="pwa-steps" onClick={() => setState({ ...state, showPwaSteps: true, menuIsOpen: false })}>
          Install App <span className="material-icons">install_mobile</span>
        </p>
      </div>
      {/* <div className={`action ${currentScreen === "memories" ? "active" : ""}`}>
        <ion-icon name="images-outline"></ion-icon>
        <p>Memories</p>
      </div>
      <div className={`action ${currentScreen === "infoBank" ? "active" : ""}`}>
        <ion-icon name="information-circle-outline"></ion-icon>
        <p>Info Bank</p>
      </div> */}
    </div>
  );
}
