const { express, JWT_SECRET_ADMIN, JWT_EXPIRY_ADMIN, z, jwt, bcrypt } = require('../config');
const { adminMiddleware } = require('../middlewares/adminMiddleware');
const { Course, Admin } = require('../db-store/db');
const { revokeToken } = require('../isRevoked');

const adminRouter = express.Router();

adminRouter.post('/signup', async (req, res) => {
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
    const findDuplicate = await Admin.findOne({
      email: req.body.email
    });
    if (findDuplicate) return res.status(403).json({
      msg: 'Sorry, this email already exists.'
    })
    const encryptPassword = await bcrypt.hash(req.body.password, 10);
    const admin = await Admin.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: encryptPassword,
      courses: []
    });
    const token = jwt.sign({
      id: admin._id
    }, JWT_SECRET_ADMIN, {
      expiresIn: JWT_EXPIRY_ADMIN
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

adminRouter.post('/login', async (req, res) => {
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
    const admin = await Admin.findOne({
      email: req.body.email
    });
    if(!admin) return res.status(401).json({
      msg: 'Unauthorized'
    });
    const isSame = await bcrypt.compare(req.body.password, admin.password);
    if(!isSame) return res.status(401).json({
      msg: 'Unauthorized'
    });
    const token = jwt.sign({
      id: admin._id
    }, JWT_SECRET_ADMIN, {
      expiresIn: JWT_EXPIRY_ADMIN
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

adminRouter.post('/make-course', adminMiddleware, async (req, res) => {
  try{
    const requiredBody = z.object({
      title: z.string().min(3).max(35),
      description: z.string().min(5).max(100),
      price: z.number().min(0).max(150000),
      imageUrl: z.string().min(5).max(2048),
    }).strict();
    const parsedDataWithSuccess = requiredBody.safeParse(req.body);
    if (!parsedDataWithSuccess.success) return res.status(403).json({
      msg: 'Incorrect Format',
      error: parsedDataWithSuccess.error
    });
    const course = await Course.create({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      imageUrl: req.body.imageUrl,
      instructors: []
    });
    res.status(200).json({
      msg: `Course created; Course ID: ${course._id}`
    });
  } catch(err){
    res.status(500).json({
      msg: `Sorry server is facing error: ${err}`
    });
  }
});

adminRouter.put('/update-price', adminMiddleware, async (req, res) => {
  try{
    const requiredBody = z.object({
      courseId: z.string().min(3).max(50),
      newPrice: z.number().min(0).max(150000)
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
    if (!course.instructors.includes(req.id)) return res.status(401).json({
      msg: `Sorry you do not teach the course ID: ${req.body.courseId}`,
    });
    course.price = req.body.newPrice;
    await course.save();
    res.status(200).json({
      msg: `Price updated to: ${req.body.newPrice}`
    });
  } catch(err){
    res.status(500).json({
      msg: `Sorry server is facing error: ${err}`
    });
  }
});

adminRouter.post('/add-instructor', adminMiddleware, async (req, res) => {
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
    const adminEntry = await Admin.findOne({
      _id: req.id
    });
    if (!adminEntry) return res.status(500).json({
      msg: 'Error from the server'
    });
    if (!course) return res.status(400).json({
      msg: `Unable to find the course with course ID: ${req.body.courseId}`
    });
    if (adminEntry.courses.includes(req.body.courseId)) return res.status(409).json({
      msg: `You are already the instructor of ${req.body.courseId}`
    });
    adminEntry.courses.push(req.body.courseId);
    course.instructors.push(req.id);
    await adminEntry.save();
    await course.save();
    res.status(200).json({
      msg: `You are now the instructor of ${req.body.courseId}`
    });
  } catch(err){
    res.status(500).json({
      msg: `Sorry server is facing error: ${err}`
    });
  }
});

adminRouter.get('/my-courses', adminMiddleware, async (req, res) => {
  try{
    const adminEntry = await Admin.findOne({
      _id: req.id
    });
    if (!adminEntry) return res.status(500).json({
      msg: 'Error from the server'
    });
    const courses = await Course.find({
      _id: {$in: adminEntry.courses}
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

adminRouter.get('/courses', adminMiddleware, async (req, res) => {
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

adminRouter.post('/logout', adminMiddleware, async (req, res) => {
  try{
    const response = await revokeToken(req.token, req.id, 'Admin');
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
  adminRouter
};