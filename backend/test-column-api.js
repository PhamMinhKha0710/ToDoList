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
  console.log('--- Bắt đầu test Column API ---');
  
  try {
    const user1Email = `col_owner_${Date.now()}@test.com`;
    const user2Email = `col_member_${Date.now()}@test.com`;
    const password = 'password123';

    // 1. Đăng ký & Đăng nhập
    await makeRequest('POST', '/auth/register', null, { email: user1Email, password, displayName: 'Test Owner' });
    await makeRequest('POST', '/auth/register', null, { email: user2Email, password, displayName: 'Test Member' });
    
    let res = await makeRequest('POST', '/auth/login', null, { email: user1Email, password });
    const tokenOwner = res.data.data.accessToken;
    
    res = await makeRequest('POST', '/auth/login', null, { email: user2Email, password });
    const tokenMember = res.data.data.accessToken;

    console.log('✅ Đăng ký / Đăng nhập thành công');

    // 2. Tạo Project
    res = await makeRequest('POST', '/projects', tokenOwner, { name: 'Dự án Test Column' });
    const projectId = res.data.data.project._id;
    console.log(`✅ Tạo Project thành công, ID: ${projectId}`);

    // Thêm member vào project để test quyền
    await makeRequest('POST', `/projects/${projectId}/members`, tokenOwner, { email: user2Email });

    // 3. Owner tạo Column
    console.log('\n--- Bắt đầu test Column ---');
    console.log('1. Owner tạo Column...');
    res = await makeRequest('POST', '/columns', tokenOwner, { projectId, title: 'Cột Cần Làm', color: '#ff0000' });
    if (res.status !== 201) {
      console.log('   => Lỗi tạo column:', res.data);
      return;
    }
    const columnId = res.data.data.column._id;
    console.log(`   📝 Owner tạo cột thành công: ${columnId}`);

    // 4. Kiểm tra columnOrder trong Project
    console.log('2. Kiểm tra columnOrder trong Project...');
    res = await makeRequest('GET', `/projects/${projectId}`, tokenOwner);
    const columnOrder = res.data.data.project.columnOrder;
    console.log(`   📝 Trong Project chứa mảng columnOrder:`, columnOrder);
    if (!columnOrder.includes(columnId)) {
      console.error('   => FAILED: columnId không tồn tại trong columnOrder của Project');
    }

    // 5. Member thử tạo Column
    console.log('3. Member thử tạo Column (kỳ vọng 403)...');
    res = await makeRequest('POST', '/columns', tokenMember, { projectId, title: 'Cột Hack' });
    console.log(`   => Member tạo cột status: ${res.status}`);

    // 6. Owner cập nhật Column
    console.log('4. Owner cập nhật Column...');
    res = await makeRequest('PUT', `/columns/${columnId}`, tokenOwner, { title: 'Đã cập nhật tên cột' });
    console.log(`   📝 Cập nhật tên mới: ${res.data.data.column.title}`);

    // 7. Member thử xóa Column
    console.log('5. Member thử xóa Column (kỳ vọng 403)...');
    res = await makeRequest('DELETE', `/columns/${columnId}`, tokenMember);
    console.log(`   => Member xóa cột status: ${res.status}`);

    // 8. Owner xóa Column
    console.log('6. Owner xóa Column...');
    res = await makeRequest('DELETE', `/columns/${columnId}`, tokenOwner);
    console.log(`   => Owner xóa cột status: ${res.status}`);

    // 9. Kiểm tra columnOrder bị xóa khỏi Project
    console.log('7. Kiểm tra columnOrder sau khi xóa...');
    res = await makeRequest('GET', `/projects/${projectId}`, tokenOwner);
    const columnOrderAfter = res.data.data.project.columnOrder;
    console.log(`   📝 mảng columnOrder hiện tại:`, columnOrderAfter);
    if (columnOrderAfter.includes(columnId)) {
      console.error('   => FAILED: columnId chưa bị xóa khỏi columnOrder');
    }

    console.log('\n✅ TẤT CẢ CÁC BƯỚC TEST COLUMN HOÀN TẤT!');
  } catch (error) {
    console.error('❌ Lỗi chạy test:', error);
  }
}

runTests();
