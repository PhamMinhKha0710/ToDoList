class ProjectResponseDTO {
  constructor(project) {
    this._id = project._id;
    this.name = project.name;
    this.description = project.description;
    this.imageUrl = project.imageUrl;
    this.color = project.color;
    this.members = project.members
      ? project.members.map((member) => ({
          userId: member.userId,
          role: member.role,
          status: member.status,
        }))
      : [];
    this.columnOrder = project.columnOrder;
    this.createdAt = project.createdAt;
    this.updatedAt = project.updatedAt;
  }

  static fromEntity(project) {
    return new ProjectResponseDTO(project);
  }

  static fromEntities(projects) {
    return projects.map((project) => new ProjectResponseDTO(project));
  }
}

module.exports = ProjectResponseDTO;
