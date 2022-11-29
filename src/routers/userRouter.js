import express from 'express';
import {
  edit,
  remove,
  logout,
  see,
  startGithunLogin,
  finishGithubLogin,
  startKakaoLogin,
  finishKakaoLogin,
} from '../controllers/userController';

const userRouter = express.Router();

userRouter.get('/logout', logout);
userRouter.get('/edit', edit);
userRouter.get('/remove', remove);
userRouter.get('/github/start', startGithunLogin);
userRouter.get('/github/finish', finishGithubLogin);
userRouter.get('/kakao/start', startKakaoLogin);
userRouter.get('/kakao/finish', finishKakaoLogin);

userRouter.get(':id', see);

export default userRouter;
