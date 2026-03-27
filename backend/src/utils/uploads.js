const { createClient } = require("@supabase/supabase-js");
const fs = require("fs").promises;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

exports.uploadToLocal = async (file) => {
  // Multer has already saved the file to /public/uploads/UUID.ext
  if (!file.filename) {
    throw new Error(
      "File was not saved to disk. Check Multer storage configuration.",
    );
  }
  return {
    name: file.originalname,
    url: `/uploads/${file.filename}`, // file.filename is now the UUID
    path: file.path,
    type: file.mimetype,
    provider: "LOCAL",
  };
};

exports.deleteFromLocal = async (filePath) => {
  try {
    console.log("path  ", filePath);
    // Check if file exists before trying to delete
    await fs.access(filePath);

    // Delete the file
    await fs.unlink(filePath);

    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    // If the file doesn't exist, we can consider the job done
    console.log(error);
    if (error.code === "ENOENT") {
      return { success: true, message: "File already gone" };
    }

    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

exports.uploadToSupabase = async (file) => {
  if (!file.path) {
    throw new Error("No file path found from Multer.");
  }

  // 1. Read the file from the temporary local path Multer created
  const fileBuffer = fs.readFileSync(file.path);
  const fileName = `${Date.now()}-${file.originalname}`;
  const bucketName = "media"; // Ensure this bucket exists in Supabase

  // 2. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, fileBuffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw error;

  // 3. Get the Public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucketName).getPublicUrl(fileName);

  // 4. (Optional) Cleanup: Delete the temp file from your server after upload
  fs.unlinkSync(file.path);

  // Return the object formatted for your Knex 'media' table
  return {
    name: file.originalname,
    url: publicUrl,
    type: file.mimetype,
    provider: "SUPABASE",
    metadata: JSON.stringify({
      size: file.size,
      bucket: bucketName,
      path: data.path,
    }),
  };
};
