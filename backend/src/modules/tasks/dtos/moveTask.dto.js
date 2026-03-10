/**
 * Chuẩn hóa dữ liệu di chuyển Task từ request body
 */
const toMoveTaskDTO = (body) => {
  return {
    sourceColumnId: body.sourceColumnId,
    destinationColumnId: body.destinationColumnId,
    sourceIndex: body.sourceIndex,
    destinationIndex: body.destinationIndex,
  };
};

module.exports = { toMoveTaskDTO };
