// routes/conversionRoutes.js
const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many conversion requests, please try again later."
});

// Apply rate limiting to all routes
router.use(limiter);

// Helper function to detect image MIME type from base64
const detectImageType = (base64String) => {
  const signatures = {
    '/9j/': 'image/jpeg',
    'iVBORw0KGgo': 'image/png',
    'R0lGOD': 'image/gif',
    'Qk02': 'image/bmp',
    'SUkq': 'image/tiff'
  };

  for (const [signature, type] of Object.entries(signatures)) {
    if (base64String.startsWith(signature)) {
      return type;
    }
  }
  return 'image/jpeg'; // default fallback
};

// Helper function to validate binary string
const validateBinaryString = (binary) => {
  if (!binary) return false;
  if (binary.length % 8 !== 0) return false;
  if (!/^[01]+$/.test(binary)) return false;
  return true;
};

router.post("/img-to-binary", async (req, res) => {
  try {
    const { imageBufferBase64 } = req.body;
    
    // Validate input
    if (!imageBufferBase64) {
      return res.status(400).json({ error: "Image data missing" });
    }
    
    // Check file size (max 5MB)
    const bufferLength = Buffer.byteLength(imageBufferBase64, 'base64');
    if (bufferLength > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "Image too large. Maximum size is 5MB." });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(imageBufferBase64, "base64");
    
    // Convert buffer to binary string
    const binary = Array.from(buffer)
      .map(byte => byte.toString(2).padStart(8, "0"))
      .join("");

    res.json({ 
      binary,
      size: bufferLength,
      mimeType: detectImageType(imageBufferBase64)
    });
  } catch (err) {
    console.error("Image to binary conversion error:", err);
    res.status(500).json({ error: "Conversion failed. Please try again. Error: " + err.message });
  }
});

router.post("/binary-to-img", async (req, res) => {
  try {
    const { binary } = req.body;
    
    // Validate binary string
    if (!validateBinaryString(binary)) {
      return res.status(400).json({ 
        error: "Invalid binary string. Must contain only 0s and 1s and be divisible by 8." 
      });
    }
    
    // Check binary size (max equivalent to 5MB)
    if (binary.length > 5 * 1024 * 1024 * 8) {
      return res.status(400).json({ 
        error: "Binary string too large. Maximum size is equivalent to 5MB." 
      });
    }

    // Convert binary to bytes
    const bytes = [];
    for (let i = 0; i < binary.length; i += 8) {
      const byte = binary.substr(i, 8);
      bytes.push(parseInt(byte, 2));
    }
    
    // Create buffer from bytes
    const buffer = Buffer.from(bytes);
    
    // Convert to base64
    const base64Image = buffer.toString("base64");
    
    // Detect MIME type from buffer
    const mimeType = detectImageType(base64Image);

    res.json({ 
      imageBase64: `data:${mimeType};base64,${base64Image}`,
      mimeType
    });
  } catch (err) {
    console.error("Binary to image conversion error:", err);
    res.status(500).json({ error: "Conversion failed. Please try again. Error: " + err.message });
  }
});

module.exports = router;
