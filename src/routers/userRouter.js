import express from 'express';
import {
  getEdit,
  postEdit,
  logout,
  see,
  startGithunLogin,
  finishGithubLogin,
  startKakaoLogin,
  finishKakaoLogin,
  getChangePassword,
  postChangePassword,
} from '../controllers/userController';
import {
  avatarUpload,
  protectedMiddleware,
  publicOnlyMiddleware,
} from '../middleware';

const userRouter = express.Router();

userRouter.get('/github/start', publicOnlyMiddleware, startGithunLogin);
userRouter.get('/github/finish', publicOnlyMiddleware, finishGithubLogin);
userRouter.get('/kakao/start', publicOnlyMiddleware, startKakaoLogin);
userRouter.get('/kakao/finish', publicOnlyMiddleware, finishKakaoLogin);
userRouter.get('/logout', protectedMiddleware, logout);
userRouter
  .route('/edit')
  .all(protectedMiddleware)
  .get(getEdit)
  .post(avatarUpload.single('avatar'), postEdit);
userRouter
  .route('/change-password')
  .all(protectedMiddleware)
  .get(getChangePassword)
  .post(postChangePassword);

userRouter.get('/:id', see);

export default userRouter;
