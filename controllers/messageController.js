const Message = require("../models/Message");
const GhostMessage = require("../models/GhostMessage");

exports.getGlobalMessages = async (req, res) => {
  try {
    const { username, date, time, page = 1, limit = 10 } = req.query;

    const query = { type: "global" };

    if (username) {
      query.from = { $regex: username, $options: "i" };
    }

    if (date) {
      // Filter messages created on the specific date
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    if (time) {
      // Filter messages created at the specific time (hour and minute)
      const timeParts = time.split(":").map(Number);
      const hour = timeParts[0];
      const minute = timeParts.length > 1 ? timeParts[1] : null;

      // Remove any createdAt filter to avoid conflict
      if (query.createdAt) {
        const createdAtFilter = query.createdAt;
        delete query.createdAt;
        query.$and = [{ createdAt: createdAtFilter }];
      } else {
        query.$and = [];
      }

      if (!isNaN(hour)) {
        const start = new Date();
        start.setHours(hour, minute !== null ? minute : 0, 0, 0);
        const end = new Date(start);
        if (minute !== null) {
          end.setMinutes(minute + 1);
        } else {
          end.setHours(hour + 1);
        }
        query.$and.push({
          createdAt: { $gte: start, $lt: end },
        });
      }
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Message.countDocuments(query),
    ]);

    res.json({
      messages,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching global messages:", error);
    res.status(500).json({ error: "Server error fetching messages" });
  }
};

exports.getPrivateMessages = async (req, res) => {
  try {
    const { user1, user2 } = req.query;

    if (!user1 || !user2) {
      return res.status(400).json({ error: "Both user1 and user2 query parameters are required" });
    }

    const query = {
      type: "private",
      $or: [
        { from: user1, to: user2 },
        { from: user2, to: user1 },
      ],
    };

    const messages = await Message.find(query).sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    console.error("Error fetching private messages:", error);
    res.status(500).json({ error: "Server error fetching private messages" });
  }
};

exports.getGhostMessages = async (req, res) => {
  try {
    const { username } = req.query;
    let query = {};
    if (username) {
      query.username = username;
    }
    const ghostMessages = await GhostMessage.find(query).sort({ sentAt: -1 });
    res.json({ ghostMessages });
  } catch (error) {
    console.error("Error fetching ghost messages:", error);
    res.status(500).json({ error: "Server error fetching ghost messages" });
  }
};
