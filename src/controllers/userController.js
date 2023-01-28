import User from '../models/User';
import fetch from 'node-fetch';
import bcrypt from 'bcrypt';

export const getJoin = (req, res) => res.render('join', { pageTitle: 'Join' });
export const postJoin = async (req, res) => {
  const pageTitle = 'Join';
  const { name, email, username, password, password2, location } = req.body;

  if (password !== password2) {
    return res.status(400).render('join', {
      pageTitle,
      errorMessage: 'Password confirmation does not match.',
    });
  }

  const exists = await User.exists({ $or: [{ username }, { email }] });

  if (exists) {
    return res.status(400).render('join', {
      pageTitle,
      errorMessage: 'This username/email is already taken.',
    });
  }
  try {
    await User.create({
      name,
      email,
      username,
      password,
      location,
    });

    return res.redirect('/login');
  } catch (error) {
    return res.status(400).render('join', {
      pageTitle: 'Upload Video',
      errorMessage: error._message,
    });
  }
};

export const getLogin = (req, res) =>
  res.render('login', { pageTitle: 'Login' });

export const postLogin = async (req, res) => {
  const { username, password } = req.body;
  const pageTitle = 'Login';
  const user = await User.findOne({ username, socialOnly: false });
  if (!user) {
    return res.status(400).render('login', {
      pageTitle,
      errorMessage: 'An account with this username does not exists.',
    });
  }

  const ok = await bcrypt.compare(password, user.password);

  if (!ok) {
    return res.status(400).render('login', {
      pageTitle,
      errorMessage: 'Wrong password',
    });
  }
  req.session.loggedIn = true;
  req.session.user = user;
  return res.redirect('/');
};

export const startGithunLogin = (req, res) => {
  const baseUrl = 'https://github.com/login/oauth/authorize';
  const config = {
    client_id: process.env.GH_CLIENT,
    allow_signup: false,
    scope: 'read:user user:email',
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  return res.redirect(finalUrl);
};

export const finishGithubLogin = async (req, res) => {
  const baseUrl = 'https://github.com/login/oauth/access_token';
  const config = {
    client_id: process.env.GH_CLIENT,
    client_secret: process.env.GH_SECRET,
    code: req.query.code,
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  const tokenRequest = await (
    await fetch(finalUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
    })
  ).json();

  if ('access_token' in tokenRequest) {
    const { access_token } = tokenRequest;
    const apiUrl = 'https://api.github.com';
    const userData = await (
      await fetch(`${apiUrl}/user`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();

    const emailData = await (
      await fetch(`${apiUrl}/user/emails`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();

    const emailObj = emailData.find(
      (email) => email.primary === true && email.verified === true
    );

    if (!emailObj) {
      return res.redirect('/login');
    }

    let user = await User.findOne({ email: emailObj.email });

    if (!user) {
      user = await User.create({
        name: userData.name,
        avatarUrl: userData.avatar_url,
        username: userData.login,
        email: emailObj.email,
        password: '',
        socialOnly: true,
        location: userData.location,
      });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect('/');
  } else {
    return res.redirect('/login');
  }
};

export const startKakaoLogin = (req, res) => {
  const baseUrl = 'https://kauth.kakao.com/oauth/authorize';
  const config = {
    client_id: process.env.KAKAO_CLIENT,
    redirect_uri: 'https://wetube-clone-whdnd.fly.dev/users/kakao/finish',
    response_type: 'code',
    scope: 'profile_nickname,profile_image,account_email',
  };

  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  return res.redirect(finalUrl);
};

export const finishKakaoLogin = async (req, res) => {
  const baseUrl = 'https://kauth.kakao.com/oauth/token';
  const config = {
    grant_type: 'authorization_code',
    client_id: process.env.KAKAO_REST_API,
    redirect_uri: 'https://wetube-clone-whdnd.fly.dev/users/kakao/finish',
    code: req.query.code,
  };

  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  const tokenRequest = await (
    await fetch(finalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  ).json();

  if ('access_token' in tokenRequest) {
    const { access_token } = tokenRequest;
    const apiUrl = 'https://kapi.kakao.com/v2/user/me';

    const userData = await (
      await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
    ).json();

    const emailData = [
      await (
        await fetch(`${apiUrl}?property_keys=["kakao_account.email"]`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Bearer ${access_token}`,
          },
        })
      ).json(),
    ];

    const emailObj = emailData.find((email) => {
      const account = email.kakao_account;
      return (
        account.is_email_valid === true && account.is_email_verified === true
      );
    });

    if (!emailObj) {
      return res.redirect('/login');
    }

    let user = await User.findOne({ email: emailObj.kakao_account.email });

    if (!user) {
      const userProfile = userData.kakao_account.profile;
      user = await User.create({
        name: userProfile.nickname,
        avatarUrl: userProfile.profile_image_url,
        username: userProfile.nickname,
        email: emailObj.kakao_account.email,
        password: '',
        socialOnly: true,
      });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect('/');
  } else {
    return res.redirect('/login');
  }
};

export const logout = (req, res) => {
  req.flash('info', 'Bye Bye');
  req.session.destroy();
  return res.redirect('/');
};

export const getEdit = (req, res) => {
  res.render('edit-profile', { pageTitle: 'Edit Profile' });
};

export const postEdit = async (req, res) => {
  const {
    session: {
      user: { _id, username: sessionUserName, email: sessionEmail, avatarUrl },
    },
    body: { name, email, username, location },
    file,
  } = req;

  if (sessionEmail !== email || sessionUserName !== username) {
    const checkUser = await User.find({ $or: [{ email }, { username }] });

    const checkUserNum = checkUser.find((user) => {
      const { _id: userId } = user;
      return userId.toString() !== _id;
    });

    if (checkUserNum) {
      return res.status(400).render('edit-profile', {
        pageTitle: 'Edit Profile',
        errorMessage: 'Exist Email/UserName',
      });
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      avatarUrl: file ? file.location : avatarUrl,
      name,
      email,
      username,
      location,
    },
    { new: true }
  );
  req.session.user = updatedUser;
  return res.redirect('/users/edit');
};

export const getChangePassword = (req, res) => {
  if (req.session.user.socialOnly === true) {
    req.flash('error', `Can't change password`);
    return res.redirect('/');
  }
  return res.render('users/change-password', { pageTitle: 'Change Password' });
};

export const postChangePassword = async (req, res) => {
  const {
    session: {
      user: { _id, password },
    },
    body: { oldPassword, newPassword, newPasswordConfirmation },
  } = req;

  const ok = await bcrypt.compare(oldPassword, password);
  if (!ok) {
    return res.status(400).render('users/change-password', {
      pageTitle: 'Change Password',
      errorMessage: 'The current password is incorrect.',
    });
  }

  if (newPassword !== newPasswordConfirmation) {
    return res.status(400).render('users/change-password', {
      pageTitle: 'Change Password',
      errorMessage: 'The password does not match the confirmation',
    });
  }

  const user = await User.findById(_id);
  user.password = newPassword;
  await user.save();
  req.session.user.password = user.password;
  req.flash('info', 'Password updated');
  return res.redirect('/');
};

export const remove = (req, res) => res.send('Remove User');

export const see = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).populate({
    path: 'videos',
    populate: {
      path: 'owner',
      model: 'User',
    },
  });
  if (!user) {
    return res.status(404).render('404', { pageTitle: 'User not found.' });
  }

  return res.render('users/profile', { pageTitle: user.name, user });
};
