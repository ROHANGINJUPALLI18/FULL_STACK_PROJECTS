import { MoreVertical, Search, SendHorizontal, UserRound } from "lucide-react";
import api from "@/services/api";
import {use, useEffect,useState } from "react";



function Avatar({ name }) {
  const initials = name
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




const messages = [
  {
    id: 1,
    text: "Hey! How are you doing?",
    time: "10:30 AM",
    sender: "other",
  },
  {
    id: 2,
    text: "I'm good! Just working on a new project",
    time: "10:32 AM",
    sender: "me",
  },
  {
    id: 3,
    text: "That's awesome! What kind of project?",
    time: "10:33 AM",
    sender: "other",
  },
  {
    id: 4,
    text: "It's a chat application with a really nice purple theme",
    time: "10:35 AM",
    sender: "me",
  },
  {
    id: 5,
    text: "Sounds interesting! Would love to see it when it's done",
    time: "10:36 AM",
    sender: "other",
  },
];


function Chat_App() {
  // the below use-state is for the conversation in the left sidebar
  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversationError, setConversationError] = useState("");
  const [selectedConversation, setSelectedConversation] = useState(null);
  // the below use-state is for the messages in the right section
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState("");



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

useEffect(()=>{
  const fetchChats = async () => {
    setIsLoadingConversations(true);
    setConversationError("");
    
    try {
      const token = localStorage.getItem('token'); 
      if(!token) {
        console.error("No auth token found. Please log in.");
        return;
      }
      const res = await api.get("/api/conversations",{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      const normalizedChats = (res.data || []).map((conv) => {
          const otherUser = conv?.participants?.[0] || {};
          return {
            _id: conv._id,
            name: otherUser.name || "Unknown User",
            avatar: otherUser.avatar || "",
            email: otherUser.email || "",
            lastMessage: conv?.lastMessage?.text || "No messages yet",
            time: formatTimeAgo(conv?.updatedAt) || formatTimeAgo(conv?.createdAt) || "",
        };
      });

      setConversations(normalizedChats);

      console.log("all the available chats:", res.data);
    } catch (err) {
      setConversationError(
          err?.response?.data?.message || "Failed to load conversations"
      );
    }finally{
      setIsLoadingConversations(false);
    }
  };
  fetchChats();
},[])

useEffect(()=>{
  const fetchMessages = async() =>{
    if(!selectedConversation) return;
    setIsLoadingMessages(true);
    setMessagesError("");
    // here you can make an API call to fetch messages for the selected conversation using selectedConversation._id as conversationId
    // example: GET /api/conversations/:conversationId/messages
    const res = await api.get(`/api/messages/${selectedConversation._id}?page=1&limit=20`,{
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
    console.log(res.data);
    
    // and then set the messages state with the response data
    setMessages(res.data || []);
    
  }
    fetchMessages();
},[selectedConversation])


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
                  {JSON.parse(localStorage.getItem("user"))?.name || "User"}
                </p>
                <p className="text-muted-foreground text-sm">
                  🟢Online
                </p>
              </div>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>

          <div className="px-5 py-5 border-b border-border/70">
            <div className="h-14 rounded-2xl border border-border/70 bg-[#ececf1] px-4 flex items-center gap-3 text-muted-foreground">
              <Search className="h-5 w-5" />
              <span className="text-lg leading-none">
                Search conversations...
              </span>
            </div>
          </div>

          {/* the below div is used to display the list of conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversations?.map((chat) => (
              <div
                key={chat._id}
                className={`px-5 py-4 border-b border-border/50 cursor-pointer ${
                  // the below condition is used to highlight the selected conversation 
                  selectedConversation?._id === chat._id
                    ? "bg-[#e8dff7] border-l-4 border-l-violet-600"
                    : "hover:bg-[#efeff4]"
                }`}
                onClick={() => setSelectedConversation(chat)}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={chat.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-2xl leading-none font-semibold text-foreground truncate">
                        {chat.name}
                      </p>
                      <p className="text-muted-foreground text-sm font-semibold whitespace-nowrap">
                        {chat.time}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-muted-foreground text-sm leading-none font-medium truncate">
                        {chat.lastMessage}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </aside>

        <section className="h-full bg-[#f4f4f7] flex flex-col">
          <div className="h-24 px-5 border-b border-border/70 flex items-center justify-between bg-[#f8f8fb]">
            <div className="flex items-center gap-3">
              <Avatar name={selectedConversation?.name || "User"} />
              <div>
                <p className="text-2xl font-semibold text-foreground leading-tight">
                  {selectedConversation?.name || "User"}
                </p>
                <p className="text-muted-foreground text-sm">Active now</p>
              </div>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-7 py-6 space-y-8">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[70%]">
                  <div
                    className={`rounded-2xl px-5 py-4 text-xl leading-none font-medium shadow-sm ${
                      // the below condition is done because in the messages array, I am using sender: "me" and sender: "other" just for demonstration purpose, but in real scenario you should compare msg.sender._id with the logged in user's ID to determine whether the message is sent by the logged in user or not, and then apply the respective styles
                      msg.sender._id === JSON.parse(localStorage.getItem("user"))._id
                        ? "bg-gradient-to-r from-violet-600 to-purple-500 text-white"
                        : "bg-white text-foreground border border-border/70"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <p className="text-muted-foreground text-sm mt-2 px-2">
                    {msg.updatedAt && formatTimeAgo(msg.updatedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="h-28 border-t border-border/70 px-5 flex items-center gap-4 bg-[#f8f8fb]">
            <input
              type="text"
              placeholder="Type a message..."
              className="h-14 flex-1 rounded-2xl border border-border/70 bg-[#f4f4f7] px-5 text-xl leading-none outline-none placeholder:text-muted-foreground"
            />
            <button className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-500 text-white flex items-center justify-center shadow-md">
              <SendHorizontal className="h-5 w-5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Chat_App;
