# Kế Hoạch Cấu Trúc Backend – ToDoList App

## Tổng Quan

Backend sử dụng **Node.js + Express**, database **MongoDB** (Mongoose), xác thực **JWT**, real-time với **Socket.IO**, cache với **Redis** (tùy chọn). Áp dụng kiến trúc **Layered Architecture** theo feature, đảm bảo khả năng mở rộng cao.

```
Backend Pattern: Routes → Controller → Service → Repository → Model
```

---

## 📁 Cấu Trúc Thư Mục Backend

```
backend/
├── src/
│   ├── config/                    # Cấu hình toàn cục
│   │   ├── db.js                  # Kết nối MongoDB
│   │   ├── socket.js              # Khởi tạo Socket.IO
│   │   ├── multer.js              # Cấu hình upload file
│   │   └── env.js                 # Validate & export env vars
│   │
│   ├── modules/                   # Tổ chức theo feature (Domain)
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.validator.js
│   │   │   └── dtos/
│   │   │       ├── register.dto.js    # { email, password, displayName }
│   │   │       └── login.dto.js       # { email, password }
│   │   │
│   │   ├── users/
│   │   │   ├── user.routes.js
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   ├── user.repository.js
│   │   │   ├── user.validator.js
│   │   │   └── dtos/
│   │   │       ├── updateProfile.dto.js  # { displayName, avatarUrl }
│   │   │       ├── changePassword.dto.js # { oldPassword, newPassword }
│   │   │       └── userResponse.dto.js   # Lọc trường trả về (bỏ passwordHash)
│   │   │
│   │   ├── projects/
│   │   │   ├── project.routes.js
│   │   │   ├── project.controller.js
│   │   │   ├── project.service.js
│   │   │   ├── project.repository.js
│   │   │   ├── project.validator.js
│   │   │   └── dtos/
│   │   │       ├── createProject.dto.js  # { name, description }
│   │   │       ├── updateProject.dto.js
│   │   │       ├── inviteMember.dto.js   # { email, role }
│   │   │       └── projectResponse.dto.js
│   │   │
│   │   ├── columns/
│   │   │   ├── column.routes.js
│   │   │   ├── column.controller.js
│   │   │   ├── column.service.js
│   │   │   ├── column.repository.js
│   │   │   ├── column.validator.js
│   │   │   └── dtos/
│   │   │       ├── createColumn.dto.js   # { title, color }
│   │   │       └── updateColumn.dto.js
│   │   │
│   │   ├── tasks/
│   │   │   ├── task.routes.js
│   │   │   ├── task.controller.js
│   │   │   ├── task.service.js
│   │   │   ├── task.repository.js
│   │   │   ├── task.validator.js
│   │   │   └── dtos/
│   │   │       ├── createTask.dto.js     # { title, description, priority, dueDate, color, tags }
│   │   │       ├── updateTask.dto.js
│   │   │       ├── moveTask.dto.js       # { targetColumnId, newTaskOrder }
│   │   │       └── taskResponse.dto.js  # Populate assignee info
│   │   │
│   │   ├── comments/
│   │   │   ├── comment.routes.js
│   │   │   ├── comment.controller.js
│   │   │   ├── comment.service.js
│   │   │   ├── comment.repository.js
│   │   │   ├── comment.validator.js
│   │   │   └── dtos/
│   │   │       ├── createComment.dto.js  # { content, parentId? }
│   │   │       └── commentResponse.dto.js
│   │   │
│   │   ├── attachments/
│   │   │   ├── attachment.routes.js
│   │   │   ├── attachment.controller.js
│   │   │   ├── attachment.service.js
│   │   │   └── attachment.repository.js
│   │   │
│   │   ├── notifications/
│   │   │   ├── notification.routes.js
│   │   │   ├── notification.controller.js
│   │   │   ├── notification.service.js
│   │   │   └── notification.repository.js
│   │   │
│   │   ├── personal-tasks/
│   │   │   ├── personalTask.routes.js
│   │   │   ├── personalTask.controller.js
│   │   │   ├── personalTask.service.js
│   │   │   ├── personalTask.repository.js
│   │   │   ├── personalTask.validator.js
│   │   │   └── dtos/
│   │   │       ├── createPersonalTask.dto.js  # { title, description, startDate, endDate, priority, color }
│   │   │       ├── updatePersonalTask.dto.js
│   │   │       └── updateSubTask.dto.js       # { subTaskId, status, title }
│   │   │
│   │   └── admin/
│   │       ├── admin.routes.js
│   │       ├── admin.controller.js
│   │       └── admin.service.js
│   │
│   ├── models/                    # Mongoose Schemas (tất cả 9 collection)
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── Column.js
│   │   ├── Task.js
│   │   ├── Comment.js
│   │   ├── Attachment.js
│   │   ├── ActivityLog.js
│   │   ├── Notification.js
│   │   └── PersonalTask.js
│   │
│   ├── middlewares/               # Middleware dùng chung
│   │   ├── auth.middleware.js     # Verify JWT
│   │   ├── role.middleware.js     # Phân quyền role (admin/user)
│   │   ├── project.middleware.js  # Kiểm tra quyền trong project
│   │   ├── upload.middleware.js   # Multer upload handler
│   │   ├── validate.middleware.js # Joi/Zod validation runner
│   │   ├── rateLimiter.middleware.js
│   │   └── error.middleware.js    # Global error handler
│   │
│   ├── sockets/                   # Socket.IO event handlers
│   │   ├── index.js               # Đăng ký tất cả socket events
│   │   ├── task.socket.js         # Events: task:created, task:updated, task:moved
│   │   ├── comment.socket.js      # Events: comment:new, comment:deleted
│   │   ├── project.socket.js      # Events: member:invited, column:reordered
│   │   └── notification.socket.js # Emit thông báo real-time
│   │
│   ├── services/                  # Shared/external services
│   │   ├── mail.service.js        # Gửi email (Nodemailer)
│   │   ├── upload.service.js      # Cloudinary / local storage
│   │   └── token.service.js       # JWT generate & verify
│   │
│   ├── utils/                     # Utility functions
│   │   ├── ApiError.js            # Custom Error class
│   │   ├── ApiResponse.js         # Chuẩn hóa response JSON
│   │   ├── catchAsync.js          # Bọc async/await cho controller
│   │   ├── paginate.js            # Helper phân trang
│   │   └── logger.js              # Winston logger
│   │
│   ├── constants/                 # Hằng số toàn hệ thống
│   │   ├── roles.js               # USER, ADMIN, OWNER, MEMBER
│   │   ├── taskStatus.js          # todo, in_progress, done
│   │   ├── priority.js            # urgent, high, normal, low
│   │   └── events.js              # Socket event name constants
│   │
│   ├── routes/                    # Entry point gom tất cả routes
│   │   └── index.js               # app.use('/api/v1', router)
│   │
│   ├── app.js                     # Khởi tạo Express app, middleware
│   └── server.js                  # Start HTTP server + Socket.IO
│
├── uploads/                       # Thư mục lưu file tạm (local)
├── logs/                          # Winston log files
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🗄️ Mongoose Models (9 Collections)

### 1. `User.js`
```js
const userSchema = new Schema({
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ['user', 'admin'], default: 'user' },
  displayName:  { type: String, trim: true },
  avatarUrl:    { type: String },
}, { timestamps: true });
```

### 2. `Project.js`
```js
const memberSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role:   { type: String, enum: ['owner', 'member'], default: 'member' },
}, { _id: false });

