import User from "../models/user.model.js";

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const searchUsers = async ({ query, currentUserId, limit = 10 }) => {
  const trimmedQuery = (query || "").trim();

  if (!trimmedQuery) {
    return [];
  }

  const safePattern = escapeRegex(trimmedQuery);
  const searchRegex = new RegExp(safePattern, "i");

  const users = await User.find({
    _id: { $ne: currentUserId },
    $or: [{ name: searchRegex }, { email: searchRegex }],
  })
    .select("name email avatar")
    .sort({ name: 1 })
    .limit(Number(limit) || 10);

  return users;
};
