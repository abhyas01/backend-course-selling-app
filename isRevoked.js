const { RevokedTokens } = require('./db-store/db');

async function revokeToken(token, userId, userType) {
  try{
    const tokenExpiry = userType === 'Admin' ? 86400 : 2160000;
    const expiryDate = new Date(Date.now() + tokenExpiry * 1000);
    let revokedTokenDoc = await RevokedTokens.findOne({
      userId: userId,
      userType: userType
    });
    if(revokedTokenDoc){
      revokedTokenDoc.tokens.push({
        token: token,
        expiresAt: expiryDate
      });
      await revokedTokenDoc.save();
    } else {
      revokedTokenDoc = await RevokedTokens.create({
        userId: userId,
        userType: userType,
        tokens: [{
          token: token,
          expiresAt: expiryDate
        }]
      });
    }
    return true;
  } catch(err){
    return false;
  }
}

async function isRevoked(token, userId, userType){
  try{
    const revokedTokenDoc = await RevokedTokens.findOne({
      userId: userId,
      userType: userType
    });
    if(revokedTokenDoc){
      revokedTokenDoc.tokens = revokedTokenDoc.tokens.filter(t => t.expiresAt > new Date());
      await revokedTokenDoc.save();
      return revokedTokenDoc.tokens.some(t => t.token === token);
    } else{
      return false;
    }
  } catch(err) {
    return true;
  }
}

module.exports = {
  revokeToken,
  isRevoked
};