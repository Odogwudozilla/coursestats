const mongoose = require('mongoose')

const extensionSchema = new mongoose.Schema({
  extensionFrom: String,
  extensionTo: String,
  github: String,
  fromUsername: String,
  username: String,
  courseName: String,
  extendsWith: Object,
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'StatsCourse' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'StatsUser' },
})

module.exports = extensionSchema
