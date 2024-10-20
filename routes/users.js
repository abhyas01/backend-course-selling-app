const { express, JWT_SECRET_USER, JWT_EXPIRY_USER, z, jwt, bcrypt } = require('../config');
const { userMiddleware } = require('../middlewares/userMiddleware');
const { revokeToken } = require('../isRevoked');
const { User, Course } = require('../db-store/db');

const userRouter = express.Router();

userRouter.post('/signup', async (req, res) => {
  try{
    const requiredBody = z.object({
      firstName: z.string().min(2).max(100),
      lastName: z.string().min(2).max(100),
      email: z.string().min(6).max(80).email(),
      password: z.string().min(6).max(30).refine((value) => {
        const hasOneUpper = [...value].some(char => char >= 'A' && char <= 'Z');
        const hasOneLower = [...value].some(char => char >= 'a' && char <= 'z');
        const hasOneSpl = [...value].some(char => '!@#$%^&*()'.includes(char));
        return hasOneUpper && hasOneLower && hasOneSpl;
      }, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one special character (!@#$%^&*())'
      })
    }).strict();
    const parsedDataWithSuccess = requiredBody.safeParse(req.body);
    if (!parsedDataWithSuccess.success) return res.status(403).json({
      msg: 'Incorrect Format',
      error: parsedDataWithSuccess.error
    });
    const findDuplicate = await User.findOne({
      email: req.body.email
    });
    if (findDuplicate) return res.status(403).json({
      msg: 'Sorry, this email already exists.'
    })
    const encryptPassword = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: encryptPassword,
      courses: []
    });
    const token = jwt.sign({
      id: user._id
    }, JWT_SECRET_USER, {
      expiresIn: JWT_EXPIRY_USER
    });
    res.status(200).json({
      token
    });
  } catch(err){
    res.status(500).json({
      msg: `Sorry server is facing error: ${err}`
    });
  }
});

userRouter.post('/login', async (req, res) => {
  try{
    const requiredBody = z.object({
      email: z.string().min(6).max(80).email(),
      password: z.string().min(6).max(30)
    }).strict();
    const parsedDataWithSuccess = requiredBody.safeParse(req.body);
    if (!parsedDataWithSuccess.success) return res.status(403).json({
      msg: 'Incorrect Format',
      error: parsedDataWithSuccess.error
    });
    const user = await User.findOne({
      email: req.body.email
    });
    if(!user) return res.status(401).json({
      msg: 'Unauthorized'
    });
    const isSame = await bcrypt.compare(req.body.password, user.password);
    if(!isSame) return res.status(401).json({
      msg: 'Unauthorized'
    });
    const token = jwt.sign({
      id: user._id
    }, JWT_SECRET_USER, {
      expiresIn: JWT_EXPIRY_USER
    });
    res.status(200).json({
      token
    });
  } catch(err){
    res.status(500).json({
      msg: `Sorry server is facing error: ${err}`
    });
  }
});

userRouter.post('/buy-course', userMiddleware, async (req, res) => {
  try{
    const requiredBody = z.object({
      courseId: z.string().min(3).max(50)
    }).strict();
    const parsedDataWithSuccess = requiredBody.safeParse(req.body);
    if (!parsedDataWithSuccess.success) return res.status(403).json({
      msg: 'Incorrect Format',
      error: parsedDataWithSuccess.error
    });
    let course;
    try {
      course = await Course.findOne({ _id: req.body.courseId });
    } catch (err) {
      if (err.name === 'CastError') {
        return res.status(400).json({
          msg: `Unable to find the course with course ID: ${req.body.courseId}`
        });
      }
      throw err;
    }
    const userEntry = await User.findOne({
      _id: req.id
    });
    if (!userEntry) return res.status(500).json({
      msg: 'Error from the server'
    });
    if (!course) return res.status(400).json({
      msg: `Unable to find the course with course ID: ${req.body.courseId}`
    });
    if (userEntry.courses.includes(req.body.courseId)) return res.status(409).json({
      msg: `You have already purchased the courseId: ${req.body.courseId}`
    });
    userEntry.courses.push(req.body.courseId);
    await userEntry.save();
    res.status(200).json({
      msg: `You purchased the courseId: ${req.body.courseId}`
    });
  } catch(err){
    res.status(500).json({
      msg: `Sorry server is facing error: ${err}`
    });
  }
});

userRouter.get('/my-courses', userMiddleware, async (req, res) => {
  try{
    const userEntry = await User.findOne({
      _id: req.id
    });
    if (!userEntry) return res.status(500).json({
      msg: 'Error from the server'
    });
    const courses = await Course.find({
      _id: {$in: userEntry.courses}
    });
    res.status(200).json({
      courses: courses
    });
  } catch(err){
    res.status(500).json({
      msg: `Sorry server is facing error: ${err}`
    });
  }
});

userRouter.get('/courses', userMiddleware, async (req, res) => {
  try{
    const courses = await Course.find({},
      'title description price imageUrl instructors -_id').populate({
        path: 'instructors',
        select: 'firstName lastName email -_id'
      });
    res.status(200).json({
      courses: courses
    });
  } catch(err){
    res.status(500).json({
      msg: `Sorry server is facing error: ${err}`
    });
  }
});

userRouter.post('/logout', userMiddleware, async (req, res) => {
  try{
    const response = await revokeToken(req.token, req.id, 'User');
    if(response){
      res.status(200).json({
        msg: 'Logged out successfully.'
      });
    } else{
      res.status(500).json({
        msg: 'Server error, could not log you out'
      });
    }
  } catch(err){
    res.status(500).json({
      msg: `Sorry server is facing error: ${err}`
    });
  }
});

module.exports = {
  userRouter
};