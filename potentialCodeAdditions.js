const calEventsForDay = Array.from(document.querySelectorAll('.event-details.visitation .title'))
calEventsForDay.forEach((eventElement) => {
  const eventDetails = eventElement.closest('.event-details')
  const titleText = eventElement.textContent
  const titleUserName = titleText.getFirstWord()
  const fromDate = eventDetails.getAttribute('data-from-date')

  // Get array indexes
  const previousDayIndex = scopedByVisitation.findIndex(
    (x) => x.fromDate === moment(fromDate).subtract(1, 'day').format('MM/DD/yyyy') && x.fromVisitationSchedule === true
  )
  const nextDayIndex = scopedByVisitation.findIndex(
    (x) => x.fromDate === moment(fromDate).add(1, 'day').format('MM/DD/yyyy') && x.fromVisitationSchedule === true
  )
  console.log(previousDayIndex, nextDayIndex)
  // Conditional appendage
  if (titleText.contains(titleUserName) && titleText.toLowerCase().contains('visitation')) {
    if (previousDayIndex > -1 && nextDayIndex === -1) {
      eventElement.textContent = eventElement.textContent.replace('- END', '')
      eventElement.textContent += '- END'
    } else {
      eventElement.textContent = eventElement.textContent.replace('- END', '')
    }
  }
})