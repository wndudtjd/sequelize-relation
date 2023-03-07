const express = require('express')
const jwt = require('jsonwebtoken')
const { Users, UserInfos } = require('../models')
const router = express.Router()

// 회원가입 API
router.post('/users', async (req, res) => {
  const { email, password, name, age, gender, profileImage } = req.body
  const isExistUser = await Users.findOne({
    where: {
      email: email,
    },
  })
  // email과 동일한 유저가 실제로 존재할 때, 에러발생
  if (isExistUser) {
    return res.status(409).json({ message: '이미 존재하는 이메일입니다.' })
  }

  // 사용자 테이블에 데이터 삽입
  const user = await Users.create({ email, password })
  // 사용자 정보 테이블에 데이터를 삽입
  // 어떤 사용자의 사용자 정보인지 내용이 필요
  await UserInfos.create({
    UserId: user.userId, // 현재 사용자 정보가 생성된 사용자의 userid를 할당합니다
    name,
    age,
    gender,
    profileImage,
  })

  return res.status(201).json({ message: '회원가입이 완료되었습니다.' })
})

// 로그인 API
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const user = await Users.findOne({
    where: { email },
  })

  // 1. 해당하는 사용자가 존재하는가
  // 2. 해당하는 사용자의 비밀번호가 존재하는가
  if (!user) {
    return res.status(401).json({ message: '해당하는 사용자가 존재하지 않습니다.' })
  } else if (user.password !== password) {
    return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' })
  }

  // jwt를 생성
  const token = jwt.sign(
    {
      userId: user.userId,
    },
    'customized_secret_key'
  )

  // 쿠키를 발급
  res.cookie('authorization', `Bearer ${token}`)
  // response 할당
  return res.status(200).json({ message: '로그인에 성공하였습니다.' })
})

// 사용자 조회 API
router.get('/users/:userId', async (req, res) => {
  const { userId } = req.params

  // 사용자 테이블과 사용자 정보 테이블에 있는 데이터를 가지고 와야함
  const user = await Users.findOne({
    attributes: ['userId', 'email', 'createdAt', 'updatedAt'],
    include: [
      {
        model: UserInfos,
        attributes: ['name', 'age', 'gender', 'profileImage'],
      },
    ],
  })

  return res.status(200).json({ data: user })
})

module.exports = router
