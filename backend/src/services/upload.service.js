class UploadService {
  constructor() {}

  handleUpload(file) {
    if (!file) {
      return null;
    }
    return `/uploads/${file.filename}`;
  }
}

module.exports = new UploadService();
