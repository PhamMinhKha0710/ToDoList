class TokenService {
  constructor({ jwt, JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRES, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES }) {
    this.jwt = jwt;
    this.JWT_ACCESS_SECRET = JWT_ACCESS_SECRET;
    this.JWT_ACCESS_EXPIRES = JWT_ACCESS_EXPIRES;
    this.JWT_REFRESH_SECRET = JWT_REFRESH_SECRET;
    this.JWT_REFRESH_EXPIRES = JWT_REFRESH_EXPIRES;
  }

  generateAccessToken(payload, options = {}) {
    return this.jwt.sign(payload, this.JWT_ACCESS_SECRET, {
      expiresIn: this.JWT_ACCESS_EXPIRES,
      ...options,
    });
  }

  generateRefreshToken(payload) {
    return this.jwt.sign(payload, this.JWT_REFRESH_SECRET, { expiresIn: this.JWT_REFRESH_EXPIRES });
  }

  verifyAccessToken(token) {
    return this.jwt.verify(token, this.JWT_ACCESS_SECRET);
  }

  verifyRefreshToken(token) {
    return this.jwt.verify(token, this.JWT_REFRESH_SECRET);
  }
}

module.exports = TokenService;
