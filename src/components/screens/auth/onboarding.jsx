import React, {useContext, useEffect, useState} from 'react'
import ScreenNames from '../../../constants/screenNames'
import globalState from '../../../context'
import Spacer from '../../shared/spacer'

const Onboarding = ({accountType}) => {
  const {state, setState} = useContext(globalState)
  const [screen, setScreen] = useState(1)

  useEffect(() => {
    console.log(accountType)
  }, [accountType])

  return (
    <div id="onboarding">
      <div className={screen === 1 ? 'active screen' : 'screen'}>
        <img src={require('../../../img/onboarding/welcome.gif')} alt="" />

        <div className="text-content">
          <Spacer height={10} />
          <p className="title">You Have Arrived!</p>
          <Spacer height={3} />
          {accountType === 'parent' && (
            <p className="text">
              Now you can dive into the world of peaceful co-parenting. You’ll be able to share important details such as expenses and visitation
              schedules with your co-parent(s).
            </p>
          )}
          {accountType === 'child' && <p className="text">Now you can dive in and share important details between you and your parent(s)</p>}
          <Spacer height={5} />
          {accountType === 'parent' && (
            <p className="text">If you have kids who use the app, you can share calendar events and other essential information with them too.</p>
          )}
        </div>
        <Spacer height={10} />
        <button onClick={() => setScreen(2)}>Next</button>
      </div>

      {/* SCREEN 2   */}
      <div className={screen === 2 ? 'active screen' : 'screen'}>
        <img src={require('../../../img/onboarding/calendar.gif')} alt="" />

        <div className="text-content">
          <Spacer height={10} />
          <p className="title">So How Does it Work?</p>
          <Spacer height={5} />
          <p className="text">
            In order to share with a {accountType === 'parent' ? 'co-parent' : 'child'}, you will need to add them to your profile.
          </p>
          <div className="steps">
            <ol>
              <li>
                Tap the <b>{accountType === 'parent' ? 'Co-Parents or Children' : 'Parents'}</b> menu option
              </li>
              <li>
                Tap <b>More</b> from the navigation bar
              </li>
              <li>
                Tap the <b>Add {accountType === 'parent' ? 'Co-Parent or Child' : 'Parent'}</b> option
              </li>
            </ol>
          </div>
          <Spacer height={5} />
          <p className="text">
            Once that is completed you can begin sharing with your {accountType === 'parent' ? 'co-parents and children' : 'parents'}.
          </p>
        </div>
        <Spacer height={10} />
        <button onClick={() => setState({...state, currentScreen: ScreenNames.login})}>Let&#39;s Go!</button>
      </div>
    </div>
  )
}

export default Onboarding