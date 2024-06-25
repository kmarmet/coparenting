import React, { useState, useEffect, useContext } from "react";
import Modal from "../shared/modal";
import CheckboxGroup from "../shared/checkboxGroup";
import screenNames from "../../constants/screenNames";
import globalState from "../../context";

export default function ConsentInfo() {
  const { state, setState } = useContext(globalState);
  const { currentUser } = state;
  return (
    <div id="consent-screen-container" className="page-container">
      <Modal hasClose={false} elClass="show">
        <div className="text">
          <h3>Co-Parenting Consent</h3>
          <p>To provide security of sensitive information, the app will not be usable until you and your coparent BOTH provide consent by entering the code you each sent/received via text upon registration.</p>
          <p>The code can be entered as soon as you (or your co-parent) login.</p>
        </div>

        <CheckboxGroup labels={["I Understand"]} onCheck={() => setState({ ...state, currentScreen: screenNames.registration })} />
      </Modal>
    </div>
  );
}
