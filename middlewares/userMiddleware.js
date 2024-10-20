const { jwt, JWT_SECRET_USER } = require('../config');
const { isRevoked } = require('../isRevoked');

function userMiddleware(req, res, next){
  const token = req.headers['auth-key'];
  jwt.verify(token, JWT_SECRET_USER, async (err, decoded) => {
    if(!err){
      const revoked = await isRevoked(token, decoded.id, 'User');
      if(revoked) return res.status(401).json({ msg: 'Unauthorized' });
      req.token = token;
      req.id = decoded.id
      next();
    } else {
      res.status(401).json({
        msg: 'Unauthorized'
      });
    }
  });
}

module.exports = {
  userMiddleware
};