import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Table } from 'semantic-ui-react'
import { getUserAction } from 'Utilities/redux/userReducer'
import QuizResults from 'Components/SubmissionView/QuizResults'
import SubmissionForm from 'Components/SubmissionView/SubmissionForm'
import OpenQuizzesList from 'Components/SubmissionView/OpenQuizzesList'
import CourseRegistration from 'Components/SubmissionView/CourseRegistration'
import CreditingLink from 'Components/SubmissionView/CreditingLink'

const SubmissionView = () => {
  const { user, course } = useSelector(({ user, course }) => ({ user, course }))
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(getUserAction())
  }, [])

  if (!user || !user.submissions) return null
  const courseName = (course.info || {}).name
  if (!courseName) return null
  const submissions = user.submissions.filter(s => s.courseName === courseName)

  const week = course.info ? course.info.week : 0

  const submissionForWeeks = submissions.map(s => s.week)

  const byPart = (p1, p2) => p1.week - p2.week

  const solutions = (part) => {
    if (part === 0) return <div>not available</div>
    return <Link to={`solutions/${part}`}>show</Link>
  }

  const maxWeek = Math.max(submissionForWeeks, week - 1)

  if (!user) return null

  const sum = (acc, cur) => acc + (cur || 0)
  const exerciseTotal = submissions.map(s => s.exercises.length).reduce(sum, 0)
  const hoursTotal = submissions.map(s => s.time).reduce(sum, 0)

  for (let week = 1; week <= maxWeek; week++) {
    if (!submissionForWeeks.includes(week)) {
      submissions.push({
        week,
        id: week,
        exercises: [],
      })
    }
  }

  const { completed } = ((user.courseProgress || []).find(c => c.courseName === courseName) || {})
  return (
    <div>
      <QuizResults />
      <OpenQuizzesList />
      <h3>My submissions</h3>
      <CreditingLink />
      {completed ? null : <SubmissionForm />}
      <Table celled>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>part</Table.HeaderCell>
            <Table.HeaderCell>exercises</Table.HeaderCell>
            <Table.HeaderCell>hours</Table.HeaderCell>
            <Table.HeaderCell>github</Table.HeaderCell>
            <Table.HeaderCell>comment</Table.HeaderCell>
            <Table.HeaderCell>solutions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {submissions.sort(byPart).map(s => (
            <Table.Row key={s.week}>
              <Table.Cell>{s.week}</Table.Cell>
              <Table.Cell>{s.exercises.length}</Table.Cell>
              <Table.Cell>{s.time}</Table.Cell>
              <Table.Cell><a href={`${s.github}`}>{s.github}</a></Table.Cell>
              <Table.Cell>{s.comment}</Table.Cell>
              <Table.Cell>
                {solutions(s.week)}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell>total</Table.HeaderCell>
            <Table.HeaderCell>{exerciseTotal}</Table.HeaderCell>
            <Table.HeaderCell>{hoursTotal}</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
          </Table.Row>
        </Table.Footer>
      </Table>
      <CourseRegistration />
    </div>
  )
}

export default SubmissionView
