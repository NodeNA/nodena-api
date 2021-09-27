import multer, { diskStorage } from "multer";

const storage = diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname);
  }
});

// CREATE IMAGE STORAGE
export default multer({
  storage: storage
});