import React from 'react'

import {
  Form,
  Input,
  Checkbox,
  Button,
  Message,
  Segment,
} from 'semantic-ui-react'

import { connect } from 'react-redux'
import userService from 'Services/user'

import {
  setNotification,
  clearNotification,
  setError,
} from 'Utilities/redux/notificationReducer'

import { submission } from 'Utilities/redux/userReducer'

class SubmissionForm extends React.Component {
  componentWillMount() {
    this.clearForm()
  }

  setAllTo = (to) => () => {
    const state = {}
    for (let i = 1; i <= 40; i++) {
      state[`e${i}`] = to
    }
    this.setState(state)
  }

  handleSubmit = async (e) => {
    e.preventDefault()

    const {
      setError,
      clearNotification,
      exerciseCount,
      part,
      course,
      submission: doSubmission,
      setNotification,
    } = this.props

    const { comments, hours, github, isSubmitting } = this.state

    if (isSubmitting) {
      return
    }

    this.setState({ isSubmitting: true })

    if (!this.formValid()) {
      setError('hours and github must be set')

      setTimeout(() => {
        clearNotification()
      }, 8000)

      this.setState({ isSubmitting: false })

      return
    }

    const exercises = []

    for (let i = 1; i <= exerciseCount; i++) {
      if (this.state[`e${i}`] === true) {
        exercises.push(i)
      }
    }

    const week = part

    const submission = {
      comments,
      hours,
      github,
      exercises,
      week,
    }

    const done = exercises.length
    const message =
      done < 2
        ? `You have only ${done} exercise marked. Note that you should to check each exercise that you have completed! Are you absolutely sure you want to do the submission?`
        : `You have marked total of ${done} exercises: ${exercises.join(
            ', ',
          )} and set repository address to ${github}. Are you sure to submit?`

    const ok = window.confirm(message)
    if (ok) {
      const result = await userService.submitExercises(submission, course)

      doSubmission(result)
      setNotification(`exercises for part ${week} submitted`)

      setTimeout(() => {
        clearNotification()
      }, 8000)

      this.clearForm()

      this.setState({ isSubmitting: false })
    } else {
      this.setState({ isSubmitting: false })
    }
  }

  handleChange = (e) => {
    const value = e.target.name[0] === 'e' ? e.target.checked : e.target.value
    this.setState({ [e.target.name]: value })
  }

  formValid() {
    const { hours, github } = this.state
    const { course, part } = this.props
    const akateemisetTaidot = course.includes('akateemiset-taidot')

    return (
      akateemisetTaidot ||
      (course === 'tdd-2022' && part === 5) ||
      (hours > 0 &&
        github.length > 24 &&
        github.indexOf('https://github.com/') === 0 &&
        github.indexOf(
          'https://github.com/username/put_your_repositry_name_here',
        ) === -1 &&
        !github.endsWith('/put_your_repositry_name_here'))
    )
  }

  clearForm() {
    const { user } = this.props

    let githubUsername = 'username'
    const studies = window.location.href.includes('studies.cs.helsinki.fi/')
    if (studies) {
      githubUsername = user.username
    } else if (user.submissions.length > 0) {
      const githubUrl = user.submissions[0].github.slice(19)
      githubUsername = githubUrl.slice(0, githubUrl.indexOf('/'))
    }

    const state = {
      hours: '',
      github: `https://github.com/${githubUsername}/put_your_repositry_name_here`,
      comments: '',
      visible: false,
      plagiarism: false,
    }

    for (let i = 1; i <= 40; i++) {
      state[`e${i}`] = false
    }

    this.setState(state)
  }

