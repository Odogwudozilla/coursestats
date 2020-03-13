const models = require('@db/models')

const getOne = async (req, res) => {
  const user = await req.currentUser.populate('submissions').execPopulate()
  const project = user.project && await models.Project.findById(user.project).populate('users').exec()
  res.send({
    ...req.currentUser.toJSON(),
    project: project && project.toJSON(),
  })
}

const update = async (req, res) => {
  const { studentNumber, name } = req.body

  req.currentUser.student_number = studentNumber || req.currentUser.student_number
  req.currentUser.name = name || req.currentUser.name

  await req.currentUser.save()
  res.send(200)
}


const setCourseCompleted = async (req, res) => {
  const { courseName } = req.params

  const progress = req.currentUser.getProgressForCourse(courseName)
  progress.completed = (new Date()).toISOString()
  req.currentUser.updateCourseProgress(progress)
  req.currentUser.ensureRandom(courseName)
  await req.currentUser.save()

  res.send(req.currentUser.toJSON())
}

const setCourseNotCompleted = async (req, res) => {
  const { courseName } = req.params

  const progress = req.currentUser.getProgressForCourse(courseName)
  progress.completed = false
  progress.oodi = false
  progress.suotarReady = false
  req.currentUser.updateCourseProgress(progress)
  await req.currentUser.save()
  res.send(200)
}

module.exports = {
  getOne,
  update,
  setCourseCompleted,
  setCourseNotCompleted,
}
