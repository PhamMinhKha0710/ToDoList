class UploadService {
  /**
   * Process and return the accessible URL for the uploaded file
   * @param {Object} file - The file object from multer
   * @returns {string} The public URL to access the file
   */
  handleUpload(file) {
    if (!file) {
      return null;
    }
    
    // Construct the public URL path. 
    // Since express.static will serve /public, 
    // the URL should map to /uploads/...
    // Note: Assuming API base URL is handled by the frontend, 
    // we return the relative path from the server root.
    return `/uploads/${file.filename}`;
  }
}

module.exports = new UploadService();