  renderExerciseCheckboxes() {
    const { exerciseCount } = this.props

    const exercises = [...Array(exerciseCount)].map((v, i) => i + 1)

    return (
      <div>
        {exercises.map((exercise) => {
          const { [`e${exercise}`]: checked = false } = this.state
          const id = `exerciseCheckbox-${exercise}`

          return (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                marginTop: '3px',
                marginBottom: '3px',
                marginRight: '16px',
                borderStyle: 'dotted',
                borderRadius: 5,
                borderWidth: 'thin',
                padding: 3,
              }}
              key={id}
            >
              <input
                onChange={(event) => {
                  const { checked } = event.target

                  this.setState((prevState) => ({
                    ...prevState,
                    [`e${exercise}`]: checked,
                  }))
                }}
                checked={checked}
                name={`e${exercise}`}
                id={id}
                type="checkbox"
              />
              <label htmlFor={id} style={{ paddingLeft: '8px' }}>
                {exercise}
              </label>
            </div>
          )
        })}
      </div>
    )
  }

  render() {
    const { exerciseCount, part, coursePartCount, course } = this.props
    const { visible, plagiarism, isSubmitting } = this.state
    const akateemisetTaidot = course.includes('akateemiset-taidot')

    const canCreateNextPartSubmission = part < coursePartCount

    if (exerciseCount === 0 && part === 8) {
      return (
        <Message>
          Parts 8-13 are submitted in their own instances, please see the course
          material for right submission links
        </Message>
      )
    }

    if (exerciseCount === 0) {
      return (
        <Message>Submitting exercises for part {part} not yet possible</Message>
      )
    }

    if (visible === false && canCreateNextPartSubmission) {
      return (
        <Button fluid onClick={() => this.setState({ visible: true })}>
          Create submission for part {part}
        </Button>
      )
    }

    if (visible && plagiarism === false) {
      return (
        <Segment>
          <p>
            Kurssilla seurataan Helsingin yliopiston opintokäytäntöjä.
            Plagiarismi ja opintovilppi, eli esimerkiksi netissä olevien tai
            kaverilta saatujen vastausten kopiointi ja niiden palauttaminen
            omana työnä on kiellettyä. Todettu opintovilppi johtaa
            kurssisuorituksen hylkäämiseen ja toistuva opintovilppi voi johtaa
            opinto-oikeuden määräaikaiseen menettämiseen. Lue lisää osoitteessa{' '}
            <a href="https://guide.student.helsinki.fi/fi/artikkeli/mita-ovat-vilppi-ja-plagiointi">
              https://guide.student.helsinki.fi/fi/artikkeli/mita-ovat-vilppi-ja-plagiointi
            </a>
          </p>
          <p>
            Plagiarism, such as copying answers from the web or from a friend,
            and returning them as one's own work is prohibited. Read more{' '}
            <a href="https://guide.student.helsinki.fi/en/article/what-cheating-and-plagiarism">
              https://guide.student.helsinki.fi/en/article/what-cheating-and-plagiarism
            </a>
          </p>

          <Form>
            <Form.Field>
              <Checkbox
                onClick={() => this.setState({ plagiarism: true })}
                label="I have read the above and agree not to present other people's code as my own solutions. Olen lukenut ja ymmärtänyt ylläolevan opintovilppiin liittyvän tekstin ja tiedän opintovilpin seuraukset. En aio esittää muiden vastauksia omina vastauksinani."
              />
            </Form.Field>
          </Form>
        </Segment>
      )
    }

    return canCreateNextPartSubmission ? (
      <div>
        <h3>
          Create a submission for part
          {this.props.part}
        </h3>

        <Form onSubmit={this.handleSubmit}>
          <Form.Field>
            <label style={{ marginBottom: '8px' }}>
              Mark all exercises you have done (check the box if the exercise is
              done)
            </label>
            {this.renderExerciseCheckboxes()}
            {!akateemisetTaidot && (
              <div style={{ marginTop: '16px' }}>
                <Button size="tiny" type="button" onClick={this.setAllTo(true)}>
                  Mark all
                </Button>
                <Button
                  size="tiny"
                  type="button"
                  onClick={this.setAllTo(false)}
                >
                  Clear all
                </Button>
              </div>
            )}
          </Form.Field>

          {!akateemisetTaidot && (
            <>
              <Form.Field>
                <label htmlFor="exerciseHours">
                  Used hours (reading the material and completing exercises)
                </label>
                <Input
                  type="number"
                  id="exerciseHours"
                  value={this.state.hours}
                  name="hours"
                  onChange={this.handleChange}
                />
              </Form.Field>
              <Form.Field>
                <label htmlFor="exerciseGithub">GitHub repository</label>
                <Input
                  value={this.state.github}
                  name="github"
                  id="exerciseGithub"
                  onChange={this.handleChange}
                />
              </Form.Field>
              <Form.Field>
                <label htmlFor="exerciseComments">Comments</label>
                <Form.TextArea
                  value={this.state.comments}
                  name="comments"
                  id="exerciseComments"
                  onChange={this.handleChange}
                />
              </Form.Field>
              <Message info>
                Pressing send will submit this whole part. Any exercises you
                have not marked done above for this part can{' '}
                <strong>not</strong> be marked done later. If you by accident
                submit the wrong number of exercises contact the course teacher
                or Discord admins.
              </Message>
            </>
          )}
          <Button disabled={isSubmitting} primary>
            Send
          </Button>
          <Button onClick={() => this.setState({ visible: false })}>
            Cancel
          </Button>
        </Form>
      </div>
    ) : null
  }
}

const mapStateToProps = ({ user, course }) => {
  if (!user || !course.info) {
    return {
      exerciseCount: 0,
      part: 0,
      username: null,
    }
  }

  const submissionForCourse = user.submissions.filter(
    (s) => s.courseName === course.info.name,
  )

  const extensionForCourse = user.extensions
    ? user.extensions.find(
        (e) => e.to === course.info.name || e.courseName === course.info.name,
      )
    : null

  const extendSubmissions = extensionForCourse
    ? extensionForCourse.extendsWith
    : []

  const max = Math.max(
    -1,
    ...submissionForCourse.map((s) => s.week),
    ...extendSubmissions.map((s) => s.part),
  )

  const { week } = course.info

  let part = max + 1

  if (part < week) {
    part = week
  }

  return {
    user,
    exerciseCount: course.info.exercises[part],
    part,
    coursePartCount: course.info.exercises ? course.info.exercises.length : 0,
    course: course.info.name,
  }
}

export default connect(mapStateToProps, {
  setNotification,
  clearNotification,
  setError,
  submission,
})(SubmissionForm)
