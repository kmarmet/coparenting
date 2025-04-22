import React, {useContext, useState} from 'react'
import Spacer from '../shared/spacer'
import ScreenNames from '../../constants/screenNames'
import globalState from '../../context'

const Onboarding = () => {
  const {state, setState} = useContext(globalState)
  const [screen, setScreen] = useState(1)
  return (
    <div id="onboarding">
      <div className={screen === 1 ? 'active screen' : 'screen'}>
        <img src={require('../../img/onboarding/welcome.gif')} alt="" />

        <div className="text-content">
          <Spacer height={10} />
          <p className="title">You Have Arrived!</p>
          <Spacer height={3} />
          <p className="text">
            Now you can dive into the world of peaceful co-parenting. You’ll be able to share important details such as expenses and visitation
            schedules with your co-parent(s).
          </p>
          <Spacer height={5} />
          <p className="text">If you have kids who use the app, you can share calendar events and other essential information with them too.</p>
        </div>
        <Spacer height={10} />
        <button onClick={() => setScreen(2)}>Next</button>
      </div>

      {/* SCREEN 2   */}
      <div className={screen === 2 ? 'active screen' : 'screen'}>
        <img src={require('../../img/onboarding/calendar.gif')} alt="" />

        <div className="text-content">
          <Spacer height={10} />
          <p className="title">So How Does it Work?</p>
          <Spacer height={5} />
          <p className="text">In order to share with a co-parent or child you will need to add them to your profile.</p>
          <div className="steps">
            <ol>
              <li>
                Tap the <b>Co-Parents (or Child Info)</b> menu option
              </li>
              <li>
                Tap the <b>Actions</b> item from the navigation bar
              </li>
              <li>
                Tap the <b>Add Co-Parent (or Child) to Your Profile</b> option
              </li>
            </ol>
          </div>
          <Spacer height={5} />
          <p className="text">Once that is completed you can begin sharing with your co-parent(s) and children.</p>
        </div>
        <Spacer height={10} />
        <button onClick={() => setState({...state, currentScreen: ScreenNames.calendar})}>Let&#39;s Go!</button>
      </div>
    </div>
  )
}

export default Onboarding