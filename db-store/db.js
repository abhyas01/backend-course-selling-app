const { mongoose } = require('../config');
const Schema = mongoose.Schema;
const Model = mongoose.model;
const ObjectId = mongoose.ObjectId;

const UserSchema = new Schema({
  firstName: String,
  lastName: String,
  email: {type: String, unique: true},
  password: String,
  courses: [{type: ObjectId, ref: 'Course'}]
});

const CourseSchema = new Schema({
  title: String,
  description: String,
  price: Number,
  imageUrl: String,
  instructors: [{type: ObjectId, ref: 'Admin'}]
});

const AdminUserSchema = new Schema({
  firstName: String,
  lastName: String,
  email: {type: String, unique: true},
  password: String,
  courses: [{type: ObjectId, ref: 'Course'}]
});

const RevokedTokensSchema = new Schema({
  userId: {type: ObjectId, refPath: 'userType', unique: true},
  userType: {type: String, enum: ['User', 'Admin'], required: true},
  tokens: [{
    token: String,
    expiresAt: Date
  }]
});

const User = Model('User', UserSchema);
const Course = Model('Course', CourseSchema);
const Admin = Model('Admin', AdminUserSchema);
const RevokedTokens = Model('RevokedTokens', RevokedTokensSchema);

module.exports = {
  User,
  Course,
  Admin,
  RevokedTokens
};