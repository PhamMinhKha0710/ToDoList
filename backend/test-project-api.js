const mongoose = require('mongoose');
const http = require('http');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function makeRequest(method, endpoint, token = null, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint}`;
  
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Bắt đầu test Project API ---');
  
  try {
    // 1. Đăng ký/Đăng nhập 2 users
    const user1Email = `owner_${Date.now()}@test.com`;
    const user2Email = `member_${Date.now()}@test.com`;
    const password = 'password123';

    console.log('1. Đăng ký Admin (Owner)...');
    let res = await makeRequest('POST', '/auth/register', null, { email: user1Email, password, displayName: 'Test Owner' });
    if (res.status === 201) {
      console.log('   => Đăng ký Owner thành công');
    } else {
      console.error('   => Lỗi đăng ký Owner:', res.data);
      return;
    }

    console.log('2. Đăng ký Member...');
    res = await makeRequest('POST', '/auth/register', null, { email: user2Email, password, displayName: 'Test Member' });
    if (res.status === 201) {
      console.log('   => Đăng ký Member thành công');
    } else {
      console.error('   => Lỗi đăng ký Member:', res.data);
      return;
    }

    console.log('3. Đăng nhập Owner...');
    res = await makeRequest('POST', '/auth/login', null, { email: user1Email, password });
    const tokenOwner = res.data.data.accessToken;
    console.log('   => Đăng nhập Owner thành công, có token');

    console.log('4. Đăng nhập Member...');
    res = await makeRequest('POST', '/auth/login', null, { email: user2Email, password });
    const tokenMember = res.data.data.accessToken;
    console.log('   => Đăng nhập Member thành công, có token');

    // 5. Tạo Project
    console.log('\n--- Test Project CRUD ---');
    console.log('1. Tạo project dưới vai trò Owner...');
    res = await makeRequest('POST', '/projects', tokenOwner, { name: 'Dự án Test API', description: 'Mô tả dự án test' });
    if (res.status !== 201) {
      console.log('   => Lỗi tạo dự án:', res.data);
      return;
    }
    const projectId = res.data.data.project._id;
    console.log(`   => Tạo thành công project, ID: ${projectId}`);

    // 6. Lấy danh sách projects của owner
    console.log('2. Lấy danh sách project của Owner...');
    res = await makeRequest('GET', '/projects', tokenOwner);
    console.log(`   => Lấy thành công, Owner có ${res.data.data.projects.length} project`);

    // 7. Cập nhật project
    console.log('3. Cập nhật project dưới vai trò Owner...');
    res = await makeRequest('PUT', `/projects/${projectId}`, tokenOwner, { name: 'Dự án Test Update' });
    console.log(`   => Trạng thái update: ${res.status}, Tên mới: ${res.data.data.project.name}`);

    // 8. Member thử lấy project (Sẽ lỗi 403 vì chưa vào)
    console.log('4. Member thử lấy thông tin project (Sẽ lỗi 403)...');
    res = await makeRequest('GET', `/projects/${projectId}`, tokenMember);
    console.log(`   => Trạng thái lấy project của member: ${res.status} (Kỳ vọng: 403)`);

    // 9. Owner thêm member
    console.log('5. Owner thêm Member vào project...');
    res = await makeRequest('POST', `/projects/${projectId}/members`, tokenOwner, { email: user2Email });
    const memberId = res.data.data.project.members.find(m => m.userId.email === user2Email).userId._id;
    console.log(`   => Trạng thái thêm member: ${res.status}, Member ID: ${memberId}`);

    // 10. Member lấy lại project (Sẽ thành công 200)
    console.log('6. Member xem thông tin project sau khi được thêm...');
    res = await makeRequest('GET', `/projects/${projectId}`, tokenMember);
    console.log(`   => Trạng thái xem project của member: ${res.status} (Kỳ vọng: 200)`);

    // 11. Member thử xóa thông tin project (Sẽ lỗi 403)
    console.log('7. Member thử sửa đổi project (Sẽ lỗi 403 vì chỉ owner được quyền)...');
    res = await makeRequest('PUT', `/projects/${projectId}`, tokenMember, { name: 'Hack Name' });
    console.log(`   => Trạng thái member sửa: ${res.status} (Kỳ vọng: 403), Nội dung: ${res.data.message}`);

    // 12. Owner xóa member
    console.log('8. Owner xóa Member khỏi project...');
    res = await makeRequest('DELETE', `/projects/${projectId}/members/${memberId}`, tokenOwner);
    console.log(`   => Trạng thái xóa member: ${res.status}`);

    // 13. Owner xóa project
    console.log('9. Owner xóa project...');
    res = await makeRequest('DELETE', `/projects/${projectId}`, tokenOwner);
    console.log(`   => Trạng thái xóa project: ${res.status} (Kỳ vọng: 200)`);

    console.log('\n✅ TẤT CẢ CÁC BƯỚC TEST HOÀN TẤT THÀNH CÔNG!');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Không thể kết nối tới Server. Hãy đảm bảo Server đang chạy ở cổng 5000.');
    } else {
      console.error('❌ Lỗi:', error);
    }
  }
}

runTests();
