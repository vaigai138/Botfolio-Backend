import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '3h', // Matches your frontend's 3-hour expiry
  });
};

export default generateToken;