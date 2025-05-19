import React from 'react'
import {FaDirections} from 'react-icons/fa'
import {HiPhoneArrowUpRight} from 'react-icons/hi2'
import {MdEmail, MdWebAsset} from 'react-icons/md'
import {RiUserSharedFill} from 'react-icons/ri'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'
import Spacer from './spacer'

const DetailBlock = ({
  text,
  title,
  valueToValidate,
  classes = '',
  isFullWidth = false,
  isLink = false,
  isPhone = false,
  linkUrl = '',
  isNavLink = false,
  children,
  isCustom = false,
  isEmail = false,
  isInviteButton = false,
  onClick = () => {},
  topSpacerMargin = 0,
  bottomSpacerMargin = 0,
}) => {
  return (
    <>
      {Manager.IsValid(valueToValidate?.toString()) && (
        <div style={DomManager.AnimateDelayStyle(1)} className={`block ${classes} ${isFullWidth ? 'w-100 full-width' : ''}`}>
          {/* CUSTOM */}
          {isCustom && children}

          {/* STANDARD */}
          {!isCustom && (
            <>
              {/* TEXT */}
              {!isLink && !isPhone && !isNavLink && !isEmail && (
                <p className={StringManager.GetWordCount(text) < 10 ? 'block-text center' : 'block-text'}>{text}</p>
              )}

              {/*  LINK */}
              {isLink && (
                <>
                  <a href={linkUrl} target="_blank" className={'block-text website'} rel="noreferrer">
                    <MdWebAsset className={'website'} />
                  </a>
                  <Spacer height={2} />
                </>
              )}

              {/*  NAV LINK */}
              {isNavLink && !isLink && (
                <>
                  <Spacer height={topSpacerMargin > 0 ? topSpacerMargin : 0} />
                  <a href={Manager.GetDirectionsLink(linkUrl)} target="_blank" className={'block-text nav-link'} rel="noreferrer">
                    <FaDirections className={'nav-link'} />
                  </a>
                  <Spacer height={2} />
                </>
              )}

              {/*  INVITE BUTTON */}
              {!isNavLink && !isLink && !isPhone && isInviteButton && (
                <>
                  <Spacer height={topSpacerMargin > 0 ? topSpacerMargin : 0} />
                  <button onClick={onClick} className="block-text invite-button">
                    <RiUserSharedFill className={'invite-icon'} />
                  </button>
                  <Spacer height={2} />
                </>
              )}

              {/*  PHONE */}
              {isPhone && (
                <>
                  <Spacer height={topSpacerMargin > 0 ? topSpacerMargin : 0} />
                  <a href={`tel:${text}`} target="_blank" className={'block-text phone'} rel="noreferrer">
                    <HiPhoneArrowUpRight className={'phone'} />
                  </a>
                  <Spacer height={2} />
                </>
              )}

              {/*  EMAIL */}
              {isEmail && (
                <>
                  <Spacer height={topSpacerMargin > 0 ? topSpacerMargin : 0} />
                  <a href={`mailto:${text}`} target="_blank" className={'block-text email'} rel="noreferrer">
                    <MdEmail className={'email'} />
                  </a>
                  <Spacer height={2} />
                </>
              )}
            </>
          )}

          {/* TITLE */}
          <p className="block-title">{title}</p>
          <Spacer height={bottomSpacerMargin > 0 ? bottomSpacerMargin : 0} />
        </div>
      )}
    </>
  )
}

export default DetailBlock