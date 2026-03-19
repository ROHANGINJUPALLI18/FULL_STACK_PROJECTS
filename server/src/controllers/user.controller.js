import { searchUsers } from "../services/user.service.js";

export const findUsers = async (req, res, next) => {
  try {
    const currentUserId = req.user?.userId || req.user?._id;

    if (!currentUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { q = "", limit = 10 } = req.query;

    const users = await searchUsers({
      query: q,
      currentUserId,
      limit,
    });

    return res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};
