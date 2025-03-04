import { Zoom } from 'react-awesome-reveal'
import React, { useContext, useEffect, useState } from 'react'

export default function ScreenTitle({ title }) {
  return (
    <Zoom direction={'up'} delay={0} duration={1200} className={'calendar-events-fade-wrapper'} cascade={false} triggerOnce={true}>
      <p className="screen-title">{title}</p>
    </Zoom>
  )
}