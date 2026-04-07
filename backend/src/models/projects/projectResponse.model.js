const ProjectResponseModel = (project) => ({
  _id: project._id,
  name: project.name,
  description: project.description,
  imageUrl: project.imageUrl,
  color: project.color,
  members: project.members
    ? project.members.map((member) => ({
        userId: member.userId,
        role: member.role,
        status: member.status,
      }))
    : [],
  columnOrder: project.columnOrder,
  owner: project.owner,
  memberCount: project.memberCount,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
});

const fromEntities = (projects) => projects.map((project) => ProjectResponseModel(project));

module.exports = { ProjectResponseModel, fromEntities };
