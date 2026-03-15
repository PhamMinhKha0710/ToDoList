/**
 * Chuẩn hóa dữ liệu di chuyển Task từ request body (position-based)
 */
const toMoveTaskDTO = (body) => {
  return {
    taskId: body.taskId,
    sourceColumnId: body.sourceColumnId,
    destinationColumnId: body.destinationColumnId,
    sourceTaskIds: body.sourceTaskIds,
    destinationTaskIds: body.destinationTaskIds,
    sourceIndex: body.sourceIndex,
    destinationIndex: body.destinationIndex,
  };
};

module.exports = { toMoveTaskDTO };
