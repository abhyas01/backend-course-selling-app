const { express, mongoose, cors, MONGO_URL } = require('./config');
const { userRouter } = require('./routes/users');
const { adminRouter } = require('./routes/admin');

const app = express();

app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:6500']
}));
app.use('/api/v1/user', userRouter);
app.use('/api/v1/admin', adminRouter);

(async function(){
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to Database');
    app.listen(3000, () => {
      console.log('Server listening on port 3000');
    });
  } catch (err) {
    console.error('Database connection failed:', err);
  }
})();