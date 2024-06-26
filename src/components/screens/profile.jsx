import React, { useState, useEffect, useContext } from "react";
import db from "../../db";
import globalState from "../../context";
import Error from "../shared/error";
import util from "../../util";
import SmsUtil from "../../smsUtil";
import screenNames from "../../constants/screenNames";

export default function Profile() {
  const { state, setState } = useContext(globalState);
  const { currentUser } = state;
  const [error, setError] = useState(null);

  useEffect(() => {
    util.scrollToTopOfPage();
    setState({ ...state, currentScreenTitle: `Your Profile` });
  }, []);

  return (
    <div id="profile-container" className="page-container">
      <Error errorMessage={error} />
      <div id="children-container">
        {currentUser &&
          currentUser.children &&
          currentUser.children.length > 0 &&
          currentUser.children.map((child, index) => {
            return (
              <div key={index} className="child">
                <ion-icon name="person-circle"></ion-icon>
                <span>{child}</span>
              </div>
            );
          })}
      </div>
      <div id="sections">
        <p className="section">
          <ion-icon name="person-outline"></ion-icon>My Profile<ion-icon class="go-arrow" name="chevron-forward-outline"></ion-icon>
        </p>
        <p className="section">
          <ion-icon name="people-outline"></ion-icon>Coparents<ion-icon class="go-arrow" name="chevron-forward-outline"></ion-icon>
        </p>
      </div>
    </div>
  );
}
