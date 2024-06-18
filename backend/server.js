// 모듈 임포트 및 앱설정
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // CORS 미들웨어 추가

const app = express();
const PORT = 3001;

// 미들웨어 설정
app.use(bodyParser.json()); // JSON 형식의 요청 본문을 파싱하도록 body-parser를 사용합니다.
app.use(cors()); // CORS 미들웨어 사용

// 파일 경로 설정
const usersFile = path.join(__dirname, 'data', 'users.json');
const postsFile = path.join(__dirname, 'data', 'posts.json');
const commentsFile = path.join(__dirname, 'data', 'comments.json'); // comments.json 파일의 경로를 설정합니다.


// 댓글 데이터를 읽고 쓰는 함수
const readData = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath)); // 파일을 읽고 JSON 형식으로 파싱합니다.

  } catch (error) {
    return []; // 오류가 발생하면 빈 배열을 반환합니다.
  }
};

// 데이터를 파일에 쓰는 유틸리티 함수
const writeData = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};


// 인증 관련 라우트

// 회원가입 라우트
app.post('/register', (req, res) => {
  const users = readData(usersFile); // 기존 사용자 데이터를 읽기.
  const { username, password } = req.body; // 요청 본문에서 username과 password를 가져오기..

  if (users.find(user => user.username === username)) { // 동일한 username이 존재하는지 확인..
    return res.status(400).json({ message: 'User already exists' }); // 이미 존재하면 에러 메시지를 반환.
  }

  users.push({ username, password }); // 새로운 사용자를 추가.
  writeData(usersFile, users); // 사용자 데이터를 파일에 쓰기.
  res.status(201).json({ message: 'User registered successfully' }); // 성공 메시지를 반환.
});

// 로그인 라우트
app.post('/login', (req, res) => {

    const users = readData(usersFile); // 기존 사용자 데이터를 읽기.
    const { username, password } = req.body; // 요청 본문에서 username과 password를 가져오기.
  
    const user = users.find(user => user.username === username && user.password === password); // 해당 사용자 정보를 찾기.
    
    if (user) {
      res.status(200).json({ message: 'Login successful' });
    } else {
      res.status(400).json({ message: 'Invalid username or password' }); // 존재하지 않으면 에러 메시지를 반환.
    }
  });
  

// 모든 게시물 조회 (Read All) - 카테고리별로 그룹화
app.get('/posts', (req, res) => {
  const posts = readData(postsFile);
  const groupedPosts = posts.reduce((acc, post) => {
    if (!acc[post.category]) {
      acc[post.category] = [];
    }
    acc[post.category].push(post);
    return acc;
  }, {});

  res.status(200).json(posts);
});

// 게시물 생성 (Create)
app.post('/posts', (req, res) => {
  const posts = readData(postsFile); // 기존 게시글 데이터를 읽어옵니다.
  const newPost = { id: Date.now(), ...req.body }; // 새로운 게시글을 생성.
  
  posts.push(newPost);  // 새로운 게시글을 배열에 추가.
  writeData(postsFile, posts); // 게시글 데이터를 파일에 씁니다.
  res.status(201).json(newPost); // 새 게시글 데이터를 반환.
});


// 특정 게시물 조회 (Read One)
app.get('/posts/:id', (req, res) => {
  const posts = readData(postsFile); // 기존 게시글 데이터를 읽기.
  const post = posts.find(p => p.id === parseInt(req.params.id));
  
  if (post) {
    res.status(200).json(post); // 게시글이 존재하면 반환.
  } else {
    res.status(404).json({ message: 'Post not found' }); // 게시글이 없으면 에러 메시지를 반환.
  }
});

// 게시물 수정 (Update)
app.put('/posts/:id', (req, res) => {
  const posts = readData(postsFile);
  const index = posts.findIndex(p => p.id === parseInt(req.params.id));
  if (index !== -1) {
    posts[index] = { ...posts[index], ...req.body };
    writeData(postsFile, posts);
    res.status(200).json(posts[index]);
  } else {
    res.status(404).json({ message: 'Post not found' });
  }
});

// 게시물 삭제 (Delete)
app.delete('/posts/:id', (req, res) => {
  const posts = readData(postsFile);
  const filteredPosts = posts.filter(p => p.id !== parseInt(req.params.id));
  if (posts.length !== filteredPosts.length) {
    writeData(postsFile, filteredPosts);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Post not found' });
  }
});

// 게시물 좋아요 (Like)
app.post('/posts/:id/like', (req, res) => {
  const posts = readData(postsFile);
  const index = posts.findIndex(p => p.id === parseInt(req.params.id));

  if (index !== -1) {
    posts[index].likes += 1; // 좋아요 수 증가

    writeData(postsFile, posts); // 변경된 데이터를 posts.json.파일에 쓴다.
    res.status(200).json(posts[index]);

  } else {
    res.status(404).json({ message: 'Post not found' });
  }
});


// 댓글 관련
// 댓글 생성 (Create)
app.post('/posts/:id/comments', (req, res) => {
  const comments = readData(commentsFile);
  const { content } = req.body; // content 변수를 요청 본문에서 가져오기
  const newComment = { id: Date.now(), postId: parseInt(req.params.id), content };
  
  comments.push(newComment);
  writeData(commentsFile, comments);
  
  res.status(201).json(newComment);
});

// 특정 게시물의 댓글 조회 (Read)
app.get('/posts/:id/comments', (req, res) => {
  
  const comments = readData(commentsFile);
  const postComments = comments.filter(comment => comment.postId === parseInt(req.params.id));
  
  res.status(200).json(postComments);
});



// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
