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

exports.supaseSignedUrl = async (files) => {
  const uploads = [];
  const sessId = uuidv4();

  for (const file of files || []) {
    const mediaId = uuidv4();

    const ext = file.filename.split(".").pop();
    const type = file.type.startsWith("image") ? "images" : "videos";

    const filePath = `uploads/${sessId}/${type}/${mediaId}.${ext}`;

    // 🔹 main file signed URL
    const { data, error } = await supabase.storage
      .from("media")
      .createSignedUploadUrl(filePath);

    if (error) throw error;

    let thumbnail = null;

    // 🔹 thumbnail handling
    if (file.thumbnail) {
      const thumbExt = file.thumbnail.filename?.split(".").pop() || "jpg";

      const thumbPath = `uploads/${sessId}/thumbnails/${mediaId}.${thumbExt}`;

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
      clientId: file.clientId,
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
  if (!uploads.length) return null;
  return { uploads, sessId };
};

exports.checkUploadBySid = async (sessionId, metadata) => {
  if (!Array.isArray(metadata) || metadata.length === 0)
    throw new Error("No metadata provided");

  // 1️⃣ List all files under the session folder
  const { data: files, error } = await supabase.storage
    .from("media")
    .list(`uploads/${sessionId}`, { limit: 1000, recursive: true });

  if (error) throw error;

  const existingPaths = new Set(
    files.map((f) => `uploads/${sessionId}/${f.name}`),
  );

  // 2️⃣ Validate that each file and thumbnail exists
  for (const meta of metadata) {
    if (!existingPaths.has(meta.path)) {
      throw new Error(`Missing uploaded file: ${meta.path}`);
    }

    if (meta.thumbnail?.path && !existingPaths.has(meta.thumbnail.path)) {
      throw new Error(`Missing uploaded thumbnail: ${meta.thumbnail.path}`);
    }
  }

  // 3️⃣ If all files exist, return the original metadata
  return metadata.map((m) => ({
    mediaId: m.id,
    name: m.name,
    path: m.file.path,
    url: m.file.url,
    type: m.type,
    label: m.label,
    thumbnailUrl: m.thumbnail?.url || null,
  }));
};
