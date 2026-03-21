const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../entities/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('Không lấy được email từ Google'), null);

        // Tìm theo googleId trước
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Kiểm tra xem email đã đăng ký theo cách thường chưa
          user = await User.findOne({ email });

          if (user) {
            // Liên kết tài khoản Google vào tài khoản email cũ
            user.googleId = profile.id;
            user.provider = 'google';
            if (!user.avatarUrl) user.avatarUrl = profile.photos?.[0]?.value || null;
            await user.save();
          } else {
            // Tạo tài khoản mới từ Google
            user = await User.create({
              googleId: profile.id,
              email,
              displayName: profile.displayName || email.split('@')[0],
              fullName: profile.displayName,
              avatarUrl: profile.photos?.[0]?.value || null,
              provider: 'google',
              // passwordHash để null - tài khoản Google không cần password
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
