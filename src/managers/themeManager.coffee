
export default ThemeManager =
  colors:
#    accentDark: '#fc76ae'
#    accentLight: '#fc76ae'
#    bgDark: '#0a0a0a'
#    bgLight: 'white'
    borderColorDark: ''
    borderColorLight: '#f0f0f0'
    darkBlueOrLightGreyDark: '#121735'
    darkBlueOrLightGreyLight: '#f0f0f0'
    eventDetailsDark: '#2b356388'
    eventDetailsLight: '#F0F0F0'
    iconColorDark: "black"
    iconColorLight: 'white'
    lightOnDarkBgDark: '#2b356388'
    lightOnDarkBgLight: '#d5d7e0'
#    menuBgDark: 'black'
#    menuBgLight: 'whitesmoke'
#    modalBgDark: 'rgba(0, 0, 0, 0.7)'
#    modalBgLight: 'rgba(0, 0, 0, 0.2)'
#    pageContainerDark: '#121735',
#    pageContainerLight: '#121735'
#    purpleDark: '#6447f5'
#    purpleLight: '#6447f5'
#    shadowDark: "box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16),0 3px 6px rgba(0, 0, 0, 0.23)"
#    shadowLight: ""
#    starBgDark: '#0a0a0a'
#    starBgLight: '#0a0a0a'
    textColorWhiteDark: 'white'
    textColorWhiteLight: 'white'
    textColorDark: 'rgba(157,173,253,0.98)'
    textColorLight: '#3698fc'
    translucentDark: 'rgba(255, 255, 255, 0.2)'
    translucentLight: 'rgba(0, 0, 0, 0.1)'
    whiteOrBlackDark: 'white'
    whiteOrBlackLight: 'black'
    whiteOrBlueDark: 'rgba(157,173,253,0.98)'
    whiteOrBlueLight: 'cornflowerblue'
    whiteOrPurpleDark: '#af90fd'
    whiteOrPurpleLight: 'white'
  changeVariable: (variable, color) ->
    document.body.style.setProperty(variable, color)
#  changeTheme: (themeColor) ->
#    if themeColor is 'dark'
#      ThemeManager.changeVariable '--accent', ThemeManager.colors.accentDark
#      ThemeManager.changeVariable '--bgColor', ThemeManager.colors.bgDark
#      ThemeManager.changeVariable '--borderColor', ThemeManager.colors.borderColorDark
#      ThemeManager.changeVariable '--darkBlueOrLightGrey', ThemeManager.colors.darkBlueOrLightGreyDark
#      ThemeManager.changeVariable '--eventDetails', ThemeManager.colors.eventDetailsDark
#      ThemeManager.changeVariable '--iconColor', ThemeManager.colors.iconColorDark
#      ThemeManager.changeVariable '--lightOnDarkBg', ThemeManager.colors.lightOnDarkBgDark
#      ThemeManager.changeVariable '--menuBg', ThemeManager.colors.menuBgDark
#      ThemeManager.changeVariable '--modalBg', ThemeManager.colors.modalBgDark
#      ThemeManager.changeVariable '--pageContainer', ThemeManager.colors.pageContainerDark
#      ThemeManager.changeVariable '--purple', ThemeManager.colors.purpleDark
#      ThemeManager.changeVariable '--shadow', ThemeManager.colors.shadowDark
#      ThemeManager.changeVariable '--starBg', ThemeManager.colors.starBgDark
#      ThemeManager.changeVariable '--textColorWhite', ThemeManager.colors.textColorWhiteDark
#      ThemeManager.changeVariable '--textColor', ThemeManager.colors.textColorDark
#      ThemeManager.changeVariable '--translucent', ThemeManager.colors.translucentDark
#      ThemeManager.changeVariable '--whiteOrBlack', ThemeManager.colors.whiteOrBlackDark
#      ThemeManager.changeVariable '--whiteOrBlue', ThemeManager.colors.whiteOrBlueDark
#      ThemeManager.changeVariable '--whiteOrPurple', ThemeManager.colors.whiteOrPurpleDark
#    else
#      ThemeManager.changeVariable '--accent', ThemeManager.colors.accentLight
#      ThemeManager.changeVariable '--bgColor', ThemeManager.colors.bgLight
#      ThemeManager.changeVariable '--borderColor', ThemeManager.colors.borderColorLight
#      ThemeManager.changeVariable '--darkBlueOrLightGrey', ThemeManager.colors.darkBlueOrLightGreyLight
#      ThemeManager.changeVariable '--eventDetails', ThemeManager.colors.eventDetailsLight
#      ThemeManager.changeVariable '--iconColor', ThemeManager.colors.iconColorLight
#      ThemeManager.changeVariable '--lightOnDarkBg', ThemeManager.colors.lightOnDarkBgLight
#      ThemeManager.changeVariable '--menuBg', ThemeManager.colors.menuBgLight
#      ThemeManager.changeVariable '--pageContainer', ThemeManager.colors.pageContainerLight
#      ThemeManager.changeVariable '--purple', ThemeManager.colors.purpleDark
#      ThemeManager.changeVariable '--shadow', ThemeManager.colors.shadowLight
#      ThemeManager.changeVariable '--starBg', ThemeManager.colors.starBgLight
#      ThemeManager.changeVariable '--textColorWhite', ThemeManager.colors.textColorWhiteLight
#      ThemeManager.changeVariable '--textColor', ThemeManager.colors.textColorLight
#      ThemeManager.changeVariable '--translucent', ThemeManager.colors.translucentLight
#      ThemeManager.changeVariable '--whiteOrBlack', ThemeManager.colors.whiteOrBlackLight
#      ThemeManager.changeVariable '--whiteOrBlue', ThemeManager.colors.whiteOrBlueLight
#      ThemeManager.changeVariable '--whiteOrPurple', ThemeManager.colors.whiteOrPurpleLight


