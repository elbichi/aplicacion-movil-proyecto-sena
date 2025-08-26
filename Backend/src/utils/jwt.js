const jwt =  require('jsonwebtoken');

const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES|| '7d' }
    );
};

const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_SECRET || process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );
};


//verificar el token
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};
//decodifcar el token
const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    generateToken,
    generateRefreshToken,
    verifyToken,
    decodeToken
};
