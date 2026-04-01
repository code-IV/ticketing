const { createClient } = require("@supabase/supabase-js");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

exports.uploadToTemp = async (file) => {
  if (!file.filename) {
    throw new Error(
      "File was not saved to disk. Check Multer storage configuration.",
    );
  }
  return {
    name: file.originalname,
    url: `/tmp/uploads/${file.filename}`,
    path: file.path,
    type: file.mimetype,
    provider: "LOCAL",
  };
};

exports.promoteFile = async (tempPath, filename) => {
  // Resolve target directory from project root
  const targetDir = path.join(
    process.cwd(), // project root
    "public",
    "media",
    "uploads",
  );

  await fs.promises.mkdir(targetDir, { recursive: true });

  const newPath = path.join(targetDir, filename);

  // Atomic move (works on same disk)
  await fs.promises.rename(tempPath, newPath);

  return {
    path: newPath,
    url: `/media/uploads/${filename}`, // URL relative to server
  };
};

exports.deleteFromLocal = async (filePath) => {
  try {
    console.log("path  ", filePath);
    // Check if file exists before trying to delete
    await fs.promises.access(filePath);

    // Delete the file
    await fs.promises.unlink(filePath);

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

exports.supaseSignedUrl = async (files, productId) => {
  const uploads = [];

  for (const file of files || []) {
    const mediaId = uuidv4();

    const ext = file.filename.split(".").pop();
    const type = file.type.startsWith("image") ? "images" : "videos";

    const filePath = `products/${productId}/${type}/${mediaId}.${ext}`;

    // 🔹 main file signed URL
    const { data, error } = await supabase.storage
      .from("media")
      .createSignedUploadUrl(filePath);

    if (error) throw error;

    let thumbnail = null;

    // 🔹 thumbnail handling
    if (file.thumbnail) {
      const thumbExt = file.thumbnail.filename?.split(".").pop() || "jpg";

      const thumbPath = `products/${productId}/thumbnails/${mediaId}.${thumbExt}`;

      const { data: thumbData, error: thumbError } = await supabase.storage
        .from("media")
        .createSignedUploadUrl(thumbPath);

      if (thumbError) throw thumbError;

      thumbnail = {
        path: thumbPath,
        url: `${process.env.SUPABASE_URL}/storage/v1/object/public/media/${thumbPath}`,
        signedUrl: thumbData.signedUrl,
      };
    }

    uploads.push({
      mediaId,
      name: file.filename,
      label: file.label,
      type,
      file: {
        path: filePath,
        url: `${process.env.SUPABASE_URL}/storage/v1/object/public/media/${filePath}`,
        signedUrl: data.signedUrl,
      },
      thumbnail,
    });
  }

  return uploads.length ? uploads : null;
};
