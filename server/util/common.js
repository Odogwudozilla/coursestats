const seedrandom = require('seedrandom')
const moment = require('moment-timezone')

const common = require('@root/config/common')
const ADMINS = require('@assets/admins.json')
const quizData = require('@assets/quiz.json')

const { JWT_SECRET } = process.env

const GITHUB = {
  id: process.env.GITHUB_ID,
  secret: process.env.GITHUB_SECRET,
  callback: process.env.GITHUB_CALLBACK,
  state: process.env.GITHUB_STATE,
  redirect: process.env.GITHUB_REDIRECT,
}

// Fisher-Yates Shuffle
const shuffle = (originalArray, seedString = '') => {
  const array = [...originalArray]
  const getRandoms = seedrandom(seedString)
  let counter = array.length

  // While there are elements in the array
  while (counter > 0) {
    // Pick a random index
    const index = Math.floor(getRandoms() * counter)
    // Decrease counter by 1
    counter--

    // And swap the last element with it
    const temp = array[counter]
    array[counter] = array[index]
    array[index] = temp
  }

  return array
}

const getAcualDeadline = (course, part) => {
  const deadlineHuman = ((course.parts || {})[part] || {}).close
  if (!deadlineHuman) return undefined

  const acualDeadline = moment.tz(`${deadlineHuman} 23:59`, 'DD.MM.YYYY HH:mm', 'Europe/Helsinki').toDate() // Is acually UTC 0 because server
  return acualDeadline
}

const getAcualOpening = (course, part) => {
  const openingHuman = ((course.parts || {})[part] || {}).open
  if (!openingHuman) return undefined

  const acualOpening = moment.tz(`${openingHuman} 00:01`, 'DD.MM.YYYY HH:mm', 'Europe/Helsinki').toDate() // Is acually UTC 0 because server
  return acualOpening
}

const beforeDeadline = (course, part) => {
  if (!course) return false

  const deadline = getAcualDeadline(course, part)
  if (!deadline) return true

  const now = moment.tz('Europe/Helsinki').toDate()
  return deadline.getTime() > now.getTime()
}

const afterOpen = (course, part) => {
  if (!course) return false

  const opens = getAcualOpening(course, part)
  if (!opens) return true

  const now = moment.tz('Europe/Helsinki').toDate()
  return opens.getTime() < now.getTime()
}


const sortAdminsByUser = () => {
  return Object.keys(ADMINS).reduce((acc, cur) => {
    if (cur === 'superadmins') {
      ADMINS[cur].forEach((uid) => {
        if (!acc[uid]) acc[uid] = []
        acc[uid].push({ group: cur })
      })
      return acc
    }

    ADMINS[cur].access.forEach((user) => {
      if (!acc[user.uid]) acc[user.uid] = []
      acc[user.uid].push({ group: cur, pages: user.pages })
    })
    return acc
  }, {})
}

const ADMINS_BY_COURSE = ADMINS
const ADMINS_BY_USER = sortAdminsByUser()
const getAdminsForACourse = (courseName) => {
  const courseAdmins = ADMINS_BY_COURSE[courseName]
  if (!courseAdmins || !courseAdmins.access) return []

  return courseAdmins.access.map(user => user.uid)
}

const isAdmin = (username, courseName) => {
  if (!courseName) return ADMINS.superadmins.includes(username.toLowerCase())

  return [...ADMINS.superadmins, ...getAdminsForACourse(courseName)].includes(username.toLowerCase())
}

const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo:mongo@studies_db/mongo'
const PORT = process.env.PORT || 8000
const SHIBBOLETH_HEADERS = [
  'uid',
  'givenname', // First name
  'mail', // Email
  'schacpersonaluniquecode', // Contains student number
  'sn', // Last name
]

const getQuizScoreInPart = (quizAnswers = [], courseName, part) => {
  const SCORING_START = 0.45
  const courseId = quizData.courses.find(c => c.name === courseName).id
  const questionsInPart = quizData.questions.filter(q => String(part) === String(q.part) && Number(courseId) === Number(q.courseId))
  const amountTotal = questionsInPart.map(question => question.options.length).reduce((a, b) => a + b, 0)

  const zeroPoint = amountTotal * SCORING_START

  let amountRight = 0
  questionsInPart.forEach((question) => {
    question.options.forEach((option) => { // For each option in each question
      const optionsInQuestion = quizAnswers.filter(a => Number(a.questionId) === Number(question.id))
      const studentCheckedThis = common.multipleChoiceOptionChosen(optionsInQuestion, option.text)

      // Student has to have checked in the new spec, if we go in here it's in the old spec
      if (!studentCheckedThis) {
        if (option.right === true) return

        amountRight++
        return
      }

      // chosenValue was not used in the spec, we understand it as "I think this is a true statement"
      if (studentCheckedThis.chosenValue === undefined || studentCheckedThis.chosenValue === null) {
        if (option.right === false) return

        amountRight++
        return
      }

      // if chosenValue is true and option is not right return
      // if chosenValue is false and option is right return
      if (studentCheckedThis.chosenValue !== option.right) return

      amountRight++
    })
  })

  const pointsCalculated = Math.max(amountRight - zeroPoint, 0) / (amountTotal - zeroPoint)

  return {
    right: amountRight,
    total: amountTotal,
    points: Number(pointsCalculated.toFixed(2)),
  }
}

module.exports = {
  ...common,
  GITHUB,
  JWT_SECRET,
  SHIBBOLETH_HEADERS,
  MONGO_URL,
  PORT,
  ADMINS_BY_COURSE,
  ADMINS_BY_USER,
  getAdminsForACourse,
  isAdmin,
  getQuizScoreInPart,
  getAcualDeadline,
  getAcualOpening,
  afterOpen,
  beforeDeadline,
  shuffle,
}