const projectSchema = new Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String },
  members:     { type: [memberSchema], default: [] },
  columnOrder: [{ type: Schema.Types.ObjectId, ref: 'Column' }],
}, { timestamps: true });
```

### 3. `Column.js`
```js
const columnSchema = new Schema({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  title:     { type: String, required: true, trim: true },
  color:     { type: String, default: '#0733fa' },
  taskOrder: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
}, { timestamps: true });
```

### 4. `Task.js`
```js
const tagSchema = new Schema({
  name:  { type: String, required: true },
  color: { type: String, default: '#cccccc' },
}, { _id: false });

const taskSchema = new Schema({
  columnId:   { type: Schema.Types.ObjectId, ref: 'Column', required: true },
  assigneeId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  title:      { type: String, required: true, trim: true },
  description:{ type: String },
  status:     { type: String, enum: ['todo','in_progress','done'], default: 'todo' },
  priority:   { type: String, enum: ['urgent','high','normal','low'], default: 'normal' },
  dueDate:    { type: Date },
  color:      { type: String },
  tags:       { type: [tagSchema], default: [] },
}, { timestamps: true });
```

### 5. `Comment.js`
```js
const commentSchema = new Schema({
  taskId:   { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content:  { type: String, required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
}, { timestamps: true });
```

### 6. `Attachment.js`
```js
const attachmentSchema = new Schema({
  taskId:   { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  fileName: { type: String, required: true },
  fileUrl:  { type: String, required: true },
}, { timestamps: true });
```
> *Chỉ có `createdAt`, không cần `updatedAt` → dùng `{ timestamps: { createdAt: true, updatedAt: false } }`*

### 7. `ActivityLog.js`
```js
const activityLogSchema = new Schema({
  projectId:  { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  userId:     { type: Schema.Types.ObjectId, ref: 'User', default: null },
  action:     { type: String, required: true }, // 'TASK_CREATED', 'COLUMN_DELETED'...
  entityType: { type: String },                 // 'task', 'column', 'member'...
  entityId:   { type: Schema.Types.ObjectId },
  detail:     { type: String },                 // JSON string
}, { timestamps: { createdAt: true, updatedAt: false } });
```

### 8. `Notification.js`
```js
const notificationSchema = new Schema({
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type:        { type: String, required: true }, // 'project_invite', 'task_assigned', 'new_comment'
  title:       { type: String },
  message:     { type: String },
  read:        { type: Boolean, default: false },
  metadata:    { type: Schema.Types.Mixed, default: {} }, // { projectId, taskId, commentId }
}, { timestamps: { createdAt: true, updatedAt: false } });
```

### 9. `PersonalTask.js`
```js
const subTaskSchema = new Schema({
  title:     { type: String, required: true },
  status:    { type: String, enum: ['todo','done'], default: 'todo' },
  color:     { type: String },
  position:  { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const personalTaskSchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String },
  startDate:   { type: Date },
  endDate:     { type: Date },
  priority:    { type: String, enum: ['urgent','high','normal','low'], default: 'normal' },
  status:      { type: String, enum: ['todo','in_progress','done'], default: 'todo' },
  color:       { type: String },
  subTasks:    { type: [subTaskSchema], default: [] },
}, { timestamps: true });
```

---

## 🔗 API Endpoints (v1)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| **Auth** | | | |
| POST | `/api/v1/auth/register` | Đăng ký | ❌ |
| POST | `/api/v1/auth/login` | Đăng nhập | ❌ |
| POST | `/api/v1/auth/logout` | Đăng xuất | ✅ |
| POST | `/api/v1/auth/refresh-token` | Làm mới token | ❌ |
| POST | `/api/v1/auth/forgot-password` | Gửi OTP email | ❌ |
| POST | `/api/v1/auth/reset-password` | Đặt lại mật khẩu | ❌ |
| **Users** | | | |
| GET | `/api/v1/users/me` | Lấy profile | ✅ |
| PATCH | `/api/v1/users/me` | Cập nhật profile | ✅ |
| PATCH | `/api/v1/users/me/avatar` | Upload avatar | ✅ |
| PATCH | `/api/v1/users/me/password` | Đổi mật khẩu | ✅ |
| **Projects** | | | |
| GET | `/api/v1/projects` | Danh sách project của tôi | ✅ |
| POST | `/api/v1/projects` | Tạo project | ✅ |
| GET | `/api/v1/projects/:id` | Chi tiết project | ✅ |
| PATCH | `/api/v1/projects/:id` | Cập nhật project | ✅ |
| DELETE | `/api/v1/projects/:id` | Xóa project | ✅ |
| POST | `/api/v1/projects/:id/members` | Mời thành viên | ✅ |
| DELETE | `/api/v1/projects/:id/members/:userId` | Xóa thành viên | ✅ |
| PATCH | `/api/v1/projects/:id/column-order` | Sắp xếp cột | ✅ |
| GET | `/api/v1/projects/:id/activity` | Lịch sử hoạt động | ✅ |
| **Columns** | | | |
| POST | `/api/v1/projects/:id/columns` | Tạo cột | ✅ |
| PATCH | `/api/v1/columns/:id` | Cập nhật cột | ✅ |
| DELETE | `/api/v1/columns/:id` | Xóa cột | ✅ |
| PATCH | `/api/v1/columns/:id/task-order` | Sắp xếp task | ✅ |
| **Tasks** | | | |
| POST | `/api/v1/columns/:id/tasks` | Tạo task | ✅ |
| GET | `/api/v1/tasks/:id` | Chi tiết task | ✅ |
| PATCH | `/api/v1/tasks/:id` | Cập nhật task | ✅ |
| DELETE | `/api/v1/tasks/:id` | Xóa task | ✅ |
| PATCH | `/api/v1/tasks/:id/move` | Di chuyển task | ✅ |
| PATCH | `/api/v1/tasks/:id/assign` | Gán thành viên | ✅ |
| **Comments** | | | |
| GET | `/api/v1/tasks/:id/comments` | Danh sách comment | ✅ |
| POST | `/api/v1/tasks/:id/comments` | Thêm comment | ✅ |
| PATCH | `/api/v1/comments/:id` | Sửa comment | ✅ |
| DELETE | `/api/v1/comments/:id` | Xóa comment | ✅ |
| **Attachments** | | | |
| POST | `/api/v1/tasks/:id/attachments` | Upload file | ✅ |
| DELETE | `/api/v1/attachments/:id` | Xóa file | ✅ |
| **Notifications** | | | |
| GET | `/api/v1/notifications` | Danh sách thông báo | ✅ |
| PATCH | `/api/v1/notifications/:id/read` | Đánh dấu đã đọc | ✅ |
| PATCH | `/api/v1/notifications/read-all` | Đọc tất cả | ✅ |
| **Personal Tasks** | | | |
| GET | `/api/v1/personal-tasks` | Danh sách task cá nhân | ✅ |
| POST | `/api/v1/personal-tasks` | Tạo task cá nhân | ✅ |
| PATCH | `/api/v1/personal-tasks/:id` | Cập nhật | ✅ |
| DELETE | `/api/v1/personal-tasks/:id` | Xóa | ✅ |
| PATCH | `/api/v1/personal-tasks/:id/subtasks` | Cập nhật subtask | ✅ |
| **Admin** | | | |
| GET | `/api/v1/admin/users` | Quản lý users | ✅ Admin |
| PATCH | `/api/v1/admin/users/:id/role` | Đổi role | ✅ Admin |
| DELETE | `/api/v1/admin/users/:id` | Xóa user | ✅ Admin |
| GET | `/api/v1/admin/projects` | Xem tất cả projects | ✅ Admin |
| DELETE | `/api/v1/admin/projects/:id` | Xóa project | ✅ Admin |

---

## ⚡ Socket.IO Events

| Event (Client → Server) | Mô tả |
|------------------------|-------|
| `join:project` | Vào phòng của project |
| `leave:project` | Rời phòng |
| `task:move` | Di chuyển task giữa cột |

| Event (Server → Client) | Mô tả |
|------------------------|-------|
| `task:created` | Task mới được tạo |
| `task:updated` | Task được cập nhật |
| `task:deleted` | Task bị xóa |
| `task:moved` | Task di chuyển cột |
| `comment:new` | Comment mới |
| `comment:deleted` | Comment bị xóa |
| `column:created` | Cột mới |
| `column:deleted` | Cột bị xóa |
| `member:invited` | Thành viên mới |
| `notification:new` | Thông báo real-time |

---

## 📦 Dependencies Chính

| Package | Mục đích |
|---------|----------|
| `express` | HTTP framework |
| `mongoose` | MongoDB ODM |
| `jsonwebtoken` | JWT auth |
| `bcryptjs` | Hash password |
| `socket.io` | Real-time |
| `multer` | Upload file |
| `cloudinary` | File storage (cloud) |
| `nodemailer` | Gửi email |
| `joi` | Validation schema |
| `winston` | Logging |
| `cors` | CORS policy |
| `helmet` | HTTP security headers |
| `express-rate-limit` | Rate limiting |
| `dotenv` | Env management |
