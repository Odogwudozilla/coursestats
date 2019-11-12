import React, { useState } from 'react'
import { Button } from 'semantic-ui-react'
import { useSelector, useDispatch } from 'react-redux'
import quizService from 'Services/quiz'
import Notification from 'Components/Notification'
import Question from 'Components/CourseQuizView/Question'
import { getUserAction } from 'Utilities/redux/userReducer'

const QuestionList = ({ part, questions, locked }) => {
  const dispatch = useDispatch()
  const { course, user } = useSelector(({ course, user }) => ({ course, user }))
  const { name } = course.info
  const [notification, setNotification] = useState({ text: '', type: 'success' })

  const lockAnswers = async () => {
    try {
      await quizService.lockQuiz(name, part)
      setNotification({ text: 'Successfully locked answers', type: 'success' })
      dispatch(getUserAction())
    } catch (err) {
      setNotification({ text: `Failed: ${err.response.data.error}`, type: 'failure' })
    }
    setTimeout(() => setNotification({ text: undefined }), 5000)
  }

  const previousAnswers = (((user.quizAnswers || {})[name] || {})[part] || {}).answers || []
  const notAnsweredAll = questions.find(q => q.options.find(op => !previousAnswers.find(p => p.text === op.text)))

  return (
    <>
      <Notification notification={notification} />
      {questions.map(question => (
        <Question
          locked={locked}
          key={question.id}
          question={question}
          previousAnswers={previousAnswers.filter(answer => answer.questionId === question.id)}
        />
      ))}
      <Notification notification={notification} />
      {locked ? null
        : <Button disabled={notAnsweredAll} onClick={lockAnswers}>Lock and submit answers</Button>
      }
      {!locked && notAnsweredAll && 'Make sure to answer all of the questions'}

    </>
  )
}

export default QuestionList
