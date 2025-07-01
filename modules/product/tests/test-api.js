const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// 测试数据
const testData = {
  content: '这是一条测试动态',
  images: ['https://via.placeholder.com/300x200'],
  userId: 1,
  tags: ['测试', '动态'],
  location: '武汉大学',
  visibility: 'public'
};

async function testAPI() {
  try {
    console.log('开始测试API...\n');

    // 1. 测试获取动态列表
    console.log('1. 测试获取动态列表');
    const postsResponse = await axios.get(`${BASE_URL}/posts`);
    console.log('状态码:', postsResponse.status);
    console.log('数据:', postsResponse.data);
    console.log('');

    // 2. 测试获取标签列表
    console.log('2. 测试获取标签列表');
    const tagsResponse = await axios.get(`${BASE_URL}/posts/tags`);
    console.log('状态码:', tagsResponse.status);
    console.log('数据:', tagsResponse.data);
    console.log('');

    // 3. 测试获取推荐动态
    console.log('3. 测试获取推荐动态');
    const recommendResponse = await axios.get(`${BASE_URL}/posts/recommend?userId=1`);
    console.log('状态码:', recommendResponse.status);
    console.log('数据:', recommendResponse.data);
    console.log('');

    // 4. 测试创建动态
    console.log('4. 测试创建动态');
    const createResponse = await axios.post(`${BASE_URL}/posts`, testData);
    console.log('状态码:', createResponse.status);
    console.log('数据:', createResponse.data);
    console.log('');

    const postId = createResponse.data.data.id;

    // 5. 测试获取动态详情
    console.log('5. 测试获取动态详情');
    const detailResponse = await axios.get(`${BASE_URL}/posts/${postId}?userId=1`);
    console.log('状态码:', detailResponse.status);
    console.log('数据:', detailResponse.data);
    console.log('');

    // 6. 测试点赞
    console.log('6. 测试点赞');
    const likeResponse = await axios.post(`${BASE_URL}/posts/${postId}/like`, {
      userId: 1,
      like: true
    });
    console.log('状态码:', likeResponse.status);
    console.log('数据:', likeResponse.data);
    console.log('');

    // 7. 测试收藏
    console.log('7. 测试收藏');
    const collectResponse = await axios.post(`${BASE_URL}/posts/${postId}/collect`, {
      userId: 1,
      collect: true
    });
    console.log('状态码:', collectResponse.status);
    console.log('数据:', collectResponse.data);
    console.log('');

    // 8. 测试添加评论
    console.log('8. 测试添加评论');
    const commentResponse = await axios.post(`${BASE_URL}/posts/${postId}/comments`, {
      userId: 1,
      content: '这是一条测试评论'
    });
    console.log('状态码:', commentResponse.status);
    console.log('数据:', commentResponse.data);
    console.log('');

    // 9. 测试更新动态
    console.log('9. 测试更新动态');
    const updateResponse = await axios.put(`${BASE_URL}/posts/${postId}`, {
      ...testData,
      content: '这是更新后的测试动态',
      userId: 1
    });
    console.log('状态码:', updateResponse.status);
    console.log('数据:', updateResponse.data);
    console.log('');

    // 10. 测试删除动态
    console.log('10. 测试删除动态');
    const deleteResponse = await axios.delete(`${BASE_URL}/posts/${postId}`, {
      data: { userId: 1 }
    });
    console.log('状态码:', deleteResponse.status);
    console.log('数据:', deleteResponse.data);
    console.log('');

    console.log('所有API测试完成！');

  } catch (error) {
    console.error('API测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 检查服务器是否运行
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/posts`);
    console.log('服务器运行正常，开始测试...\n');
    await testAPI();
  } catch (error) {
    console.error('服务器未运行或无法访问');
    console.error('请确保服务器已启动: npm start');
  }
}

checkServer(); 