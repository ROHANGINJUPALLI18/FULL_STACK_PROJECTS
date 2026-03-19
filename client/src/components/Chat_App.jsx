import { MoreVertical, Search, SendHorizontal, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/services/api";
import { io } from "socket.io-client";

function Avatar({ name }) {
  const initials = (name || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
        {initials}
      </div>
      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
    </div>
  );
}

const safeParseUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

function ChatApp() {
  const currentUser = useMemo(() => safeParseUser(), []);
  const token = localStorage.getItem("token");

  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [conversationError, setConversationError] = useState("");

  const [selectedConversationId, setSelectedConversationId] = useState("");

  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState("");

  const [messageInput, setMessageInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const socketRef = useRef(null);
  const selectedConversationIdRef = useRef("");

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const formatTimeAgo = (isoDate) => {
    if (!isoDate) return "";
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const normalizeConversation = (conv) => {
    const participants = conv?.participants || [];
    const otherUser =
      participants.find(
        (participant) => participant?._id !== currentUser?._id,
      ) ||
      participants[0] ||
      {};

    return {
      _id: conv?._id,
      name: otherUser?.name || "Unknown User",
      avatar: otherUser?.avatar || "",
      email: otherUser?.email || "",
      lastMessage: conv?.lastMessage?.text || "No messages yet",
      time:
        formatTimeAgo(conv?.updatedAt) || formatTimeAgo(conv?.createdAt) || "",
    };
  };

  const fetchConversations = async () => {
    if (!token) return;

    setIsLoadingConversations(true);
    setConversationError("");

    try {
      const res = await api.get("/api/conversations", { headers: authHeaders });
      const normalized = (res.data || []).map(normalizeConversation);
      setConversations(normalized);

      if (!selectedConversationId && normalized.length > 0) {
        setSelectedConversationId(normalized[0]._id);
      }
    } catch (err) {
      setConversationError(
        err?.response?.data?.message || "Failed to load conversations",
      );
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    if (!conversationId || !token) return;

    setIsLoadingMessages(true);
    setMessagesError("");

    try {
      const res = await api.get(
        `/api/messages/${conversationId}?page=1&limit=50`,
        {
          headers: authHeaders,
        },
      );
      const latestMessages = Array.isArray(res.data)
        ? [...res.data].reverse()
        : [];
      setMessages(latestMessages);
    } catch (err) {
      setMessagesError(
        err?.response?.data?.message || "Failed to load messages",
      );
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      fetchMessages(selectedConversationId);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    if (!token || !currentUser?._id) return;

    const socketBaseUrl = (
      import.meta.env.VITE_API_URL || "http://localhost:5000"
    ).replace(/\/$/, "");

    const socket = io(socketBaseUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", currentUser._id);
    });

    socket.on("receive_message", (incomingMessage) => {
      if (!incomingMessage?._id) return;

      const incomingConversationId =
        incomingMessage?.conversationId?._id || incomingMessage?.conversationId;

      setMessages((prev) => {
        if (prev.some((message) => message._id === incomingMessage._id)) {
          return prev;
        }

        if (incomingConversationId !== selectedConversationIdRef.current) {
          return prev;
        }

        return [...prev, incomingMessage];
      });

      if (incomingConversationId) {
        setConversations((prev) => {
          const updated = prev.map((conversation) =>
            conversation._id === incomingConversationId
              ? {
                  ...conversation,
                  lastMessage: incomingMessage.text || conversation.lastMessage,
                  time:
                    formatTimeAgo(incomingMessage.updatedAt) ||
                    formatTimeAgo(incomingMessage.createdAt) ||
                    conversation.time,
                }
              : conversation,
          );

          updated.sort((a, b) => {
            if (a._id === incomingConversationId) return -1;
            if (b._id === incomingConversationId) return 1;
            return 0;
          });

          return updated;
        });
      }
    });

    return () => {
      socket.off("receive_message");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, currentUser?._id]);

  useEffect(() => {
    if (!socketRef.current || !selectedConversationId) return;
    socketRef.current.emit("joinConversation", selectedConversationId);
  }, [selectedConversationId]);

  // this below useEffect handles the user search functionality with debouncing(i.e. it waits for 350ms after the user stops typing to make the API call)
  useEffect(() => {
    if (!token) return;

    const trimmed = searchTerm.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const res = await api.get(
          `/api/users/search?q=${encodeURIComponent(trimmed)}&limit=10`,
          { headers: authHeaders },
        );
        setSearchResults(Array.isArray(res.data) ? res.data : []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, token]);

  const selectedConversation =
    conversations.find((conv) => conv._id === selectedConversationId) || null;

  const handleStartConversation = async (otherUserId) => {
    if (!otherUserId || !token) return;

    try {
      const res = await api.post(
        "/api/conversations",
        { otherUserId },
        { headers: authHeaders },
      );
      const conversationId = res?.data?._id;
      await fetchConversations();
      if (conversationId) {
        setSelectedConversationId(conversationId);
      }
      setSearchTerm("");
      setSearchResults([]);
    } catch (err) {
      setConversationError(
        err?.response?.data?.message || "Failed to start conversation",
      );
    }
  };

  const handleSendMessage = async () => {
    const text = messageInput.trim();
    if (!text || !selectedConversationId || !token) return;

    setIsSendingMessage(true);
    setMessagesError("");

    try {
      const res = await api.post(
        "/api/messages",
        { conversationId: selectedConversationId, text },
        { headers: authHeaders },
      );

      setMessages((prev) => {
        if (prev.some((message) => message._id === res.data?._id)) {
          return prev;
        }
        return [...prev, res.data];
      });
      setMessageInput("");
      fetchConversations();
    } catch (err) {
      setMessagesError(
        err?.response?.data?.message || "Failed to send message",
      );
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace("/login");
  };

  return (
    <div className="h-screen w-full bg-[#f5f5f8] p-0 md:p-2">
      <div className="h-full w-full border border-border bg-[#f4f4f7] md:rounded-md overflow-hidden grid grid-cols-1 lg:grid-cols-[380px_1fr]">
        <aside className="h-full bg-[#f8f8fb] border-r border-border/70 flex flex-col">
          <div className="h-24 px-5 flex items-center justify-between border-b border-border/70">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white">
                <UserRound className="h-7 w-7" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground leading-tight">
                  {currentUser?.name || "User"}
                </p>
                <p className="text-muted-foreground text-sm">🟢 Online</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground"
            >
              Logout
            </button>
          </div>

          <div className="px-5 py-5 border-b border-border/70">
            <div className="h-14 rounded-2xl border border-border/70 bg-[#ececf1] px-4 flex items-center gap-3 text-muted-foreground">
              <Search className="h-5 w-5" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search users to start chat..."
                className="w-full bg-transparent outline-none text-lg leading-none placeholder:text-muted-foreground"
              />
            </div>
            {isSearchingUsers && (
              <p className="text-xs text-muted-foreground mt-2">
                Searching users...
              </p>
            )}
            {conversationError && (
              <p className="text-xs text-red-500 mt-2">{conversationError}</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {searchTerm.trim().length >= 2 ? (
              searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="px-5 py-4 border-b border-border/50 cursor-pointer hover:bg-[#efeff4]"
                    onClick={() => handleStartConversation(user._id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} />
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-semibold truncate">
                          {user.name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="px-5 py-4 text-sm text-muted-foreground">
                  No users found.
                </p>
              )
            ) : isLoadingConversations ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">
                Loading conversations...
              </p>
            ) : conversations.length > 0 ? (
              conversations.map((chat) => (
                <div
                  key={chat._id}
                  className={`px-5 py-4 border-b border-border/50 cursor-pointer ${
                    selectedConversationId === chat._id
                      ? "bg-[#e8dff7] border-l-4 border-l-violet-600"
                      : "hover:bg-[#efeff4]"
                  }`}
                  onClick={() => setSelectedConversationId(chat._id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={chat.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-lg leading-none font-semibold text-foreground truncate">
                          {chat.name}
                        </p>
                        <p className="text-muted-foreground text-xs whitespace-nowrap">
                          {chat.time}
                        </p>
                      </div>
                      <p className="mt-2 text-muted-foreground text-sm truncate">
                        {chat.lastMessage}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="px-5 py-4 text-sm text-muted-foreground">
                No conversations yet. Search for a user to start chatting.
              </p>
            )}
          </div>
        </aside>

        <section className="h-full bg-[#f4f4f7] flex flex-col">
          <div className="h-24 px-5 border-b border-border/70 flex items-center justify-between bg-[#f8f8fb]">
            <div className="flex items-center gap-3">
              <Avatar name={selectedConversation?.name || "User"} />
              <div>
                <p className="text-2xl font-semibold text-foreground leading-tight">
                  {selectedConversation?.name || "Select a conversation"}
                </p>
                <p className="text-muted-foreground text-sm">Active now</p>
              </div>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
            {isLoadingMessages ? (
              <p className="text-sm text-muted-foreground">
                Loading messages...
              </p>
            ) : messagesError ? (
              <p className="text-sm text-red-500">{messagesError}</p>
            ) : messages.length > 0 ? (
              messages.map((msg) => {
                const fromCurrentUser = msg?.sender?._id === currentUser?._id;
                return (
                  <div
                    key={msg._id}
                    className={`flex ${fromCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div className="max-w-[70%]">
                      <div
                        className={`rounded-2xl px-5 py-4 text-sm font-medium shadow-sm ${
                          fromCurrentUser
                            ? "bg-gradient-to-r from-violet-600 to-purple-500 text-white"
                            : "bg-white text-foreground border border-border/70"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <p className="text-muted-foreground text-xs mt-2 px-2">
                        {msg.updatedAt && formatTimeAgo(msg.updatedAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                {selectedConversationId
                  ? "No messages yet. Send one to start the chat."
                  : "Select or start a conversation to view messages."}
              </p>
            )}
          </div>

          <div className="h-28 border-t border-border/70 px-5 flex items-center gap-4 bg-[#f8f8fb]">
            <input
              type="text"
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              disabled={!selectedConversationId || isSendingMessage}
              className="h-14 flex-1 rounded-2xl border border-border/70 bg-[#f4f4f7] px-5 text-base outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={handleSendMessage}
              disabled={
                !selectedConversationId ||
                isSendingMessage ||
                !messageInput.trim()
              }
              className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 text-white flex items-center justify-center shadow-md disabled:opacity-50"
            >
              <SendHorizontal className="h-5 w-5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ChatApp;
