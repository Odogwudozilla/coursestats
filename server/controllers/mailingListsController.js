const nodemailer = require('nodemailer')
const { UserInputError } = require('@util/customErrors')
const models = require('@db/models')

const getMailHtml = (body) => {
  return `
    <html>
      <head>
      </head>
      <body>
        ${body}
        <p>
          Don't want to receive these kind of news via email in the future? Opt out in your account's <a href="https://studies.cs.helsinki.fi/stats/myinfo">settings</a> in the submission system.
        </p>
      </body>
    </html>
  `
}

const TRANSPORT_SETTINGS = {
  host: 'smtp.helsinki.fi',
  port: 587,
  secure: false,
}

const TRANSPORT_DEFAULTS = {
  from: 'University of Helsinki <noreply@helsinki.fi>',
}

const transport = nodemailer.createTransport(
  TRANSPORT_SETTINGS,
  TRANSPORT_DEFAULTS,
)

const pause = (ms) => new Promise((res) => setTimeout(() => res(), ms))

const sendMail = async ({ to, from, html, subject }) => {
  const normalizedTo = to.slice(0, 2000)

  if (!html) {
    throw new UserInputError('Email html is required')
  }

  if (!subject) {
    throw new UserInputError('Email subject is required')
  }

  const normalizedHtml = getMailHtml(html)

  // eslint-disable-next-line no-restricted-syntax
  for (const email of normalizedTo) {
    // eslint-disable-next-line no-await-in-loop
    await transport.sendMail({ to: email, from, html: normalizedHtml, subject })
    // eslint-disable-next-line no-await-in-loop
    await pause(500)
  }
}

const sendToRecipients = async (req, res) => {
  const { to, from, html, subject } = req.body

  await sendMail({ to, from, html, subject })

  res.status(200)
}

const getForCourse = async (req, res) => {
  const { course } = req.params

  const usersInCourse = await models.Submission.find({
    courseName: course,
  }).distinct('user')

  const users = await models.User.find({
    _id: { $in: usersInCourse },
    email: { $exists: true },
    $or: [
      { newsletterSubscription: true },
      { newsletterSubscription: { $exists: false } },
    ],
  })

  const emails = users.map(({ email }) => email).filter(Boolean)

  res.send(emails)
}

module.exports = {
  getForCourse,
  sendToRecipients
}