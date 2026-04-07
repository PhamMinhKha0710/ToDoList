const Column = require('../entities/Column');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

// Lazy import to avoid circular dependency
const getProjectService = () => require('../container').projectService;

const requireColumnOwner = catchAsync(async (req, res, next) => {
  const columnId = req.params.columnId;
  const column = await Column.findById(columnId);
  if (!column) {
    throw new ApiError(404, 'Không tìm thấy cột');
  }

  // Owner hoặc Admin mới được phép sửa/xoá cột
  const project = await getProjectService().getProjectById(column.projectId);
  const member = project.members.find(
    (m) => m.userId._id.toString() === req.user._id.toString()
  );
  const role = member ? member.role : null;

  if (role !== 'owner' && role !== 'admin') {
    throw new ApiError(403, 'Chỉ Owner hoặc Admin mới có quyền thay đổi cột');
  }

  req.column = column;
  next();
});

const requireProjectOwnerFromBody = catchAsync(async (req, res, next) => {
  const projectId = req.body.projectId;
  if (!projectId) {
    throw new ApiError(400, 'Thiếu projectId');
  }
  
  // Owner hoặc Admin mới được phép tạo cột
  const project = await getProjectService().getProjectById(projectId);
  const member = project.members.find(
    (m) => m.userId._id.toString() === req.user._id.toString()
  );
  const role = member ? member.role : null;

  if (role !== 'owner' && role !== 'admin') {
    throw new ApiError(403, 'Chỉ Owner hoặc Admin mới có quyền tạo cột');
  }
  
  next();
});

module.exports = { requireColumnOwner, requireProjectOwnerFromBody };
